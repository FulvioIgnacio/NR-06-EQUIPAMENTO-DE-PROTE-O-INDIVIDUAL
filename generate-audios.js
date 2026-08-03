/* ============================================================
   GENERATE AUDIOS — NR-06 Equipamento de Proteção Individual
   ------------------------------------------------------------
   Lê os HTMLs do curso, monta a lista de áudios a gerar (1 por slide
   ou múltiplos por estado em slides com quiz) e bate na API de TTS
   gravando cada MP3 em audios/.

   USO:
     node generate-audios.js              # gera somente o que estiver faltando
     node generate-audios.js --force      # regenera todos
     node generate-audios.js --dry-run    # imprime o manifesto e NÃO chama a API
     node generate-audios.js --only=pagina-10-q1,pagina-10-q2

   A pasta audios/ é mantida (não é apagada); arquivos existentes são
   ignorados por padrão (resume seguro).
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const AUDIO_DATA = require('./audio-data.js');

// ───────── CONFIG ─────────────────────────────────────────────────
const API_URL = 'https://texttospeech.escolatecnocursos.cloud/api/tts';
const API_TOKEN = 'Bearer eyJzdWIiOiJ0ZWNub2N1cnNvcy10ZXh0dG9zcGVlY2gifQ.w4-wYfGzQXcHMV9Gynkj5JdQc3De7WFIMTskxFYXsII';
const OUT_DIR = path.join(__dirname, 'audios-novos');
const RETRIES = 3;
const SLEEP_BETWEEN_MS = 500;   // pausa entre chamadas (evita rate-limit)

// ───────── CLI ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY = args.includes('--dry-run');
const ONLY = (() => {
    const o = args.find(a => a.startsWith('--only='));
    if (!o) return null;
    return new Set(o.slice('--only='.length).split(',').map(s => s.trim()).filter(Boolean));
})();

// ───────── UTILS ──────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripEmojis(s) {
    if (!s) return '';
    return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu, ' ');
}

function normalizeWS(s) {
    return (s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText(s) {
    let t = stripEmojis(s);
    // Pontuação repetida que confunde o TTS
    t = t.replace(/[·•●▪►–—]+/g, '. ');
    t = t.replace(/\.{2,}/g, '.');
    t = t.replace(/[ ]{2,}/g, ' ');
    return normalizeWS(t);
}

/* Coleta texto de um elemento inserindo espaços entre nós de bloco
   (textContent simples não separa por whitespace). jsdom não suporta
   innerText, então fazemos manualmente.                              */
const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'CANVAS', 'DD',
    'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER',
    'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI',
    'MAIN', 'NAV', 'NOSCRIPT', 'OL', 'P', 'PRE', 'SECTION', 'TABLE',
    'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL', 'BUTTON'
]);

function getBlockAwareText(el) {
    let out = '';
    function walk(node) {
        if (!node) return;
        if (node.nodeType === 3) {                         // text
            out += node.nodeValue;
        } else if (node.nodeType === 1) {                  // element
            const isBlock = BLOCK_TAGS.has(node.tagName);
            if (isBlock) out += ' ';
            for (const c of node.childNodes) walk(c);
            if (isBlock) out += ' ';
        }
    }
    walk(el);
    return out;
}

/* Extrai o texto narrável de um slide do DOM, removendo tudo que é
   visual/decorativo, scripts, iframes, painéis multi-estado, etc.   */
function extractSlideText(slideEl) {
    if (!slideEl) return '';
    const clone = slideEl.cloneNode(true);

    const REMOVE_SELECTORS = [
        'script', 'style', 'noscript', 'svg', 'iframe', 'audio', 'video',
        'canvas', 'embed', 'object', 'img', 'picture', 'source',
        '[aria-hidden="true"]',
        '.wave',
        '.q-dots', '.qdot2',
        // Painéis dinâmicos de quiz / micro-quiz (tratados via MULTI_STATE)
        '[id$="-intro-panel"]',
        '[id$="-question-panel"]',
        '[id$="-result-panel"]',
        '[id$="-feedback"]',
        '[id$="-verify-container"]',
        '#q6-btn-music-toggle',
        '[id$="-hud-status"]'
    ];
    REMOVE_SELECTORS.forEach(sel => {
        clone.querySelectorAll(sel).forEach(n => n.remove());
    });

    return cleanText(getBlockAwareText(clone));
}

function loadSlides(file) {
    const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const out = {};
    doc.querySelectorAll('.slide').forEach(el => {
        if (el.id) out[el.id] = el;
    });
    return out;
}

// ───────── BUILD MANIFEST ─────────────────────────────────────────
function buildManifest() {
    const entries = [];

    for (const [file, slideIds] of Object.entries(AUDIO_DATA.SLIDE_ORDER)) {
        const slides = loadSlides(file);

        slideIds.forEach((slideId) => {
            const slideEl = slides[slideId];
            if (!slideEl) {
                console.warn(`[!] Slide #${slideId} não encontrado em ${file}`);
                return;
            }
            const globalN = AUDIO_DATA.globalSlideOf(file, slideId);
            const isMulti = AUDIO_DATA.MULTI_STATE[slideId];

            if (isMulti) {
                // Intro (se existir)
                if (isMulti.intro) {
                    entries.push({
                        file: `pagina-${globalN}-intro.mp3`,
                        text: cleanText(isMulti.intro),
                        slideId, globalN, state: 'intro', sourceFile: file
                    });
                }
                // Cada pergunta
                isMulti.questions.forEach((qText, i) => {
                    entries.push({
                        file: `pagina-${globalN}-q${i + 1}.mp3`,
                        text: cleanText(qText),
                        slideId, globalN, state: 'q' + (i + 1), sourceFile: file
                    });
                });
                // Resultado (se existir)
                if (isMulti.result) {
                    entries.push({
                        file: `pagina-${globalN}-result.mp3`,
                        text: cleanText(isMulti.result),
                        slideId, globalN, state: 'result', sourceFile: file
                    });
                }
            } else {
                // Slide simples → 1 áudio só
                const text = AUDIO_DATA.OVERRIDES[slideId] || extractSlideText(slideEl);
                entries.push({
                    file: `pagina-${globalN}.mp3`,
                    text,
                    slideId, globalN, state: 'main', sourceFile: file
                });
            }
        });
    }
    return entries;
}

// ───────── API CALL ───────────────────────────────────────────────
async function callTTS(text) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_TOKEN
        },
        body: JSON.stringify({ text })
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();

    // Se vier JSON com URL, baixamos o arquivo apontado
    if (ct.includes('application/json')) {
        const j = await res.json();
        const audioUrl = j.audioUrl || j.url || j.audio_url || j.data && (j.data.url || j.data.audioUrl);
        if (!audioUrl) {
            throw new Error('Resposta JSON sem URL de áudio: ' + JSON.stringify(j).slice(0, 300));
        }
        const r2 = await fetch(audioUrl);
        if (!r2.ok) throw new Error(`HTTP ${r2.status} ao baixar áudio de ${audioUrl}`);
        return Buffer.from(await r2.arrayBuffer());
    }

    // Caso padrão: binário direto (audio/mpeg, audio/mp3, application/octet-stream)
    return Buffer.from(await res.arrayBuffer());
}

async function callTTSWithRetry(text) {
    let lastErr;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
        try {
            return await callTTS(text);
        } catch (e) {
            lastErr = e;
            console.warn(`   tentativa ${attempt}/${RETRIES} falhou: ${e.message}`);
            await sleep(1500 * attempt);
        }
    }
    throw lastErr;
}

// ───────── MAIN ───────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const manifest = buildManifest();

    // Grava manifesto para inspeção / debug
    const manifestPath = path.join(__dirname, 'audios-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Manifesto: ${manifest.length} entradas (salvo em ${path.basename(manifestPath)})`);

    if (DRY) {
        console.log('\n[--dry-run] Nada será enviado para a API. Resumo:');
        manifest.forEach(e => {
            console.log(`  ${e.file.padEnd(28)} (${e.text.length} chars)  "${e.text.slice(0, 90)}${e.text.length > 90 ? '…' : ''}"`);
        });
        return;
    }

    let ok = 0, skip = 0, fail = 0;
    for (let i = 0; i < manifest.length; i++) {
        const e = manifest[i];
        const target = path.join(OUT_DIR, e.file);

        if (ONLY && !ONLY.has(e.file.replace(/\.mp3$/, ''))) { skip++; continue; }

        if (!FORCE && fs.existsSync(target) && fs.statSync(target).size > 1000) {
            skip++;
            continue;
        }

        if (!e.text || e.text.length < 3) {
            console.warn(`[skip] ${e.file}: texto vazio`);
            skip++;
            continue;
        }

        const prefix = `[${(i + 1).toString().padStart(2)}/${manifest.length}]`;
        console.log(`${prefix} ${e.file}  (${e.text.length} chars)`);

        try {
            const buf = await callTTSWithRetry(e.text);
            fs.writeFileSync(target, buf);
            console.log(`         OK — ${(buf.length / 1024).toFixed(1)} KB`);
            ok++;
        } catch (err) {
            console.error(`         FALHOU: ${err.message}`);
            fail++;
        }

        if (i < manifest.length - 1) await sleep(SLEEP_BETWEEN_MS);
    }

    console.log(`\nResumo: ${ok} gerados, ${skip} pulados, ${fail} falhas.`);
    if (fail > 0) process.exitCode = 1;
}

main().catch(err => {
    console.error('ERRO FATAL:', err);
    process.exit(1);
});
