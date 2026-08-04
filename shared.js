/* ============================================================
   NR 11 — EMPILHADEIRA ELÉTRICA RETRÁTIL E COMBUSTÃO — Shared logic (split refactor)
   ============================================================ */
function openImageModal(src) {
    const modal = document.getElementById('imgModal');
    const img = document.getElementById('modalImg');
    if (!modal || !img) return;
    img.src = src;
    modal.classList.add('active');
}
function closeImageModal(e) {
    const modal = document.getElementById('imgModal');
    if (!modal) return;
    modal.classList.remove('active');
}

/* Seta “tem mais conteúdo” no mobile */
const _slideScrollBtns = {};
const _SCROLL_BTN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

window.scrollSlideDown = function (slideId) {
    const cfg = _slideScrollBtns[slideId];
    const area = cfg ? cfg.area : document.querySelector('#' + slideId + ' .content-area');
    if (!area) return;
    area.scrollBy({ top: Math.max(160, area.clientHeight * 0.55), behavior: 'smooth' });
};

function updateSlideScrollBtn(slideId) {
    const cfg = _slideScrollBtns[slideId];
    if (!cfg) return;
    if (!window.matchMedia('(max-width: 768px)').matches) {
        cfg.btn.classList.add('is-hidden');
        return;
    }
    const slide = document.getElementById(slideId);
    // Carrosséis (step-car / pic-car): sem seta de scroll — conteúdo já cabe na tela
    if (slide && slide.querySelector('.step-car-nav, .pic-car-nav, .step-car, .pic-car, [data-step-carousel], [data-pic-carousel]')) {
        cfg.btn.classList.add('is-hidden');
        return;
    }
    const needsScroll = cfg.area.scrollHeight > cfg.area.clientHeight + 12;
    const atBottom = cfg.area.scrollTop + cfg.area.clientHeight >= cfg.area.scrollHeight - 12;
    cfg.btn.classList.toggle('is-hidden', !needsScroll || atBottom);
}

window.updateSlideScrollBtn = updateSlideScrollBtn;

function refreshActiveSlideScrollBtn() {
    const active = document.querySelector('.slide.active');
    if (active && active.id) updateSlideScrollBtn(active.id);
}

function scheduleScrollBtnRefresh() {
    requestAnimationFrame(refreshActiveSlideScrollBtn);
    setTimeout(refreshActiveSlideScrollBtn, 80);
    setTimeout(refreshActiveSlideScrollBtn, 320);
    setTimeout(refreshActiveSlideScrollBtn, 700);
}

window.refreshActiveSlideScrollBtn = refreshActiveSlideScrollBtn;
window.scheduleScrollBtnRefresh = scheduleScrollBtnRefresh;

function registerSlideScrollBtn(slideId, btn, area) {
    if (_slideScrollBtns[slideId]) return;
    _slideScrollBtns[slideId] = { btn: btn, area: area };
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        scrollSlideDown(slideId);
    });
    area.addEventListener('scroll', function () { updateSlideScrollBtn(slideId); }, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(function () { updateSlideScrollBtn(slideId); });
        ro.observe(area);
    }
    updateSlideScrollBtn(slideId);
}

function ensureSlideScrollBtn(slide) {
    if (!slide || !slide.id) return;
    const area = slide.querySelector('.content-area');
    if (!area) return;
    let btn = slide.querySelector(':scope > .slide-scroll-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slide-scroll-btn is-hidden';
        btn.setAttribute('aria-label', 'Rolar para baixo');
        btn.innerHTML = _SCROLL_BTN_SVG;
        slide.appendChild(btn);
    }
    registerSlideScrollBtn(slide.id, btn, area);
}

function initAllSlideScrollBtns() {
    document.querySelectorAll('.slide').forEach(ensureSlideScrollBtn);
    scheduleScrollBtnRefresh();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSlideScrollBtns);
} else {
    initAllSlideScrollBtns();
}


/* ════════════════════════════════════════
   NAVIGATION CORE
   ════════════════════════════════════════ */

// ===== Persistence helpers =====
(function clearNr11Persistence() {
    try {
        var lsKeys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && (k.indexOf('nr11_') === 0 || k.indexOf('tutorial_nr11') === 0)) lsKeys.push(k);
        }
        lsKeys.forEach(function (k) { localStorage.removeItem(k); });
        var ssKeys = [];
        for (var j = 0; j < sessionStorage.length; j++) {
            var sk = sessionStorage.key(j);
            if (sk && sk.indexOf('nr11_') === 0) ssKeys.push(sk);
        }
        ssKeys.forEach(function (k) { sessionStorage.removeItem(k); });
    } catch (e) { }
})();
try {
    if (window.location.search) {
        history.replaceState(null, '', window.location.pathname);
    }
} catch (e) { }

function getPageKey() {
    try {
        if (window.MODULE_NAV && window.MODULE_NAV.id) return window.MODULE_NAV.id;
        const p = window.location.pathname.split('/').pop() || 'index.html';
        return p.replace(/\.html$/i, '') || 'index';
    } catch (e) { return 'index'; }
}

function _loadReqState() {
    // No persistence: always start with empty requirements
    return [];
}
function _saveReqState(arr) {
    // No persistence: do nothing
}


// === GLOBAL SLIDE INDEXING ===
function completePlaceholderVideo(btn) {
    const wrap = btn && btn.closest ? btn.closest('.video-wrap') : null;
    if (!wrap) return;
    wrap.classList.add('req-done');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '✓ Assistido';
        btn.style.opacity = '0.85';
    }
    const badge = wrap.querySelector('.vp-status');
    if (badge) badge.textContent = 'CONCLUÍDO';
    try { playBeep('flip'); } catch (e) { }
    try { updateNextButton(); } catch (e) { }
}

const NR11_MODULE_OFFSETS = {
    'index': 0,
    'modulo-1': 2,
    'modulo-2': 12,
    'modulo-3': 22,
    'modulo-4': 34
};
const NR11_TOTAL_SLIDES = 47;
function nr11GlobalSlide() {
    if (typeof currentSlide === 'undefined') return 1;
    const offset = NR11_MODULE_OFFSETS[(window.MODULE_NAV && window.MODULE_NAV.id) || 'index'] || 0;
    return offset + currentSlide + 1;
}
const QUIZ_AUDIO_HELPER_PAGES = [5, 12, 22, 34, 46];
const QUIZ_AUDIO_HELPER_PANELS = {
    's-m1-g01': 'mito-question-panel',
    's-m1-quiz': 'q1-question-panel',
    's-m2-quiz': 'q2-question-panel',
    's-m3-game': 'q3-question-panel',
    's-m4-quiz': 'q4-question-panel'
};
window.updateQuizAudioHelper = function updateQuizAudioHelper() {
    const bar = document.getElementById('a11y-bar');
    const audioHelper = bar && bar.querySelector('.audio-helper');
    if (!audioHelper) return;

    let show = false;
    if (QUIZ_AUDIO_HELPER_PAGES.includes(nr11GlobalSlide())) {
        const activeSlide = document.querySelector('.slide.active');
        const panelId = activeSlide && QUIZ_AUDIO_HELPER_PANELS[activeSlide.id];
        if (panelId) {
            const panel = document.getElementById(panelId);
            show = !!(panel && window.getComputedStyle(panel).display !== 'none');
        }
    }

    audioHelper.classList.toggle('is-active', show);
    if (bar) bar.classList.toggle('quiz-audio-helper', show);
};

/* ════════════════════════════════════════
   RELOAD GUARD: refresh sempre volta pro index
   ════════════════════════════════════════ */
// O script que forçava a limpeza do localStorage ao recarregar a página foi removido
// a pedido do usuário para preservar a página (o progresso) quando o usuário sair.

/* ════════════════════════════════════════
   GLOBAL HISTORY SYSTEM
   ════════════════════════════════════════ */
function trackHistory(slideIndex) {
    // Removed persistence
}

function popHistory() {
    return null;
}

/* ════════════════════════════════════════
   MODULE NAVIGATION (multi-page refactor)
   ════════════════════════════════════════ */
window.MODULE_NAV = window.MODULE_NAV || { id: 'index', prev: null, next: null, label: 'Capa' };

function moduleNext(force) {
    try { playBeep && playBeep('click'); } catch (e) { }
    const total = document.querySelectorAll('.slide').length;
    if (currentSlide === total - 1) {
        if (!window.MODULE_NAV.next) return;
        if (!force && !isSlideCompleted(currentSlide)) {
            alert('Você precisa concluir o quiz deste módulo para avançar.');
            return;
        }
        pauseAllSlideVideos();
        try { sessionStorage.setItem('nr06_nav_entry', 'first'); } catch (e) { }
        window.location.href = window.MODULE_NAV.next;
        return;
    }
    goTo(currentSlide + 1, !!force);
}
window.moduleNext = moduleNext;

function modulePrev(force) {
    try { playBeep && playBeep('click'); } catch (e) { }
    if (currentSlide === 0) {
        if (!window.MODULE_NAV.prev) return;
        pauseAllSlideVideos();
        // Ao voltar para o módulo anterior, abrir na ÚLTIMA tela dele
        // (uma por uma), e não no início do módulo.
        try { sessionStorage.setItem('nr06_nav_entry', 'last'); } catch (e) { }
        window.location.href = window.MODULE_NAV.prev;
        return;
    }
    goTo(currentSlide - 1, true);
}
window.modulePrev = modulePrev;

const TOTAL = document.querySelectorAll('.slide').length;
let currentSlide = 0;

function startCourse() {
    const clickAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    clickAudio.volume = 0.4;
    clickAudio.play().catch(e => console.log('Audio error:', e));
    goTo(1, true);
}

function buildDots() {
    const dots = document.getElementById('nav-dots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
        const d = document.createElement('div');
        d.className = 'ndot' + (i === currentSlide ? ' cur' : '');
        d.onclick = () => goTo(i, true);
        dots.appendChild(d);
    }
}

window.demoMode = (function () {
    try { return sessionStorage.getItem('nr06-demoMode') === '1'; } catch (e) { return false; }
})();
window._s44FinalizarUnlocked = false;

function isDemoBtnRevealed() {
    try { return sessionStorage.getItem('nr06-demoBtnVisible') === '1'; } catch (e) { return false; }
}

function setDemoBtnRevealed(visible) {
    try { sessionStorage.setItem('nr06-demoBtnVisible', visible ? '1' : '0'); } catch (e) { }
}

function s44HideFinalizarBtn() {
    window._s44FinalizarUnlocked = false;
    const btn = document.getElementById('s44-btn-final');
    if (!btn) return;
    btn.style.display = 'none';
    btn.classList.remove('is-visible');
    btn.setAttribute('aria-hidden', 'true');
}

function s44RevealFinalizarBtn() {
    if (window._s44FinalizarUnlocked) return;
    const btn = document.getElementById('s44-btn-final');
    if (!btn) return;
    window._s44FinalizarUnlocked = true;
    try { playTechClick(); } catch (e) { }
    btn.style.display = 'inline-flex';
    btn.setAttribute('aria-hidden', 'false');
    btn.classList.remove('is-visible');
    void btn.offsetWidth;
    btn.classList.add('is-visible');
}

function toggleDemoMode() {
    window.demoMode = !window.demoMode;
    try { sessionStorage.setItem('nr06-demoMode', window.demoMode ? '1' : '0'); } catch (e) { }
    /* Botão só permanece visível enquanto a simulação estiver ligada (via qa1010). */
    setDemoBtnRevealed(!!window.demoMode);
    applyDemoModeUI();
}

function applyDemoModeUI() {
    const btn = document.getElementById('btn-demo');
    const ind = document.getElementById('demo-indicator');
    /* Visível apenas se a simulação estiver ligada (comando qa1010). */
    var revealBtn = !!window.demoMode;

    if (window.demoMode) {
        setDemoBtnRevealed(true);
        revealBtn = true;
    } else {
        setDemoBtnRevealed(false);
        revealBtn = false;
    }

    if (btn) {
        btn.classList.toggle('demo-shortcut-visible', !!revealBtn);
        btn.classList.toggle('is-demo-on', !!window.demoMode);
        btn.classList.toggle('is-demo-off', !window.demoMode);
        if (window.matchMedia('(min-width: 769px)').matches) {
            btn.removeAttribute('onmouseover');
            btn.removeAttribute('onmouseout');
            btn.onmouseover = null;
            btn.onmouseout = null;
            btn.style.removeProperty('color');
            btn.style.removeProperty('background');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('box-shadow');
        }
    }
    if (ind) {
        ind.classList.toggle('demo-shortcut-visible', !!window.demoMode);
        if (window.demoMode) {
            ind.style.opacity = '1';
            ind.style.transform = 'translateY(0)';
        } else {
            ind.style.opacity = '0';
            ind.style.transform = 'translateY(-12px)';
        }
    }

    const activeSlide = document.querySelector('.slide.active');
    if (activeSlide && activeSlide.id === 's43') {
        const rPanel = document.getElementById('q6-result-panel');
        if (window.demoMode) {
            if (rPanel) rPanel.classList.add('req-done');
        } else {
            const status = document.getElementById('q6-status');
            const approved = status && status.classList.contains('ap');
            if (rPanel && !approved) rPanel.classList.remove('req-done');
        }
    }

    updateNextButton();
    if (typeof window.positionA11yBar === 'function') window.positionA11yBar();
}

/* Atalho oculto: digite qa1010 para ligar/desligar o Modo Simulação. */
(function initDemoShortcutReveal() {
    var seq = '';
    var target = 'qa1010';
    window.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
        if (!e.key || e.key.length !== 1) return;
        seq = (seq + e.key.toLowerCase()).slice(-target.length);
        if (seq !== target) return;
        seq = '';
        toggleDemoMode();
        try { playBeep && playBeep('click'); } catch (err) { }
    });
})();

/* Mobile: 5 toques na logo (em ~2.5s) liga/desliga Modo Simulação */
(function initLogoTapDemoShortcut() {
    var taps = 0;
    var resetTimer = null;
    var lastTouchAt = 0;
    var WINDOW_MS = 2500;
    var NEED = 5;

    function onLogoActivate() {
        taps += 1;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
            taps = 0;
            resetTimer = null;
        }, WINDOW_MS);
        if (taps < NEED) return;
        taps = 0;
        if (resetTimer) {
            clearTimeout(resetTimer);
            resetTimer = null;
        }
        toggleDemoMode();
        try { playBeep && playBeep('click'); } catch (err) { }
    }

    function bind() {
        var logo = document.getElementById('logo');
        if (!logo || logo._nr06LogoTapBound) return;
        logo._nr06LogoTapBound = true;
        logo.style.cursor = 'pointer';
        logo.setAttribute('role', 'button');
        logo.setAttribute('aria-label', 'Logo');
        logo.addEventListener('touchend', function () {
            lastTouchAt = Date.now();
            onLogoActivate();
        }, { passive: true });
        logo.addEventListener('click', function () {
            /* Ignora o click fantasma depois do touchend no mobile */
            if (Date.now() - lastTouchAt < 500) return;
            onLogoActivate();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();

/* Atalho oculto: digite go + número da página (ex.: go22) para ir direto. */
(function initGoPageShortcut() {
    var buf = '';
    var timer = null;
    var modules = [
        { id: 'index', offset: 0, file: 'index.html' },
        { id: 'modulo-1', offset: 2, file: 'modulo-1.html' },
        { id: 'modulo-2', offset: 12, file: 'modulo-2.html' },
        { id: 'modulo-3', offset: 22, file: 'modulo-3.html' },
        { id: 'modulo-4', offset: 34, file: 'modulo-4.html' }
    ];

    function clearBuf() {
        buf = '';
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function resolveGlobalPage(pageNum) {
        if (!pageNum || pageNum < 1 || pageNum > NR11_TOTAL_SLIDES) return null;
        for (var i = modules.length - 1; i >= 0; i--) {
            if (pageNum > modules[i].offset) {
                return {
                    id: modules[i].id,
                    file: modules[i].file,
                    local: pageNum - modules[i].offset - 1
                };
            }
        }
        return null;
    }

    function jumpToGlobalPage(pageNum) {
        var target = resolveGlobalPage(pageNum);
        if (!target) return;
        clearBuf();
        var currentId = (window.MODULE_NAV && window.MODULE_NAV.id) || 'index';
        if (target.id === currentId) {
            if (typeof goTo === 'function') goTo(target.local, true);
            return;
        }
        try { sessionStorage.setItem('nr06_nav_entry', 'restore:' + target.local); } catch (e) { }
        window.location.href = target.file + '?restoreslide=' + target.local;
    }

    function tryCommitGo() {
        var m = buf.match(/^go(\d{1,2})$/);
        if (!m) return;
        var pageNum = parseInt(m[1], 10);
        if (pageNum >= 1 && pageNum <= NR11_TOTAL_SLIDES) jumpToGlobalPage(pageNum);
        else clearBuf();
    }

    window.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

        if (e.key === 'Enter' && /^go\d{1,2}$/.test(buf)) {
            e.preventDefault();
            tryCommitGo();
            return;
        }
        if (e.key === 'Escape') {
            clearBuf();
            return;
        }
        if (!e.key || e.key.length !== 1) return;

        var ch = e.key.toLowerCase();
        if (ch === 'g') {
            clearBuf();
            buf = 'g';
            return;
        }
        if (buf === 'g' && ch === 'o') {
            buf = 'go';
            return;
        }
        if (buf.indexOf('go') === 0 && /^\d$/.test(ch) && buf.length < 4) {
            buf += ch;
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () { tryCommitGo(); }, 700);
            return;
        }
        clearBuf();
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    applyDemoModeUI();
});

function isPandaIframe(iframe) {
    if (!iframe) return false;
    var src = iframe.getAttribute('src') || '';
    return src.indexOf('pandavideo.com') !== -1;
}

function getPandaVideoIdFromSrc(src) {
    var m = (src || '').match(/[?&]v=([0-9a-f-]+)/i);
    return m ? m[1] : null;
}

function slideHasVimeoVideo(slide) {
    if (!slide) return false;
    var wrap = slide.querySelector('.video-wrap');
    if (!wrap) return false;
    var iframe = wrap.querySelector('iframe');
    if (!iframe) return false;
    var src = iframe.getAttribute('src') || '';
    if (isPandaIframe(iframe)) return true;
    return !!(iframe.dataset.vimeoSrc || iframe.dataset.vimeoPrepared || src.indexOf('vimeo') !== -1);
}

function isVideoSlidePending(slide) {
    if (!slide || !slideHasVimeoVideo(slide)) return false;
    var wrap = slide.querySelector('.video-wrap');
    return wrap && !wrap.classList.contains('req-done');
}

function ensureVideoSlideReqItems() {
    document.querySelectorAll('.slide .video-wrap iframe').forEach(function (iframe) {
        var src = iframe.getAttribute('src') || '';
        if (!iframe.dataset.vimeoSrc && !iframe.dataset.vimeoPrepared && src.indexOf('vimeo') === -1 && !isPandaIframe(iframe)) return;
        var wrap = iframe.closest('.video-wrap');
        if (wrap) wrap.classList.add('req-item');
    });
}

function isSlideCompleted(idx) {
    if (window.demoMode) return true;
    const slide = document.querySelectorAll('.slide')[idx];
    if (!slide) return true;
    if (isVideoSlidePending(slide)) return false;
    const resultPanel = slide.querySelector('[id$="-result-panel"]');
    if (resultPanel && resultPanel.style.display === 'none') return false;
    if (resultPanel && resultPanel.style.display === 'block') {
        const status = resultPanel.querySelector('.r-status');
        if (status && status.classList.contains('ref')) return false;
    }
    const reqs = slide.querySelectorAll('.req-item, .tf-flip, .flip-card, .reveal-card, .myth-card, .pair-row, .kit-col, .sector-col');
    if (slideHasVimeoVideo(slide) && !reqs.length) return false;
    for (let i = 0; i < reqs.length; i++) {
        if (!reqs[i].classList.contains('req-done')) return false;
    }
    return true;
}

function updateNextButton() {
    const btnFwd = document.getElementById('btn-fwd');
    if (!btnFwd) return;
    const completed = isSlideCompleted(currentSlide);
    if (currentSlide === TOTAL - 1 && !window.MODULE_NAV.next) {
        btnFwd.disabled = true;
        btnFwd.style.display = 'none';
        btnFwd.classList.remove('is-locked');
    } else {
        btnFwd.disabled = !completed;
        btnFwd.style.display = 'flex';
        btnFwd.classList.toggle('is-locked', !completed);
    }
    btnFwd.setAttribute('aria-disabled', btnFwd.disabled ? 'true' : 'false');
}

/* ── Slide video lazy load (Vimeo iframes + video preload) ── */
var SLIDE_VIDEO_BLANK = 'about:blank';
var VIDEO_UNLOCK_BEFORE_END = 4; /* libera avanço faltando N segundos para o fim */
var _videoWrapInited = new Set();

function getVimeoIdFromSrc(src) {
    var m = (src || '').match(/vimeo\.com\/video\/(\d+)/);
    return m ? m[1] : null;
}

function isLoadedVimeoIframe(iframe) {
    var src = iframe.getAttribute('src') || '';
    return src.indexOf('vimeo') !== -1 && src !== SLIDE_VIDEO_BLANK;
}

function ensureVideoPoster(wrap, vimeoSrc) {
    if (!wrap || wrap.querySelector('.video-poster')) return;
    var id = getVimeoIdFromSrc(vimeoSrc);
    if (!id) return;
    var poster = document.createElement('img');
    poster.className = 'video-poster';
    poster.alt = '';
    poster.src = 'https://vumbnail.com/' + id + '.jpg';
    poster.decoding = 'async';
    var iframe = wrap.querySelector('iframe');
    if (iframe) wrap.insertBefore(poster, iframe);
    else wrap.appendChild(poster);
}

function setVideoPosterVisible(wrap, visible) {
    var poster = wrap && wrap.querySelector('.video-poster');
    if (poster) poster.style.display = visible ? 'block' : 'none';
}

function prepareVimeoIframe(iframe) {
    if (!iframe || iframe.dataset.vimeoPrepared) return;
    var src = iframe.getAttribute('src');
    if (!src || src === SLIDE_VIDEO_BLANK || src.indexOf('vimeo') === -1) return;
    iframe.dataset.vimeoSrc = src;
    iframe.removeAttribute('src');
    iframe.dataset.vimeoPrepared = '1';
    var wrap = iframe.closest('.video-wrap');
    if (wrap) {
        ensureVideoPoster(wrap, src);
        wrap.classList.add('req-item');
        wrap.classList.remove('req-done');
    }
}

function pausePandaIframe(iframe) {
    if (!iframe || !isPandaIframe(iframe)) return;
    try {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'pause' }, '*');
        }
    } catch (e) { }
}

function pauseVimeoIframe(iframe) {
    if (!iframe) return;
    if (isPandaIframe(iframe)) {
        pausePandaIframe(iframe);
        return;
    }
    try {
        if (typeof Vimeo === 'undefined') return;
        if (isLoadedVimeoIframe(iframe)) {
            new Vimeo.Player(iframe).pause().catch(function () { });
        }
    } catch (e) { }
}

function pauseAllSlideVideos() {
    document.querySelectorAll('.slide iframe').forEach(pauseVimeoIframe);
    document.querySelectorAll('.slide video').forEach(function (v) {
        try { v.pause(); } catch (e) { }
    });
}

function unloadVimeoIframe(iframe) {
    pauseVimeoIframe(iframe);
    if (!iframe.dataset.vimeoSrc) return;
    var wrap = iframe.closest('.video-wrap');
    if (wrap) {
        _videoWrapInited.delete(wrap);
        wrap.classList.remove('req-done');
    }
    iframe.setAttribute('src', SLIDE_VIDEO_BLANK);
    setVideoPosterVisible(wrap, true);
}

function loadVimeoIframe(iframe) {
    var src = iframe.dataset.vimeoSrc;
    if (!src) return;
    var current = iframe.getAttribute('src') || '';
    if (current === src) {
        var wrapLoaded = iframe.closest('.video-wrap');
        if (wrapLoaded) {
            wrapLoaded.classList.add('req-item');
            wrapLoaded.classList.remove('req-done');
        }
        initVideoWrapPlayer(wrapLoaded);
        updateNextButton();
        return;
    }
    if (!current || current === SLIDE_VIDEO_BLANK) {
        iframe.addEventListener('load', function () {
            setVideoPosterVisible(iframe.closest('.video-wrap'), false);
            initVideoWrapPlayer(iframe.closest('.video-wrap'));
        }, { once: true });
        iframe.setAttribute('src', src);
    }
}

function markVideoWrapComplete(wrap, warn) {
    if (!wrap || wrap.classList.contains('req-done')) return;
    wrap.classList.add('req-done');
    if (warn) {
        warn.style.display = 'none';
        warn.style.opacity = '0';
        warn.style.pointerEvents = 'none';
    }
    updateNextButton();
    try { playBeep('end'); } catch (e) { }
}

function videoUnlockThreshold(duration) {
    if (!(duration > 0)) return null;
    return Math.max(0, duration - VIDEO_UNLOCK_BEFORE_END);
}

function initVideoWrapPlayer(wrap) {
    if (!wrap) return;
    var iframe = wrap.querySelector('iframe');
    if (!iframe || !isLoadedVimeoIframe(iframe)) return;
    if (typeof Vimeo === 'undefined') return;

    wrap.classList.add('req-item');
    wrap.classList.remove('req-done');
    updateNextButton();

    if (_videoWrapInited.has(wrap)) return;

    _videoWrapInited.add(wrap);
    wrap.style.cursor = 'default';

    var warn = wrap.querySelector('.video-warn');
    if (!warn) {
        warn = document.createElement('div');
        warn.className = 'video-warn';
        warn.textContent = 'ASSISTA ATÉ O FINAL';
        wrap.appendChild(warn);
    }

    var player = new Vimeo.Player(iframe);
    var maxWatched = 0;
    var duration = 0;
    var completed = false;

    function complete() {
        if (completed) return;
        completed = true;
        markVideoWrapComplete(wrap, warn);
    }

    player.getDuration().then(function (d) {
        if (typeof d === 'number' && d > 0) duration = d;
    }).catch(function () { });

    var enforceTime = function (data) {
        if (completed) return;
        if (data.seconds > maxWatched + 1) {
            player.setCurrentTime(maxWatched);
        }
    };

    player.on('timeupdate', function (data) {
        if (completed) return;
        if (typeof data.duration === 'number' && data.duration > 0) duration = data.duration;
        if (data.seconds > maxWatched + 1) {
            player.setCurrentTime(maxWatched);
            return;
        }
        if (data.seconds > maxWatched && (data.seconds - maxWatched) < 1.5) {
            maxWatched = data.seconds;
        }
        var unlockAt = videoUnlockThreshold(duration);
        if (unlockAt !== null && maxWatched >= unlockAt) complete();
    });

    player.on('seeking', enforceTime);
    player.on('seeked', enforceTime);

    player.on('play', function () {
        warn.style.opacity = '0';
        warn.style.pointerEvents = 'none';
        player.getCurrentTime().then(function (seconds) {
            if (!completed && seconds > maxWatched + 1) player.setCurrentTime(maxWatched);
        });
    });

    player.on('pause', function () {
        if (!wrap.classList.contains('req-done')) {
            warn.style.opacity = '1';
            warn.style.pointerEvents = 'auto';
        }
    });

    player.on('ended', function () {
        complete();
        try {
            player.pause().then(function () {
                return player.setCurrentTime(0);
            }).catch(function () { });
        } catch (e) { }
    });
}

function teardownPandaVideoWrap(wrap) {
    if (!wrap) return;
    if (wrap._pandaHandler) {
        window.removeEventListener('message', wrap._pandaHandler);
        wrap._pandaHandler = null;
    }
    _videoWrapInited.delete(wrap);
    var iframe = wrap.querySelector('iframe');
    if (iframe) pausePandaIframe(iframe);
}

function initPandaVideoWrap(wrap) {
    if (!wrap) return;
    var iframe = wrap.querySelector('iframe');
    if (!iframe || !isPandaIframe(iframe)) return;

    wrap.classList.add('req-item');
    if (_videoWrapInited.has(wrap)) return;

    _videoWrapInited.add(wrap);
    wrap.style.cursor = 'default';

    var expectedId = getPandaVideoIdFromSrc(iframe.getAttribute('src') || '');
    if (expectedId && !iframe.id) iframe.id = 'panda-' + expectedId;

    var warn = wrap.querySelector('.video-warn');
    if (!warn) {
        warn = document.createElement('div');
        warn.className = 'video-warn';
        warn.textContent = 'ASSISTA ATÉ O FINAL';
        wrap.appendChild(warn);
    }

    if (wrap._pandaHandler) {
        window.removeEventListener('message', wrap._pandaHandler);
    }

    var maxWatched = 0;
    var duration = 0;
    var completed = false;
    var pandaPlayer = null;

    function complete() {
        if (completed || wrap.classList.contains('req-done')) return;
        completed = true;
        markVideoWrapComplete(wrap, warn);
    }

    function noteDuration(d) {
        if (typeof d === 'number' && d > 0) duration = d;
    }

    function onProgress(t) {
        if (completed || typeof t !== 'number') return;
        if (t > maxWatched + 2.5) return;
        if (t > maxWatched) maxWatched = t;
        if (pandaPlayer && typeof pandaPlayer.getDuration === 'function') {
            try { noteDuration(pandaPlayer.getDuration()); } catch (e) { }
        }
        var unlockAt = videoUnlockThreshold(duration);
        if (unlockAt !== null && maxWatched >= unlockAt) complete();
    }

    wrap._pandaHandler = function (event) {
        var data = event.data;
        if (!data || typeof data !== 'object') return;
        if (expectedId && data.video && String(data.video) !== String(expectedId)) return;
        if (completed || wrap.classList.contains('req-done')) return;

        if (data.message === 'panda_play') {
            warn.style.opacity = '0';
            warn.style.pointerEvents = 'none';
        }
        if (data.message === 'panda_pause' && !wrap.classList.contains('req-done')) {
            warn.style.opacity = '1';
            warn.style.pointerEvents = 'auto';
        }
        if (data.message === 'panda_ended') {
            complete();
            return;
        }
        if (data.message === 'panda_timeupdate') {
            noteDuration(data.duration);
            onProgress(typeof data.currentTime === 'number' ? data.currentTime : null);
        }
    };

    window.addEventListener('message', wrap._pandaHandler);

    function bindPandaApi() {
        if (typeof PandaPlayer === 'undefined' || !iframe.id) return;
        window.pandascripttag = window.pandascripttag || [];
        window.pandascripttag.push(function () {
            try {
                pandaPlayer = new PandaPlayer(iframe.id, {
                    onReady: function () {
                        try { noteDuration(pandaPlayer.getDuration && pandaPlayer.getDuration()); } catch (e) { }
                        if (pandaPlayer && typeof pandaPlayer.onEvent === 'function') {
                            pandaPlayer.onEvent(function (e) {
                                if (!e || completed) return;
                                if (e.message === 'panda_ended') {
                                    complete();
                                    return;
                                }
                                if (e.message === 'panda_timeupdate') {
                                    noteDuration(e.duration);
                                    try { noteDuration(pandaPlayer.getDuration && pandaPlayer.getDuration()); } catch (err) { }
                                    onProgress(typeof e.currentTime === 'number' ? e.currentTime : null);
                                }
                            });
                        }
                    }
                });
            } catch (e) { }
        });
    }
    bindPandaApi();

    updateNextButton();
}

function syncSlideVideos(activeIdx) {
    ensureVideoSlideReqItems();
    var slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    slides.forEach(function (slide, i) {
        slide.querySelectorAll('iframe').forEach(prepareVimeoIframe);
        if (i === activeIdx) {
            slide.querySelectorAll('.video-wrap').forEach(function (wrap) {
                var iframe = wrap.querySelector('iframe');
                if (iframe && isPandaIframe(iframe)) {
                    wrap.classList.add('req-item');
                    if (!wrap.classList.contains('req-done')) wrap.classList.remove('req-done');
                    initPandaVideoWrap(wrap);
                }
                if (wrap.querySelector('iframe[data-vimeo-prepared], iframe[src*="vimeo"]')) {
                    wrap.classList.add('req-item');
                    wrap.classList.remove('req-done');
                }
            });
        } else {
            slide.querySelectorAll('.video-wrap').forEach(function (wrap) {
                if (wrap.querySelector('iframe') && isPandaIframe(wrap.querySelector('iframe'))) {
                    teardownPandaVideoWrap(wrap);
                }
            });
        }
        slide.querySelectorAll('iframe[data-vimeo-prepared]').forEach(function (iframe) {
            if (i === activeIdx) {
                loadVimeoIframe(iframe);
            } else {
                unloadVimeoIframe(iframe);
            }
        });
        slide.querySelectorAll('video').forEach(function (v) {
            v.setAttribute('preload', 'metadata');
            if (i !== activeIdx) {
                try { v.pause(); } catch (e) { }
            }
        });
    });
    try { updateNextButton(); } catch (e) { }
}

function goTo(idx, force = false, skipHistory = false) {
    try {
        const clickAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        clickAudio.volume = 0.4;
        clickAudio.play().catch(e => console.log('Audio error:', e));
    } catch (e) { }

    if (idx < 0 || idx >= TOTAL) return;
    if (idx > currentSlide && !force && !isSlideCompleted(currentSlide)) {
        alert('Por favor, interaja com todos os itens e responda o quiz para avançar.');
        return;
    }
    const slides = document.querySelectorAll('.slide');
    const oldSlide = slides[currentSlide];
    oldSlide.querySelectorAll('iframe').forEach(pauseVimeoIframe);
    oldSlide.querySelectorAll('video').forEach(function (v) {
        try { v.pause(); } catch (e) { }
    });
    oldSlide.classList.remove('active');
    oldSlide.classList.add('exit-left');
    // Pause q6 background music when leaving quiz 6 slide
    try {
        const q6Music = oldSlide.querySelector('#q6-bg-music');
        if (q6Music) { q6Music.pause(); q6Music.currentTime = 0; }
    } catch (e) { }
    setTimeout(() => { oldSlide.classList.remove('exit-left'); }, 600);

    currentSlide = idx;
    if (!skipHistory) trackHistory(currentSlide);
    const newSlide = slides[currentSlide];
    newSlide.classList.add('active');
    newSlide.classList.remove('exit-left');
    try {
        const ca = newSlide.querySelector('.content-area');
        if (ca) ca.scrollTop = 0;
    } catch (e) { }

    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'flex';

    if (newSlide.id === 's44') {
        startConclusionEpic();
    }
    const pbar = document.getElementById('pbar');
    if (pbar) pbar.style.width = (nr11GlobalSlide() / NR11_TOTAL_SLIDES * 100) + '%';
    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = nr11GlobalSlide() + ' / ' + NR11_TOTAL_SLIDES;
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.disabled = (currentSlide === 0 && !window.MODULE_NAV.prev);
        btnBack.style.visibility = (currentSlide === 0 && !window.MODULE_NAV.prev) ? 'hidden' : 'visible';
    }
    const btnFwd = document.getElementById('btn-fwd');
    if (btnFwd) {
        btnFwd.style.visibility = 'visible';
        btnFwd.style.display = (currentSlide === TOTAL - 1 && !window.MODULE_NAV.next) ? 'none' : 'flex';
    }
    buildDots();
    try { syncSlideVideos(currentSlide); } catch (e) { }
    if (typeof window.positionA11yBar === 'function') window.positionA11yBar();
    updateNextButton();
    try { window.updateQuizAudioHelper(); } catch (e) { }
    try { if (typeof scheduleScrollBtnRefresh === 'function') scheduleScrollBtnRefresh(); } catch (e) { }
    try { if (typeof forceMobileCenterSlide === 'function') forceMobileCenterSlide(newSlide); } catch (e) { }
    // Slide index not persisted
}

/** Mobile: força card de desafio / player de vídeo no meio da tela */
function forceMobileCenterSlide(slide) {
    if (!slide || !window.matchMedia('(max-width: 768px)').matches) return;
    const area = slide.querySelector(':scope > .content-area');
    const isQuiz = /(-quiz|-game)$/.test(slide.id || '');
    const isVideo = slide.classList.contains('slide-video');
    const isIntro = /(-intro)$/.test(slide.id || '') && slide.querySelector('.mod-intro');

    if (area && (isQuiz || isVideo)) {
        area.style.setProperty('display', 'flex', 'important');
        area.style.setProperty('flex-direction', 'column', 'important');
        area.style.setProperty('justify-content', 'center', 'important');
        area.style.setProperty('align-items', 'center', 'important');
        area.style.setProperty('position', 'relative', 'important');
        area.style.setProperty('flex', '1 1 auto', 'important');
        area.style.setProperty('min-height', '0', 'important');
        area.style.setProperty('overflow-x', 'hidden', 'important');
        area.style.setProperty('padding-top', isVideo ? '8px' : '56px', 'important');
        area.style.setProperty('padding-bottom', 'calc(96px + env(safe-area-inset-bottom, 0px))', 'important');
        const wrap = area.querySelector('.quiz-wrap, .video-wrap');
        if (wrap) {
            wrap.style.setProperty('margin-top', 'auto', 'important');
            wrap.style.setProperty('margin-bottom', 'auto', 'important');
            wrap.style.setProperty('align-self', 'center', 'important');
        }
    }

    if (isIntro) {
        const mi = slide.querySelector('.mod-intro');
        if (mi) {
            mi.style.setProperty('display', 'flex', 'important');
            mi.style.setProperty('flex-direction', 'column', 'important');
            mi.style.setProperty('justify-content', 'center', 'important');
            mi.style.setProperty('align-items', 'center', 'important');
            mi.style.setProperty('min-height', 'calc(100dvh - 120px)', 'important');
        }
    }

    if (isQuiz) {
        const title = slide.querySelector(':scope > .top-bar .slide-title');
        if (title && !slide.classList.contains('quiz-playing')) {
            title.style.setProperty('display', 'none', 'important');
        }
    }
}
window.forceMobileCenterSlide = forceMobileCenterSlide;

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') moduleNext(true);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') modulePrev(true);
});


function startConclusionEpic() {
    createCinematicParticles();
    createPremiumConfetti();
    playConclusionCinematicAudio();
}

function createCinematicParticles() {
    const container = document.getElementById('c-particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle-green';
        p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = (Math.random() * 100 + 50) + 'vh';
        p.style.animationDuration = (Math.random() * 5 + 5) + 's';
        p.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(p);
    }
}

function createPremiumConfetti() {
    const container = document.getElementById('c-confetti');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#F6D50C', '#F6D50C', '#F6D50C', '#C9A800', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = (Math.random() * 3 + 4) + 's';
        c.style.animationDelay = (Math.random() * 1.5) + 's';
        c.style.opacity = Math.random() * 0.5 + 0.5;
        container.appendChild(c);
    }
}

function playConclusionCinematicAudio() {
    try {
        // Usando caminho relativo para evitar bloqueios do navegador e ajustando volume
        const efeitofinal = new Audio('https://res.cloudinary.com/dzqns0zpe/video/upload/v1779288012/efeitofinal_kzr836.mp3');
        efeitofinal.volume = 0.5; // Volume ajustado para um nível médio/baixo
        efeitofinal.play().catch(e => console.log('Audio error:', e));
    } catch (e) { console.log('Audio disabled', e); }
}

function finishTraining() {
    console.log('--- TREINAMENTO FINALIZADO VIA SCORM/LMS ---');
    alert('Treinamento concluído e registrado com sucesso!');
    // Aqui iria a chamada para o LMS, ex: window.close(), SCORM.quit(), etc.
}

function restartCourse() {
    try {
        window.location.href = 'index.html';
    } catch (e) {
        window.location.assign('index.html');
    }
}
window.restartCourse = restartCourse;

/* Reveal cards — toque para descobrir (padrão NR-11) */
function revealCard(el) {
    if (!el || !el.classList.contains('unrevealed')) return;
    el.classList.remove('unrevealed');
    el.classList.add('req-done');
    try { playBeep('flip'); } catch (e) { }
    try { updateNextButton(); } catch (e) { }
}
window.revealCard = revealCard;

function markCompareRead(el) {
    if (!el || el.classList.contains('req-done')) return;
    el.classList.add('req-done');
    try { playBeep('click'); } catch (e) { }
    try { updateNextButton(); } catch (e) { }
}
window.markCompareRead = markCompareRead;

function flipTfCard(el) {
    if (!el) return;
    el.classList.add('flipped', 'is-selected', 'req-item', 'req-done');
    try { playBeep('flip'); } catch (e) { }
    try { updateNextButton(); } catch (e) { }
}
window.flipTfCard = flipTfCard;

function flipExploreCard(el) {
    if (!el) return;
    el.classList.add('flipped', 'is-selected', 'req-item', 'req-done');
    try { playBeep('flip'); } catch (e) { }
    try { updateNextButton(); } catch (e) { }
}
window.flipExploreCard = flipExploreCard;

/* ════════════════════════════════════════
   ════════════════════════════════════════ */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let currentOsc = null;
let currentGain = null;
let quizCorrectAudio = null;
let quizWrongAudio = null;
let activeQuizSfx = null;

const QUIZ_CORRECT_SFX = encodeURI('assets/efeitos sonoros/correct-answer.mp3');
const QUIZ_WRONG_SFX = encodeURI('assets/efeitos sonoros/OBJMisc-wrong_answer-Elevenlabs.mp3');

function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
        return audioCtx.resume().then(function () { return audioCtx; }).catch(function () { return audioCtx; });
    }
    return Promise.resolve(audioCtx);
}

function stopQuizSfx(except) {
    [quizCorrectAudio, quizWrongAudio, activeQuizSfx].forEach(function (audio) {
        if (!audio || audio === except) return;
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (e) { }
    });
}

function playSynthFallback(kind) {
    ensureAudioCtx().then(function (ctx) {
        if (!ctx) return;
        try {
            if (currentOsc) {
                try { currentOsc.stop(); currentOsc.disconnect(); } catch (e) { }
            }
            if (currentGain) {
                try { currentGain.disconnect(); } catch (e) { }
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            currentOsc = osc;
            currentGain = gain;

            const now = ctx.currentTime;
            if (kind === 'ok' || kind === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.09);
                osc.frequency.setValueAtTime(783.99, now + 0.18);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
                osc.start(now);
                osc.stop(now + 0.4);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
                osc.start(now);
                osc.stop(now + 0.34);
            }
        } catch (e) { }
    });
}

function playQuizMp3(kind) {
    const isOk = kind === 'ok' || kind === 'correct';
    const src = isOk ? QUIZ_CORRECT_SFX : QUIZ_WRONG_SFX;

    try {
        // Garante AudioContext desbloqueado no mesmo gesto do clique
        try { ensureAudioCtx(); } catch (e) { }

        let audio = isOk ? quizCorrectAudio : quizWrongAudio;
        if (!audio) {
            audio = new Audio(src);
            audio.preload = 'auto';
            audio.volume = 0.45;
            if (isOk) quizCorrectAudio = audio;
            else quizWrongAudio = audio;
        }

        stopQuizSfx(audio);
        activeQuizSfx = audio;

        const startPlay = function () {
            try {
                if (audio.readyState >= 1) audio.currentTime = 0;
            } catch (e) {
                try { audio.load(); } catch (err) { }
            }
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(function () {
                    try {
                        const fresh = new Audio(src);
                        fresh.volume = 0.45;
                        activeQuizSfx = fresh;
                        if (isOk) quizCorrectAudio = fresh;
                        else quizWrongAudio = fresh;
                        return fresh.play().catch(function () {
                            playSynthFallback(isOk ? 'ok' : 'nok');
                        });
                    } catch (err) {
                        playSynthFallback(isOk ? 'ok' : 'nok');
                    }
                });
            }
        };

        startPlay();
        setTimeout(function () {
            if (activeQuizSfx === audio && audio.paused) {
                startPlay();
            }
        }, 120);
        setTimeout(function () {
            if (activeQuizSfx === audio && audio.paused) {
                playSynthFallback(isOk ? 'ok' : 'nok');
            }
        }, 320);
    } catch (e) {
        playSynthFallback(isOk ? 'ok' : 'nok');
    }
}

function playCorrectAnswerSound() {
    playQuizMp3('ok');
}

function playWrongAnswerSound() {
    playQuizMp3('nok');
}

function preloadQuizSfx() {
    try {
        if (!quizCorrectAudio) {
            quizCorrectAudio = new Audio(QUIZ_CORRECT_SFX);
            quizCorrectAudio.preload = 'auto';
            quizCorrectAudio.volume = 0.45;
        }
        if (!quizWrongAudio) {
            quizWrongAudio = new Audio(QUIZ_WRONG_SFX);
            quizWrongAudio.preload = 'auto';
            quizWrongAudio.volume = 0.45;
        }
        try { quizCorrectAudio.load(); } catch (e) { }
        try { quizWrongAudio.load(); } catch (e) { }
    } catch (e) { }
}

if (typeof document !== 'undefined') {
    const unlockOnce = function () {
        preloadQuizSfx();
        try { ensureAudioCtx(); } catch (e) { }
        document.removeEventListener('pointerdown', unlockOnce, true);
        document.removeEventListener('keydown', unlockOnce, true);
    };
    document.addEventListener('pointerdown', unlockOnce, true);
    document.addEventListener('keydown', unlockOnce, true);
}

function playBeep(type) {
    if (type === 'ok') {
        playCorrectAnswerSound();
        return;
    }
    if (type === 'nok') {
        playWrongAnswerSound();
        return;
    }

    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Evitar sobreposição cancelando o áudio anterior imediatamente
    if (currentOsc) {
        try { currentOsc.stop(); currentOsc.disconnect(); } catch (e) { }
    }
    if (currentGain) {
        try { currentGain.disconnect(); } catch (e) { }
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    currentOsc = osc;
    currentGain = gain;

    const now = audioCtx.currentTime;

    if (type === 'click') {
        // Som de clique tecnológico super rápido e sutil
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'end') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}


// Global playTechClick - usa mesmo som do flip card  
window.playTechClick = function () {
    try { playBeep('flip'); } catch (e) { }
};

// Mobile/Browser audio unlock: resume AudioContext on first user interaction
(function unlockAudioOnFirstInteraction() {
    function unlock() {
        try {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
            // create a tiny silent buffer to unlock audio on iOS
            const silent = new Audio();
            silent.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
            silent.volume = 0;
            silent.play().catch(() => { });
        } catch (e) { }
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('click', unlock);
    }
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true, passive: true });
})();

function initFlipCardInteractions() {
    const cards = document.querySelectorAll('.flip-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            try { playBeep('flip'); } catch (e) { }
        });
    });
}

initFlipCardInteractions();

/* ── Reset de estado visual das respostas (quizzes/atividades) ── */
var ANSWER_STATE_CLASSES = ['selected', 'active', 'correct', 'wrong', 'checked', 'selected-true', 'selected-false', 'selected-visual'];

function clearAnswerState(el) {
    if (!el) return;
    ANSWER_STATE_CLASSES.forEach(function (cls) { el.classList.remove(cls); });
}

function clearAnswerGroup(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach(clearAnswerState);
}

function resetTfButtons(btnTrue, btnFalse) {
    [btnTrue, btnFalse].forEach(clearAnswerState);
    if (btnTrue) {
        btnTrue.className = 'tf-btn true';
        btnTrue.style.animation = '';
    }
    if (btnFalse) {
        btnFalse.className = 'tf-btn false';
        btnFalse.style.animation = '';
    }
}

/* ════════════════════════════════════════
   QUIZ ENGINE (generic)
   ════════════════════════════════════════ */
function quizIsMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function createQuizEngine(prefix, questions, numDots, engineOpts) {
    let idx = 0, answered = false, score = 0, selectedOptIdx = -1;
    engineOpts = engineOpts || {};
    const format = engineOpts.format || 'mcq'; // mcq | tf | permit | gate
    const minCorrect = engineOpts.minCorrect != null
        ? engineOpts.minCorrect
        : Math.floor(questions.length / 2) + 1;

    const _stateKey = () => 'nr11_' + getPageKey() + '_' + prefix + '_state';
    function _saveState() {
        // removed persistence
    }
    function _loadState() {
        return null;
    }

    function optSelector() {
        return '#' + prefix + '-options .q-opt, #' + prefix + '-options .tf-btn, #' + prefix + '-options .gate-btn';
    }

    function start() {
        const introPanel = document.getElementById(prefix + '-intro-panel');
        const qPanel = document.getElementById(prefix + '-question-panel');
        const slide = (qPanel && qPanel.closest('.slide')) || (introPanel && introPanel.closest('.slide'));
        if (introPanel) {
            introPanel.style.display = 'none';
            introPanel.classList.add('is-hidden');
            introPanel.setAttribute('hidden', '');
        }
        if (slide) slide.classList.add('quiz-playing');
        if (qPanel) {
            qPanel.style.display = 'block';
            qPanel.style.opacity = '0';
            setTimeout(() => qPanel.style.opacity = '1', 50);
        }
        idx = 0;
        answered = false;
        score = 0;
        selectedOptIdx = -1;
        render();
        playBeep('click');
        try { window.updateQuizAudioHelper(); } catch (e) { }
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('quiz-start'); } catch (e) { }
    }

    function renderDots() {
        const dotsContainer = document.querySelector('#' + prefix + '-question-panel .q-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < numDots; i++) {
                const d = document.createElement('div');
                d.id = prefix + 'dot' + i;
                d.className = 'qdot2' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
                dotsContainer.appendChild(d);
            }
        }
    }

    function render() {
        const qPanel = document.getElementById(prefix + '-question-panel');
        if (qPanel) {
            qPanel.classList.remove('q-result-anim', 'quiz-fmt-mcq', 'quiz-fmt-tf', 'quiz-fmt-permit', 'quiz-fmt-gate');
            qPanel.classList.add('quiz-fmt-' + format);
        }

        answered = false;
        selectedOptIdx = -1;

        const q = questions[idx];
        const isQuizMobile = quizIsMobile();
        const c = document.getElementById(prefix + '-counter');
        if (c) {
            if (format === 'gate') {
                c.textContent = 'MISSÃO ' + (idx + 1) + ' DE ' + questions.length;
            } else if (format === 'permit') {
                c.textContent = 'AÇÃO ' + (idx + 1) + ' DE ' + questions.length;
            } else if (format === 'tf') {
                c.textContent = 'AFIRMAÇÃO ' + (idx + 1) + ' DE ' + questions.length;
            } else if (isQuizMobile) {
                c.textContent = (idx + 1) + ' DE ' + questions.length;
            } else {
                c.textContent = 'Cenário ' + (idx + 1) + ' de ' + questions.length;
            }
        }

        const txt = document.getElementById(prefix + '-text');
        if (txt) {
            if (format === 'gate') {
                txt.innerHTML =
                    (q.theme ? '<div class="q-gate-theme">' + q.theme + '</div>' : '') +
                    '<div class="q-gate-scene">' + q.q + '</div>' +
                    '<div class="q-gate-prompt" aria-hidden="true">LIBERAR USO?</div>';
            } else if (format === 'permit') {
                txt.innerHTML =
                    '<div class="q-permit-label">Avalie a conduta</div>' +
                    '<div class="q-permit-action">' + q.q + '</div>' +
                    '<div class="q-gate-prompt q-permit-prompt">É PERMITIDO?</div>';
            } else if (format === 'tf') {
                txt.innerHTML = '<div class="tf-question-box"><h3 class="tf-question-text">' + q.q + '</h3></div>';
            } else if (q.theme) {
                txt.innerHTML =
                    '<div class="q-scene-theme">' + q.theme + '</div>' +
                    '<div class="q-scene-ask">' + q.q + '</div>';
            } else {
                txt.innerHTML = q.q;
            }
        }

        const opts = document.getElementById(prefix + '-options');
        if (opts) {
            opts.innerHTML = '';
            if (format === 'tf') {
                opts.className = 'tf-buttons';
                const labels = q.opts || ['Verdadeiro', 'Falso'];
                labels.forEach(function (label, i) {
                    const el = document.createElement('button');
                    el.type = 'button';
                    el.className = 'tf-btn ' + (i === 0 ? 'true' : 'false');
                    el.textContent = label;
                    el.onclick = function () { selectAnswer(i, el); };
                    opts.appendChild(el);
                });
            } else if (format === 'permit' || format === 'gate') {
                opts.className = 'q-options q-options-binary';
                const labels = q.opts || (format === 'permit'
                    ? ['✓ PERMITIDO', '✕ PROIBIDO']
                    : ['✓ LIBERAR', '✕ NÃO LIBERAR']);
                labels.forEach(function (label, i) {
                    const el = document.createElement('div');
                    const isYes = i === 0;
                    el.className = 'q-opt gate-btn ' + (isYes ? 'opt-approve' : 'opt-reject');
                    el.innerHTML = '<span>' + label + '</span>';
                    el.onclick = function () { selectAnswer(i, el); };
                    opts.appendChild(el);
                });
            } else {
                opts.className = 'q-options';
                const letters = ['A', 'B', 'C', 'D'];
                (q.opts || []).forEach(function (opt, i) {
                    const el = document.createElement('div');
                    el.className = 'q-opt';
                    el.innerHTML = '<div class="opt-l">' + letters[i] + '</div><span>' + opt + '</span>';
                    el.onclick = function () { selectAnswer(i, el); };
                    opts.appendChild(el);
                });
            }
        }
        const fb = document.getElementById(prefix + '-feedback');
        if (fb) {
            fb.className = 'q-feedback';
            fb.textContent = '';
            fb.style.background = '';
            fb.style.border = '';
            fb.style.color = '';
        }
        const vCont = document.getElementById(prefix + '-verify-container');
        if (vCont) { vCont.style.display = 'none'; vCont.style.opacity = '0'; vCont.style.visibility = 'hidden'; }
        const btn = document.getElementById('btn-next-' + prefix);
        if (btn) {
            btn.className = 'btn-next-q';
            btn.classList.remove('show');
            btn.style.display = 'none';
            btn.disabled = false;
            btn.style.pointerEvents = '';
            btn.textContent = 'Continuar →';
        }
        if (qPanel) {
            qPanel.scrollTop = 0;
            const wrap = document.querySelector('.quiz-wrap');
            if (wrap) wrap.scrollTop = 0;
        }
        renderDots();
        try { window.updateQuizAudioHelper(); } catch (e) { }
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('quiz-question'); } catch (e) { }
    }

    function selectAnswer(i, el) {
        if (answered) return;
        selectedOptIdx = i;
        const allOpts = document.querySelectorAll(optSelector());
        allOpts.forEach(function (o) {
            clearAnswerState(o);
            o.classList.remove('selected-visual');
        });
        el.classList.add('selected');
        if (format === 'tf') el.classList.add('selected-visual');
        playBeep('click');

        const vCont = document.getElementById(prefix + '-verify-container');
        if (vCont) {
            vCont.style.display = 'block';
            setTimeout(() => {
                vCont.style.opacity = '1';
                vCont.style.visibility = 'visible';
            }, 50);
        }
    }

    function verify() {
        if (answered || selectedOptIdx === -1) return;
        answered = true;

        const vCont = document.getElementById(prefix + '-verify-container');
        if (vCont) { vCont.style.display = 'none'; vCont.style.opacity = '0'; vCont.style.visibility = 'hidden'; }

        const q = questions[idx];
        const allOpts = document.querySelectorAll(optSelector());
        allOpts.forEach(function (o) {
            clearAnswerState(o);
            o.classList.remove('selected-visual');
            o.style.pointerEvents = 'none';
            if (o.tagName === 'BUTTON') o.disabled = true;
        });
        const fb = document.getElementById(prefix + '-feedback');

        if (selectedOptIdx === q.correct) {
            allOpts[selectedOptIdx].classList.add('correct');
            if (fb) {
                fb.textContent = q.feedback_ok;
                fb.className = 'q-feedback ok';
                fb.style.background = '';
                fb.style.border = '';
            }
            score++; playBeep('ok');
        } else {
            allOpts[selectedOptIdx].classList.add('wrong');
            if (allOpts[q.correct]) allOpts[q.correct].classList.add('correct');
            if (fb) {
                fb.textContent = q.feedback_nok;
                fb.className = 'q-feedback nok';
                fb.style.background = '';
                fb.style.border = '';
            }
            playBeep('nok');
        }
        const btn = document.getElementById('btn-next-' + prefix);
        if (btn) {
            const isLast = idx >= questions.length - 1;
            btn.textContent = isLast ? 'Ver resultado →' : 'Continuar →';
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.className = 'btn-next-q show';
            btn.style.display = 'inline-flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
            /* Evita que o mesmo toque do Confirmar dispare o Continuar */
            setTimeout(function () {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
            }, 450);
            setTimeout(function () {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 200);
        }

        try { _saveState(); } catch (e) { }
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('quiz-feedback'); } catch (e) { }
    }

    function next() {
        /* Só avança quando o usuário clica em Continuar — nunca automático após confirmar */
        if (!answered) return;
        idx++;
        if (idx < questions.length) { render(); _saveState(); }
        else { showResult(); }
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    function showResult() {
        playBeep('end');
        const qPanel = document.getElementById(prefix + '-question-panel');
        if (qPanel) qPanel.style.display = 'none';
        const rPanel = document.getElementById(prefix + '-result-panel');
        if (rPanel) {
            rPanel.style.display = 'block';
            rPanel.classList.remove('q-result-anim');
            void rPanel.offsetWidth;
            rPanel.classList.add('q-result-anim');
        }
        const approved = score >= minCorrect;
        const pct = score / questions.length;
        const pctRounded = Math.round(pct * 100);
        const pctEl = document.getElementById(prefix + '-pct');
        if (pctEl) {
            pctEl.style.display = 'block';
            pctEl.removeAttribute('aria-hidden');
            pctEl.textContent = pctRounded + '%';
            pctEl.className = 'result-pct ' + (approved ? 'green' : 'red-c');
        }
        const starsEl = document.getElementById(prefix + '-stars');
        if (starsEl) {
            starsEl.style.display = 'none';
            starsEl.setAttribute('aria-hidden', 'true');
        }
        const status = document.getElementById(prefix + '-status');
        if (status) {
            status.textContent = approved ? 'Desafio Concluído!' : 'Desafio não concluído';
            status.className = 'quiz-result-title r-status ' + (approved ? 'ap' : 'ref');
        }
        const sub = document.getElementById(prefix + '-sub');
        if (sub) {
            if (approved) {
                sub.textContent = 'Você acertou ' + score + ' de ' + questions.length + ' (' + pctRounded + '%). Parabéns! Pode avançar.';
            } else {
                sub.textContent = 'Você acertou ' + score + ' de ' + questions.length + ' (' + pctRounded + '%). É preciso acertar mais da metade (' + minCorrect + '). Refaça o desafio.';
            }
        }
        const icon = document.getElementById(prefix + '-result-icon');
        if (icon) icon.textContent = approved ? '🏅' : '📚';
        if (rPanel) {
            rPanel.classList.add('is-visible');
            rPanel.classList.toggle('is-approved', approved);
            rPanel.classList.toggle('is-failed', !approved);
        }
        const retryBtn = rPanel && rPanel.querySelector('.quiz-result-btn, .btn-retry');
        if (retryBtn) {
            retryBtn.textContent = approved ? 'REVISAR DESAFIO' : 'JOGAR NOVAMENTE';
            retryBtn.style.display = approved ? 'none' : '';
        }
        updateNextButton();
        try { window.updateQuizAudioHelper(); } catch (e) { }
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('quiz-result'); } catch (e) { }
    }

    function reset() {
        idx = 0; score = 0; answered = false; selectedOptIdx = -1;
        const introPanel = document.getElementById(prefix + '-intro-panel');
        const qPanel = document.getElementById(prefix + '-question-panel');
        const rPanel = document.getElementById(prefix + '-result-panel');
        const slide = (introPanel && introPanel.closest('.slide')) ||
            (qPanel && qPanel.closest('.slide')) ||
            (rPanel && rPanel.closest('.slide'));

        if (slide) slide.classList.remove('quiz-playing');
        if (introPanel) {
            introPanel.style.display = '';
            introPanel.classList.remove('is-hidden');
            introPanel.removeAttribute('hidden');
        }
        if (qPanel) qPanel.style.display = 'none';
        if (rPanel) {
            rPanel.style.display = 'none';
            rPanel.classList.remove('is-visible', 'is-approved', 'is-failed', 'q-result-anim');
            const retryBtn = rPanel.querySelector('.quiz-result-btn, .btn-retry');
            if (retryBtn) {
                retryBtn.style.display = '';
                retryBtn.textContent = 'JOGAR NOVAMENTE';
            }
        }

        const fb = document.getElementById(prefix + '-feedback');
        if (fb) { fb.className = 'q-feedback'; fb.textContent = ''; }

        const vCont = document.getElementById(prefix + '-verify-container');
        if (vCont) { vCont.style.display = 'none'; vCont.style.opacity = '0'; vCont.style.visibility = 'hidden'; }

        const btn = document.getElementById('btn-next-' + prefix);
        if (btn) btn.className = 'btn-next-q';

        // removed persistence

        render();
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    return { render, next, reset, selectAnswer, start, verify };
}

/* ════════════════════════════════════════
   QUIZ DATA — MÓDULO 1
   ════════════════════════════════════════ */
/* ════════════════════════════════════════
   QUIZ 1 — Módulo 1: Cenários de cultura SSO (MCQ situacional)
   ════════════════════════════════════════ */
const q1_questions = [
    {
        theme: 'Liderança na operação',
        q: "Um líder vê um colaborador iniciando a tarefa sem o EPI indicado. Qual é a decisão correta?",
        opts: [
            "Deixar seguir para não atrasar a meta do dia.",
            "Interromper, orientar o uso do EPI e só então liberar a atividade.",
            "Registrar depois, se ninguém se machucar.",
            "Pedir que use o EPI só se o fiscal aparecer."
        ],
        correct: 1,
        feedback_ok: "Correto! A liderança interrompe, orienta e só libera com o EPI adequado.",
        feedback_nok: "A alta administração e a liderança prevenem o risco: interrompa e oriente o uso do EPI antes de seguir."
    },
    {
        theme: 'Sistema de gestão',
        q: "Para organizar objetivos de saúde e segurança no dia a dia, a Leroy Merlin conta com:",
        opts: [
            "Apenas e-mails esporádicos de lembrete.",
            "Somente a boa vontade de cada time.",
            "O sistema de gestão de SSO, com monitoramento contínuo.",
            "Regras improvisadas por setor."
        ],
        correct: 2,
        feedback_ok: "Isso! O sistema de gestão de SSO organiza objetivos e elimina perigos antes do risco.",
        feedback_nok: "O sistema de gestão de SSO é o que organiza e monitora a segurança de forma contínua."
    },
    {
        theme: 'Responsabilidade coletiva',
        q: "Na prática, a gestão de segurança envolve quem?",
        opts: [
            "Só o SESMT, sem o time da loja.",
            "Apenas a CIPAA, em reuniões mensais.",
            "Somente o RH em admissões.",
            "Especialistas, CIPAA, liderança e colaboradores."
        ],
        correct: 3,
        feedback_ok: "Perfeito! Segurança é coletiva: especialistas, CIPAA, líderes e você.",
        feedback_nok: "Participam especialistas, CIPAA, liderança e colaboradores — a consulta de todos fortalece as decisões."
    },
    {
        theme: 'Participação do time',
        q: "Por que ouvir quem está na operação é fundamental nas decisões de SSO?",
        opts: [
            "Porque torna as decisões mais seguras e realistas.",
            "Porque substitui treinamentos obrigatórios.",
            "Porque elimina a obrigação legal da empresa.",
            "Porque reduz a necessidade de EPIs."
        ],
        correct: 0,
        feedback_ok: "Exato! A voz de quem opera deixa as decisões mais seguras.",
        feedback_nok: "Participação e consulta tornam as decisões mais seguras — não substituem treinamentos nem obrigações."
    },
    {
        theme: 'Melhoria contínua',
        q: "O sistema de SSO deve ser revisado periodicamente com foco em:",
        opts: [
            "Acelerar a operação a qualquer custo.",
            "Reduzir a quantidade de EPIs fornecidos.",
            "Melhoria contínua e redução de riscos no dia a dia.",
            "Transferir toda a responsabilidade ao colaborador."
        ],
        correct: 2,
        feedback_ok: "Correto! Melhoria contínua e redução de riscos são o norte do sistema.",
        feedback_nok: "O foco da revisão periódica é melhoria contínua e redução de riscos."
    }
];
const quiz1 = createQuizEngine('q1', q1_questions, q1_questions.length, { format: 'mcq', minCorrect: Math.floor(q1_questions.length / 2) + 1 });
function startQuiz1Intro() { quiz1.start(); }
function verifyAnswer1() { quiz1.verify(); }
function nextQuestion1() { quiz1.next(); }
function resetQuiz1() { quiz1.reset(); }

/* ════════════════════════════════════════
   QUIZ 2 — Módulo 2: Verdadeiro ou Falso (HUD)
   ════════════════════════════════════════ */
const q2_questions = [
    {
        q: "Segundo a NR-06, EPI é qualquer equipamento coletivo instalado na loja.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 1,
        feedback_ok: "Correto! EPI é de uso individual — não se confunde com proteção coletiva.",
        feedback_nok: "Falso. EPI é dispositivo/produto de uso individual contra riscos do ambiente."
    },
    {
        q: "A Leroy Merlin deve fornecer o EPI gratuitamente, adequado ao risco e em bom estado.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 0,
        feedback_ok: "Verdadeiro! Fornecimento gratuito, adequado ao risco e em perfeito estado.",
        feedback_nok: "É verdadeiro: a empresa fornece o EPI sem custo, adequado e conservado."
    },
    {
        q: "O colaborador pode usar qualquer EPI trazido de casa, sem aprovação da empresa.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 1,
        feedback_ok: "Correto! Só se usa o EPI fornecido/aprovado pela organização.",
        feedback_nok: "Falso. O dever é usar o EPI fornecido pela empresa, aprovado e adequado."
    },
    {
        q: "O EPI entra quando a proteção coletiva não é viável ou não oferece proteção completa.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 0,
        feedback_ok: "Verdadeiro! O EPI complementa (ou cobre temporariamente) a proteção coletiva.",
        feedback_nok: "É verdadeiro: o EPI é usado quando a proteção coletiva não basta."
    },
    {
        q: "Basta usar o EPI só quando o fiscal estiver presente.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 1,
        feedback_ok: "Correto! O uso é obrigatório sempre que houver risco — não só na fiscalização.",
        feedback_nok: "Falso. O EPI deve ser usado sempre que a atividade exigir proteção."
    },
    {
        q: "Danificar, extraviar ou alterar o EPI exige comunicação imediata para substituição.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 0,
        feedback_ok: "Verdadeiro! Comunicar dano/extravio garante reposição e continuidade da proteção.",
        feedback_nok: "É verdadeiro: comunicar imediatamente permite substituir o EPI danificado."
    },
    {
        q: "A organização deve adquirir apenas EPIs aprovados pelo órgão nacional competente.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 0,
        feedback_ok: "Verdadeiro! Só equipamentos aprovados (ex.: com CA), além de treinar e registrar.",
        feedback_nok: "É verdadeiro: a empresa só adquire EPIs aprovados e orienta o uso correto."
    },
    {
        q: "Emprestar o EPI do colega de outro setor, sem critério, é uma boa prática.",
        opts: ['Verdadeiro', 'Falso'],
        correct: 1,
        feedback_ok: "Correto! Cada trabalhador usa o EPI adequado à sua atividade e risco.",
        feedback_nok: "Falso. EPI é individual e deve ser adequado à função — não se improvisa com empréstimo."
    }
];
const quiz2 = createQuizEngine('q2', q2_questions, q2_questions.length, { format: 'tf', minCorrect: Math.floor(q2_questions.length / 2) + 1 });
function startQuiz2Intro() { quiz2.start(); }
function verifyAnswer2() { quiz2.verify(); }
function nextQuestion2() { quiz2.next(); }
function resetQuiz2() { quiz2.reset(); }

/* ════════════════════════════════════════
   QUIZ 3 — Módulo 3: Permitido / Proibido (conduta com EPI)
   ════════════════════════════════════════ */
const q3_questions = [
    {
        q: "Usar capacete de segurança com carneira ajustada e cinta jugular na manutenção.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 0,
        feedback_ok: "Permitido! Capacete + carneira + jugular protegem a cabeça corretamente.",
        feedback_nok: "Essa conduta é permitida — é o uso correto do capacete."
    },
    {
        q: "Entrar no depósito com chinelo aberto, sem calçado de segurança.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 1,
        feedback_ok: "Proibido! Calçado de segurança é obrigatório nas áreas de risco.",
        feedback_nok: "É proibido. Chinelo não protege — use o calçado indicado."
    },
    {
        q: "No corte de madeira, utilizar respirador PFF3 contra partículas finas.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 0,
        feedback_ok: "Permitido! No corte de madeira o PFF3 é o respirador correto.",
        feedback_nok: "É permitido e obrigatório: PFF3 no corte de madeira."
    },
    {
        q: "Fixar talabarte/trava-quedas abaixo do nível dos pés em trabalho em altura.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 1,
        feedback_ok: "Proibido! A ancoragem deve ficar acima do nível da cintura.",
        feedback_nok: "É proibido. Ancore sempre acima da cintura para reduzir o fator de queda."
    },
    {
        q: "Continuar a tarefa com luvas rasgadas porque “já está no meio do serviço”.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 1,
        feedback_ok: "Proibido! EPI danificado deve ser substituído imediatamente.",
        feedback_nok: "É proibido. Pare, comunique e troque o EPI danificado."
    },
    {
        q: "Usar óculos de proteção e/ou protetor facial contra partículas e respingos.",
        opts: ['✓ PERMITIDO', '✕ PROIBIDO'],
        correct: 0,
        feedback_ok: "Permitido! Olhos e face precisam dessa proteção nas atividades de risco.",
        feedback_nok: "É permitido — e necessário — proteger olhos e face com o EPI adequado."
    }
];
const quiz3 = createQuizEngine('q3', q3_questions, q3_questions.length, { format: 'permit', minCorrect: Math.floor(q3_questions.length / 2) + 1 });
function startQuiz3Intro() { quiz3.start(); }
function verifyAnswer3() { quiz3.verify(); }
function nextQuestion3() { quiz3.next(); }
function resetQuiz3() { quiz3.reset(); }

/* OLD q1 block removed — replaced above */

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
(function resolveEntrySlide() {
    var restoreIdx = null;
    try {
        var params = new URLSearchParams(window.location.search || '');
        if (params.has('restoreslide')) {
            restoreIdx = parseInt(params.get('restoreslide'), 10);
        }
    } catch (e) { }
    if (restoreIdx == null) {
        try {
            var entryRestore = sessionStorage.getItem('nr06_nav_entry') || '';
            if (entryRestore.indexOf('restore:') === 0) {
                restoreIdx = parseInt(entryRestore.slice(8), 10);
                sessionStorage.removeItem('nr06_nav_entry');
            }
        } catch (e) { }
    } else {
        try { sessionStorage.removeItem('nr06_nav_entry'); } catch (e) { }
    }
    if (restoreIdx != null && !isNaN(restoreIdx)) {
        currentSlide = Math.max(0, Math.min(TOTAL - 1, restoreIdx));
        try {
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.hash);
            }
        } catch (e) { }
        return;
    }

    var entry = 'first';
    try {
        entry = sessionStorage.getItem('nr06_nav_entry') || 'first';
        sessionStorage.removeItem('nr06_nav_entry');
    } catch (e) { }
    if (entry === 'last') {
        currentSlide = Math.max(0, TOTAL - 1);
    } else {
        currentSlide = 0;
    }
})();
trackHistory(currentSlide);

document.querySelectorAll('.slide').forEach((s, i) => {
    if (i === currentSlide) s.classList.add('active');
    else s.classList.remove('active');
});
const pbarInit = document.getElementById('pbar');
if (pbarInit) pbarInit.style.width = (nr11GlobalSlide() / NR11_TOTAL_SLIDES * 100) + '%';

const counterInit = document.getElementById('slide-counter');
if (counterInit) {
    counterInit.textContent = nr11GlobalSlide() + ' / ' + NR11_TOTAL_SLIDES;
    counterInit.style.visibility = 'visible';
}
const btnBackInit = document.getElementById('btn-back');
if (btnBackInit) {
    btnBackInit.disabled = (currentSlide === 0 && !window.MODULE_NAV.prev);
    btnBackInit.style.visibility = (currentSlide === 0 && !window.MODULE_NAV.prev) ? 'hidden' : 'visible';
}
const btnFwdInit = document.getElementById('btn-fwd');
if (btnFwdInit) {
    btnFwdInit.style.visibility = 'visible';
}

buildDots();
if (document.getElementById('q1-question-panel')) quiz1.render();
if (document.getElementById('q3-question-panel')) quiz3.render();
try { syncSlideVideos(currentSlide); } catch (e) { }
updateNextButton();
try { window.updateQuizAudioHelper(); } catch (e) { }
try {
    var _bootSlide = document.querySelectorAll('.slide')[currentSlide];
    if (typeof forceMobileCenterSlide === 'function') forceMobileCenterSlide(_bootSlide);
} catch (e) { }

window.addEventListener('pagehide', pauseAllSlideVideos);

// removed persistence

document.addEventListener('DOMContentLoaded', () => {
    const interactives = document.querySelectorAll('.risk-card, .vplay, .c-badge');
    const savedReqs = _loadReqState();
    interactives.forEach((el, i) => {
        el.classList.add('req-item');
        el.title = 'Clique para confirmar leitura';
        // tag with stable index for persistence
        el.dataset.reqIndex = i;
        // restore
        if (savedReqs && savedReqs.indexOf(i) !== -1) {
            el.classList.add('req-done');
        }
        el.addEventListener('click', function () {
            if (this.classList.contains('req-done')) return;
            this.classList.add('req-done');
            // persist
            try {
                const idx = parseInt(this.dataset.reqIndex);
                const arr = _loadReqState();
                if (arr.indexOf(idx) === -1) arr.push(idx);
                _saveReqState(arr);
            } catch (e) { }
            updateNextButton();
        });
    });

    try { syncSlideVideos(currentSlide); } catch (e) { }

    updateNextButton();
});
// ==========================================
// LÓGICA DO VERDADEIRO OU FALSO (MÓDULO 2)
// ==========================================
const styleHUD = document.createElement('style');
styleHUD.textContent = `
        .hud-glow-correct {
          box-shadow: 0 0 30px rgba(46, 204, 113, 0.4) !important;
          transform: scale(1.01);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 12px;
        }
        .hud-glow-error {
          box-shadow: 0 0 30px rgba(231, 76, 60, 0.4) !important;
          transform: scale(1.01);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 12px;
        }
        .tf-btn {
          transition: transform 0.1s ease, box-shadow 0.3s ease, background 0.3s ease !important;
        }
        .tf-btn:active {
          transform: scale(0.95) !important;
        }
        .btn-tf-verify {
          background: #ffffff;
          color: #1A1440;
          border: none;
          padding: 15px 40px;
          border-radius: 99px;
          font-family: var(--font-h);
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(255,255,255,0.2);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .btn-tf-verify:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 0 40px rgba(255,255,255,0.35);
        }
        .btn-tf-verify:active {
          transform: translateY(0);
        }
        .tf-btn.selected-visual {
          transform: scale(0.98);
          border-color: var(--gold) !important;
          box-shadow: 0 0 15px rgba(246, 213, 12, 0.4);
        }
        .hud-anim-enter {
          animation: hudFadeIn 0.4s ease forwards;
        }
        @keyframes hudFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
document.head.appendChild(styleHUD);

function playHUDBeep(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!window.hudAudioCtx) window.hudAudioCtx = new AudioContext();
        const ctx = window.hudAudioCtx;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(850, now + 0.1);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
            gain.gain.linearRampToValueAtTime(0.0, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'incorrect') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(250, now + 0.25);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
            gain.gain.linearRampToValueAtTime(0.0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'transition') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
            gain.gain.linearRampToValueAtTime(0.0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'conclusion') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.15);
            osc.frequency.setValueAtTime(659, now + 0.3);
            osc.frequency.setValueAtTime(880, now + 0.45);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
            gain.gain.linearRampToValueAtTime(0.0, now + 0.8);
            osc.start(now);
            osc.stop(now + 0.8);
        }
    } catch (e) { }
}

const q2Data = [
    { q: "Um operador transporta um palete com a carga a aproximadamente 15-20cm do solo durante todo o percurso.", ans: true, exp: "✅ Correto! A carga deve ser mantida baixa, a aproximadamente 15 a 20 cm do solo, garantindo equilíbrio e estabilidade." },
    { q: "Uma empilhadeira opera em alta velocidade sob forte chuva com os faróis desligados.", ans: false, exp: "🟠 Ato inseguro! Na chuva, a velocidade deve ser reduzida e os faróis mantidos acesos para garantir visibilidade e avisar pedestres." },
    { q: "Um colega de trabalho pega carona na lateral da empilhadeira durante a operação.", ans: false, exp: "🟠 Proibido! Não é permitido dar carona a outras pessoas. O veículo nunca deve ser usado como transporte de pedestres." },
    { q: "Ao fim do expediente, o operador estaciona a empilhadeira em uma rampa.", ans: false, exp: "🟠 Ato inseguro! A norma proíbe terminantemente o estacionamento da empilhadeira em rampas e declives." },
    { q: "Saindo fumaça do motor, o operador para a máquina, pede ajuda e usa o extintor da empilhadeira.", ans: true, exp: "✅ Correto! Em caso de incêndio, pedir ajuda e iniciar o combate com o extintor adequado é o procedimento correto." }
];

let currentQ2 = 0;
let scoreQ2 = 0;
let sq2Answered = false;

function sq2IsMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function sq2ResetMobileOpts() {
    const optTrue = document.getElementById('sq2-m-opt-true');
    const optFalse = document.getElementById('sq2-m-opt-false');
    [optTrue, optFalse].forEach(function (o) {
        if (!o) return;
        o.className = 'q-opt';
        o.style.pointerEvents = '';
    });
}

function sq2RenderMobileDots(idx) {
    for (let i = 0; i < q2Data.length; i++) {
        const d = document.getElementById('sq2mdot' + i);
        if (!d) continue;
        d.className = 'qdot2' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
    }
}

function sq2FormatFeedback(correct, exp) {
    const header = correct ? '✓ RESPOSTA CORRETA' : '✕ RESPOSTA INCORRETA';
    const cls = correct ? 'success' : 'error';
    return '<div class="quiz-feedback ' + cls + '">' + header + '</div>'
        + '<div class="quiz-feedback-exp">' + exp + '</div>';
}

function startSq2IntroLegacy() {
    const intro = document.getElementById('sq2-intro-panel');
    const panel = document.getElementById('sq2-question-panel');
    if (intro) intro.style.display = 'none';
    if (panel) panel.style.display = 'block';
    currentQ2 = 0; scoreQ2 = 0; sq2Answered = false;
    sq2Load(0);
}

function sq2Load(idx) {
    const q = q2Data[idx];
    sq2Answered = false;

    if (sq2IsMobile()) {
        const counter = document.getElementById('sq2-m-counter');
        const text = document.getElementById('sq2-m-text');
        const fb = document.getElementById('sq2-m-feedback');
        const nextBtn = document.getElementById('btn-next-sq2');
        if (counter) counter.textContent = (idx + 1) + ' DE ' + q2Data.length;
        if (text) text.textContent = q.q;
        if (fb) { fb.className = 'q-feedback'; fb.innerHTML = ''; }
        if (nextBtn) nextBtn.className = 'btn-next-q';
        if (nextBtn) { nextBtn.style.display = 'none'; nextBtn.disabled = false; }
        const audioCounter = document.getElementById('sq2-counter');
        const audioText = document.getElementById('sq2-text');
        if (audioCounter) audioCounter.textContent = 'Pergunta ' + (idx + 1) + ' de ' + q2Data.length;
        if (audioText) audioText.textContent = q.q;
        sq2ResetMobileOpts();
        sq2RenderMobileDots(idx);
        return;
    }

    const counter = document.getElementById('sq2-counter');
    const text = document.getElementById('sq2-text');
    const fb = document.getElementById('sq2-feedback');
    const badge = document.getElementById('sq2-badge');
    if (counter) counter.textContent = 'SITUAÇÃO ' + (idx + 1) + ' DE ' + q2Data.length;
    if (text) text.textContent = q.q;
    if (fb) { fb.className = 'cctv-feedback'; fb.innerHTML = ''; }
    if (badge) badge.innerHTML = '📺 CÂMERA ' + (idx + 1);
    const btnTrue = document.getElementById('sq2-btn-true');
    const btnFalse = document.getElementById('sq2-btn-false');
    const nextBtnDesktop = document.getElementById('btn-next-sq2-desktop');
    if (btnTrue) { btnTrue.className = 'cctv-btn safe'; btnTrue.style.pointerEvents = ''; }
    if (btnFalse) { btnFalse.className = 'cctv-btn danger'; btnFalse.style.pointerEvents = ''; }
    if (nextBtnDesktop) {
        nextBtnDesktop.className = 'btn-next-q';
        nextBtnDesktop.style.display = 'none';
        nextBtnDesktop.disabled = false;
    }
    document.querySelectorAll('.sq2-cctv-desktop .cctv-dot').forEach(function (d, i) {
        d.className = 'cctv-dot' + (i < idx ? ' done' : '') + (i === idx ? ' active' : '');
    });
}

function sq2Answer(answer) {
    if (sq2Answered) return;
    const q = q2Data[currentQ2];
    const correct = answer === q.ans;

    if (sq2IsMobile()) {
        sq2Answered = true;
        const optTrue = document.getElementById('sq2-m-opt-true');
        const optFalse = document.getElementById('sq2-m-opt-false');
        const fb = document.getElementById('sq2-m-feedback');
        const nextBtn = document.getElementById('btn-next-sq2');
        const chosen = answer === true ? optTrue : optFalse;
        const other = answer === true ? optFalse : optTrue;
        const correctOpt = q.ans === true ? optTrue : optFalse;

        sq2ResetMobileOpts();
        [optTrue, optFalse].forEach(function (o) { if (o) o.style.pointerEvents = 'none'; });

        if (correct) {
            scoreQ2++;
            if (chosen) chosen.classList.add('correct');
            if (fb) { fb.innerHTML = sq2FormatFeedback(true, q.exp); fb.className = 'q-feedback ok'; }
            try { playBeep('ok'); } catch (e) { }
        } else {
            if (chosen) chosen.classList.add('wrong');
            if (correctOpt) correctOpt.classList.add('correct');
            if (fb) { fb.innerHTML = sq2FormatFeedback(false, q.exp); fb.className = 'q-feedback nok'; }
            try { playBeep('nok'); } catch (e) { }
        }
        if (nextBtn) {
            const isLast = currentQ2 >= q2Data.length - 1;
            nextBtn.textContent = isLast ? 'Ver resultado →' : 'Continuar →';
            nextBtn.disabled = true;
            nextBtn.style.pointerEvents = 'none';
            nextBtn.className = 'btn-next-q show';
            nextBtn.style.display = 'inline-flex';
            setTimeout(function () {
                nextBtn.disabled = false;
                nextBtn.style.pointerEvents = 'auto';
            }, 450);
            setTimeout(function () {
                nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 200);
        }
        return;
    }

    sq2Answered = true;
    const fb = document.getElementById('sq2-feedback');
    const btnTrue = document.getElementById('sq2-btn-true');
    const btnFalse = document.getElementById('sq2-btn-false');
    const nextBtnDesktop = document.getElementById('btn-next-sq2-desktop');
    if (btnTrue) btnTrue.style.pointerEvents = 'none';
    if (btnFalse) btnFalse.style.pointerEvents = 'none';
    if (correct) {
        scoreQ2++;
        if (answer === true && btnTrue) { btnTrue.className = 'cctv-btn safe flash-correct'; }
        else if (btnFalse) { btnFalse.className = 'cctv-btn danger flash-correct'; }
        if (fb) { fb.innerHTML = sq2FormatFeedback(true, q.exp); fb.className = 'cctv-feedback correct'; }
        try { playBeep('ok'); } catch (e) { }
    } else {
        if (answer === true && btnTrue) { btnTrue.className = 'cctv-btn safe flash-wrong'; }
        else if (btnFalse) { btnFalse.className = 'cctv-btn danger flash-wrong'; }
        if (fb) { fb.innerHTML = sq2FormatFeedback(false, q.exp); fb.className = 'cctv-feedback wrong'; }
        try { playBeep('nok'); } catch (e) { }
    }
    if (nextBtnDesktop) {
        const isLast = currentQ2 >= q2Data.length - 1;
        nextBtnDesktop.textContent = isLast ? 'Ver resultado →' : 'Continuar →';
        nextBtnDesktop.disabled = true;
        nextBtnDesktop.style.pointerEvents = 'none';
        nextBtnDesktop.className = 'btn-next-q show';
        nextBtnDesktop.style.display = 'inline-flex';
        setTimeout(function () {
            nextBtnDesktop.disabled = false;
            nextBtnDesktop.style.pointerEvents = 'auto';
        }, 450);
        setTimeout(function () {
            nextBtnDesktop.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 200);
    }
}

function sq2NextQuestion() {
    if (!sq2Answered) return;
    currentQ2++;
    if (currentQ2 < q2Data.length) {
        sq2Load(currentQ2);
    } else {
        sq2ShowResult();
    }
}

function sq2ShowResult() {
    document.getElementById('sq2-question-panel').style.display = 'none';
    const rPanel = document.getElementById('sq2-result-panel');
    rPanel.style.display = 'block';
    const pct = Math.round((scoreQ2 / q2Data.length) * 100);
    const approved = pct >= 70;
    document.getElementById('sq2-pct').textContent = pct + '%';
    document.getElementById('sq2-stars').textContent = pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : '⭐';
    document.getElementById('sq2-status').textContent = approved ? '✅ Aprovado!' : '❌ Quase lá!';
    document.getElementById('sq2-status').className = 'r-status ' + (approved ? 'ap' : 'ref');
    document.getElementById('sq2-sub').textContent = `Você acertou ${scoreQ2} de 5 questões.` + (approved ? ' Parabéns!' : ' Revise o módulo e tente novamente.');
    if (approved && typeof updateNextButton === 'function') updateNextButton();
    if (typeof playHUDBeep === 'function') playHUDBeep('conclusion');
}

function sq2Retry() {
    currentQ2 = 0; scoreQ2 = 0; sq2Answered = false;
    document.getElementById('sq2-result-panel').style.display = 'none';
    document.getElementById('sq2-question-panel').style.display = 'block';
    sq2Load(0);
}

/* ════════════════════════════════════════
   ENGINE: MITO × VERDADE (página 5) — modelo NR-11 condução (p.19)
   ════════════════════════════════════════ */
const mitoData = [
    {
        text: '“Segurança é assunto do time de SSO, não meu.”',
        isVerdade: false,
        explanation: 'A NR-06 divide o papel de cada um: a liderança fornece e fiscaliza, o SSO orienta e o colaborador usa e conserva. Sem os três, a barreira falha.'
    },
    {
        text: '“A empresa é obrigada a fornecer o EPI de graça.”',
        isVerdade: true,
        explanation: 'O art. 166 da CLT e a NR-06 exigem EPI gratuito, adequado ao risco da função e em perfeito estado de conservação.'
    },
    {
        text: '“Tenho experiência, faço rápido e sem o EPI dá certo.”',
        isVerdade: false,
        explanation: 'Nenhum tempo de casa substitui a barreira física. O acidente acontece exatamente no segundo em que o EPI não está no corpo.'
    },
    {
        text: '“Recusar o uso do EPI tem consequência.”',
        isVerdade: true,
        explanation: 'O uso é obrigatório. A recusa injustificada é considerada ato faltoso pela CLT e pode gerar medida disciplinar.'
    }
];
let currentMito = 0;
let mitoAnswered = false;
let mitoLastCorrect = false;
let selectedMitoAns = null;

function renderMitoDots() {
    for (let i = 0; i < mitoData.length; i++) {
        const d = document.getElementById('mito-dot' + i);
        if (!d) continue;
        d.className = 'qdot2';
        if (i < currentMito) d.classList.add('done');
        if (i === currentMito) d.classList.add('cur');
    }
}

function hideMitoVerify() {
    const vContainer = document.getElementById('mito-verify-container');
    if (!vContainer) return;
    vContainer.style.display = 'none';
    vContainer.style.opacity = '0';
    vContainer.style.visibility = 'hidden';
}

function showMitoVerify() {
    const vContainer = document.getElementById('mito-verify-container');
    if (!vContainer) return;
    vContainer.style.display = 'block';
    setTimeout(function () {
        vContainer.style.opacity = '1';
        vContainer.style.visibility = 'visible';
    }, 50);
}

function loadMito(idx) {
    if (idx >= mitoData.length) return;
    if (!document.getElementById('mito-question-panel')) return;

    mitoAnswered = false;
    mitoLastCorrect = false;
    selectedMitoAns = null;
    currentMito = idx;

    const counter = document.getElementById('mito-counter');
    if (counter) counter.textContent = 'Afirmação ' + (idx + 1) + ' de ' + mitoData.length;

    const textElement = document.getElementById('mito-text');
    if (textElement) textElement.textContent = mitoData[idx].text;

    const opts = document.getElementById('mito-options');
    if (opts) {
        opts.innerHTML = '';
        [
            { label: 'Verdade', value: true, letter: 'A' },
            { label: 'Mito', value: false, letter: 'B' }
        ].forEach(function (opt) {
            const el = document.createElement('div');
            el.className = 'q-opt';
            el.innerHTML = '<div class="opt-l">' + opt.letter + '</div><span>' + opt.label + '</span>';
            el.onclick = function () { answerMito(opt.value, el); };
            opts.appendChild(el);
        });
    }

    const fb = document.getElementById('mito-feedback');
    if (fb) { fb.className = 'q-feedback'; fb.textContent = ''; }

    hideMitoVerify();

    const btnNext = document.getElementById('btn-next-mito');
    if (btnNext) {
        btnNext.className = 'btn-next-q';
        btnNext.style.display = 'none';
        btnNext.disabled = false;
        btnNext.textContent = 'Continuar →';
    }

    renderMitoDots();
    try { window.updateQuizAudioHelper(); } catch (e) { }
    try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('mito-question'); } catch (e) { }
}

window.answerMito = function (isVerdadeBtn, el) {
    if (mitoAnswered) return;

    try { playBeep('click'); } catch (e) { }
    selectedMitoAns = isVerdadeBtn;

    const allOpts = document.querySelectorAll('#mito-options .q-opt');
    allOpts.forEach(function (o) {
        try { clearAnswerState(o); } catch (e) {
            o.classList.remove('selected', 'correct', 'wrong', 'muted', 'answered');
        }
    });
    if (el) el.classList.add('selected');

    showMitoVerify();
};

window.verifyMito = function () {
    if (mitoAnswered || selectedMitoAns === null) return;
    mitoAnswered = true;

    const data = mitoData[currentMito];
    const isCorrect = (data.isVerdade === selectedMitoAns);
    mitoLastCorrect = isCorrect;
    const isLast = currentMito === mitoData.length - 1;

    hideMitoVerify();

    const allOpts = document.querySelectorAll('#mito-options .q-opt');
    allOpts.forEach(function (o) {
        try { clearAnswerState(o); } catch (e) {
            o.classList.remove('selected', 'correct', 'wrong', 'muted');
        }
        o.style.pointerEvents = 'none';
        o.classList.add('answered');
    });

    function setOptIcon(optEl, icon) {
        if (!optEl) return;
        const letter = optEl.querySelector('.opt-l');
        if (letter) letter.textContent = icon;
    }

    const selectedIdx = selectedMitoAns ? 0 : 1;
    const correctIdx = data.isVerdade ? 0 : 1;

    if (isCorrect) {
        if (allOpts[selectedIdx]) {
            allOpts[selectedIdx].classList.add('correct');
            setOptIcon(allOpts[selectedIdx], '✓');
        }
        try { playBeep('ok'); } catch (e) { }
    } else {
        if (allOpts[selectedIdx]) {
            allOpts[selectedIdx].classList.add('wrong');
            setOptIcon(allOpts[selectedIdx], '✕');
        }
        if (allOpts[correctIdx]) {
            allOpts[correctIdx].classList.add('correct');
            setOptIcon(allOpts[correctIdx], '✓');
        }
        try { playBeep('nok'); } catch (e) { }
    }

    allOpts.forEach(function (o) {
        if (!o.classList.contains('correct') && !o.classList.contains('wrong')) {
            o.classList.add('muted');
        }
    });

    const fb = document.getElementById('mito-feedback');
    if (fb) {
        fb.textContent = data.explanation;
        fb.className = 'q-feedback ' + (isCorrect ? 'ok' : 'nok');
    }

    const btnNext = document.getElementById('btn-next-mito');
    if (btnNext) {
        if (isLast && isCorrect) {
            btnNext.className = 'btn-next-q';
            btnNext.style.display = 'none';
            const panel = document.getElementById('mito-question-panel');
            if (panel) panel.classList.add('req-done');
            try { updateNextButton(); } catch (e) { }
            try { playHUDBeep('conclusion'); } catch (e) { try { playBeep('end'); } catch (e2) { } }
        } else {
            btnNext.textContent = isCorrect ? 'Continuar →' : 'Tentar novamente →';
            btnNext.disabled = true;
            btnNext.style.pointerEvents = 'none';
            btnNext.className = 'btn-next-q show';
            btnNext.style.display = 'inline-flex';
            setTimeout(function () {
                btnNext.disabled = false;
                btnNext.style.pointerEvents = 'auto';
            }, 450);
        }
    }

    try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('mito-feedback'); } catch (e) { }
};

window.nextMito = function () {
    if (!mitoAnswered) return;

    if (!mitoLastCorrect) {
        loadMito(currentMito);
        return;
    }

    if (currentMito >= mitoData.length - 1) {
        const btnNext = document.getElementById('btn-next-mito');
        if (btnNext) {
            btnNext.className = 'btn-next-q';
            btnNext.style.display = 'none';
        }
        const panel = document.getElementById('mito-question-panel');
        if (panel) panel.classList.add('req-done');
        try { updateNextButton(); } catch (e) { }
        return;
    }

    try { playBeep('click'); } catch (e) { }
    currentMito++;
    loadMito(currentMito);
};

window.addEventListener('DOMContentLoaded', function () {
    const qPanel = document.getElementById('mito-question-panel');
    if (!qPanel) return;
    qPanel.style.display = 'block';
    loadMito(0);
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    const introPanel = document.getElementById('sq2-intro-panel');
    if (introPanel) introPanel.style.display = 'block';

    const qPanel = document.getElementById('sq2-question-panel');
    if (qPanel) qPanel.style.display = 'none';
});

window.checkMod4Item = function (el) {
    if (el.classList.contains('req-done')) return;
    if (window.soundClick) window.soundClick.play();
    el.classList.add('req-done');
    el.classList.add('active');

    const reqs = el.closest('.m4-check-list').querySelectorAll('.req-item');
    const done = el.closest('.m4-check-list').querySelectorAll('.req-done').length;
    const fill = el.closest('.slide').querySelector('.m4-progress-fill');
    const text = el.closest('.slide').querySelector('.m4-progress-top span:last-child');

    if (fill) fill.style.width = ((done / reqs.length) * 100) + '%';
    if (text) text.textContent = done + '/' + reqs.length + ' ITENS';

    if (done === reqs.length) {
        if (window.soundCorrect) setTimeout(() => window.soundCorrect.play(), 200);
        const comp = el.closest('.slide').querySelector('.m4-completion');
        if (comp) comp.style.display = 'block';

        const contentArea = el.closest('.slide').querySelector('.content-area');
        if (contentArea) {
            contentArea.style.justifyContent = 'flex-start';
        }
    }
    updateNextButton();
}

/* ════════════════════════════════════════
   QUIZ 4 — Módulo 4: Liberar uso do EPI? (gatekeeper)
   ════════════════════════════════════════ */
const q4_questions = [
    {
        theme: 'TÉCNICO DE MANUTENÇÃO',
        q: "O técnico chega com capacete + jugular, óculos, calçado de segurança, protetor auricular e luvas adequadas.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 0,
        feedback_ok: "Liberar! Kit completo de manutenção está em conformidade.",
        feedback_nok: "Deve liberar: o kit de manutenção está completo e correto."
    },
    {
        theme: 'OPERADOR DE EMPILHADEIRA',
        q: "O operador inicia sem protetor auricular, só com capacete e calçado.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 1,
        feedback_ok: "Não liberar! Falta protetor auricular (e óculos contra partículas, conforme o kit).",
        feedback_nok: "Não liberar até completar: capacete, óculos, calçado com biqueira e protetor auricular."
    },
    {
        theme: 'DRIVE-IN',
        q: "Assessor do drive-in com óculos, calçado, PFF2, creme protetor e protetor solar.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 0,
        feedback_ok: "Liberar! Esse é o kit adequado ao drive-in.",
        feedback_nok: "Deve liberar: óculos, calçado, PFF2, creme e protetor solar estão corretos."
    },
    {
        theme: 'CORTE DE MADEIRA',
        q: "No corte, o colaborador usa máscara cirúrgica comum no lugar do respirador.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 1,
        feedback_ok: "Não liberar! No corte de madeira o respirador obrigatório é o PFF3.",
        feedback_nok: "Não liberar. Exija PFF3 — máscara cirúrgica não protege partículas finas de madeira."
    },
    {
        theme: 'CENTRAL DE CORES',
        q: "Na manipulação de pigmentos, usa luvas nitrílicas e óculos contra respingos químicos.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 0,
        feedback_ok: "Liberar! Luvas nitrílicas + óculos químicos são a defesa certa.",
        feedback_nok: "Deve liberar: esse é o par essencial na central de cores."
    },
    {
        theme: 'EPI DANIFICADO',
        q: "O colaborador insiste em começar com o EPI rasgado “só por hoje”, prometendo trocar depois.",
        opts: ['✓ LIBERAR', '✕ NÃO LIBERAR'],
        correct: 1,
        feedback_ok: "Não liberar! EPI danificado deve ser substituído antes de qualquer atividade.",
        feedback_nok: "Não liberar. Sem EPI íntegro, a operação não começa — prevenção vem primeiro."
    }
];
const quiz4 = createQuizEngine('q4', q4_questions, q4_questions.length, { format: 'gate', minCorrect: Math.floor(q4_questions.length / 2) + 1 });
if (document.getElementById('q4-question-panel')) quiz4.render();
function startQuiz4Intro() { quiz4.start(); }
function verifyAnswer4() { quiz4.verify(); }
function nextQuestion4() { quiz4.next(); }
function resetQuiz4() { quiz4.reset(); }

/* q4 NR-06 — gatekeeper Liberar uso (acima). */
const q5_questions_unused_legacy = [
    {
        q: '<img src="https://i.imgur.com/YZ03elm.png" style="width:100%; height:180px; object-fit:cover; object-position:center; border-radius:8px; margin-bottom:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5);"><div style="font-size:15px;color:var(--gold);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-family:var(--font-h);font-weight:700;">Corredor Obstruído</div><p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;line-height:1.4;">O operador encontrou um corredor parcialmente bloqueado durante a movimentação da carga.</p><div style="font-size:clamp(16px, 2.2vw, 20px);color:var(--cream);font-family:var(--font-h);line-height:1.3;text-align:center;">Qual deve ser o procedimento correto?</div>',
        opts: ['Continuar normalmente', 'Sinalizar e liberar o corredor antes da operação', 'Passar rapidamente pelo bloqueio', 'Ignorar o obstáculo'],
        correct: 1, feedback_ok: '✅ Correto! O corredor deve ser sinalizado e liberado antes de qualquer movimentação.', feedback_nok: '❌ Incorreto. É necessário sinalizar e liberar o corredor antes da operação.'
    },
    {
        q: '<img src="https://i.imgur.com/jxIK2Rh.png" style="width:100%; height:180px; object-fit:cover; object-position:center; border-radius:8px; margin-bottom:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5);"><div style="font-size:15px;color:var(--gold);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-family:var(--font-h);font-weight:700;">Carga Elevada</div><p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;line-height:1.4;">A carga está sendo transportada acima da altura recomendada.</p><div style="font-size:clamp(16px, 2.2vw, 20px);color:var(--cream);font-family:var(--font-h);line-height:1.3;text-align:center;">Qual é o principal risco desta operação?</div>',
        opts: ['Melhor visibilidade', 'Maior estabilidade', 'Maior velocidade', 'Comprometimento da visibilidade e risco de colisão'],
        correct: 3, feedback_ok: '✅ Correto! Transportar cargas elevadas compromete a visibilidade e aumenta gravemente os riscos de colisão.', feedback_nok: '❌ Incorreto. O principal risco é o comprometimento da visibilidade e a colisão.'
    },
    {
        q: '<img src="https://i.imgur.com/EwLaKkj.png" style="width:100%; height:180px; object-fit:cover; object-position:center; border-radius:8px; margin-bottom:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5);"><div style="font-size:15px;color:var(--gold);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-family:var(--font-h);font-weight:700;">EPI Ausente</div><p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;line-height:1.4;">O operador iniciou a movimentação sem todos os EPIs obrigatórios.</p><div style="font-size:clamp(16px, 2.2vw, 20px);color:var(--cream);font-family:var(--font-h);line-height:1.3;text-align:center;">Qual procedimento está correto?</div>',
        opts: ['Interromper a operação até regularizar os EPIs', 'Operar apenas em áreas vazias', 'Continuar se a operação for rápida', 'Solicitar ajuda apenas em caso de risco'],
        correct: 0, feedback_ok: '✅ Correto! Nenhuma operação deve prosseguir sem os EPIs regularizados e em conformidade.', feedback_nok: '❌ Incorreto. O procedimento correto é interromper a operação até regularizar os EPIs.'
    },
    {
        q: '<img src="https://i.imgur.com/V9SVveG.png" style="width:100%; height:180px; object-fit:cover; object-position:center; border-radius:8px; margin-bottom:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5);"><div style="font-size:15px;color:var(--gold);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-family:var(--font-h);font-weight:700;">Emergência Operacional</div><p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;line-height:1.4;">Foi identificado um princípio de incêndio próximo à área de movimentação.</p><div style="font-size:clamp(16px, 2.2vw, 20px);color:var(--cream);font-family:var(--font-h);line-height:1.3;text-align:center;">Qual deve ser a primeira ação?</div>',
        opts: ['Continuar a operação', 'Improvisar sozinho o combate', 'Parar a operação e afastar as pessoas', 'Mover a carga rapidamente'],
        correct: 2, feedback_ok: '✅ Correto! Parar a operação imediatamente e priorizar a vida afastando as pessoas é essencial.', feedback_nok: '❌ Incorreto. A primeira ação deve ser parar a operação e afastar as pessoas.'
    },
    {
        q: '<img src="https://i.imgur.com/mAXUjMF.png" style="width:100%; height:180px; object-fit:cover; object-position:center; border-radius:8px; margin-bottom:10px; box-shadow:0 10px 20px rgba(0,0,0,0.5);"><div style="font-size:15px;color:var(--gold);margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;font-family:var(--font-h);font-weight:700;">Distanciamento Seguro</div><p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px;line-height:1.4;">Durante a movimentação, o operador reduziu excessivamente a distância da estrutura lateral.</p><div style="font-size:clamp(16px, 2.2vw, 20px);color:var(--cream);font-family:var(--font-h);line-height:1.3;text-align:center;">Qual distância mínima deve ser mantida?</div>',
        opts: ['20 cm', '50 cm', '30 cm', 'Não existe distância mínima'],
        correct: 1, feedback_ok: '✅ Correto! Deve-se manter no mínimo 50 cm de distância segura das estruturas.', feedback_nok: '❌ Incorreto. A distância mínima que deve ser mantida é de 50 cm.'
    }
];
const quiz5 = createQuizEngine('q5', q5_questions_unused_legacy, 5);
if (document.getElementById('q5-question-panel')) quiz5.render();
function startQuiz5Intro() { quiz5.start(); }
function verifyAnswer5() { quiz5.verify(); }
function nextQuestion5() { quiz5.next(); }
function resetQuiz5() { quiz5.reset(); }

const q6_questions = [
    { theme:'LEGISLAÇÃO E HABILITAÇÃO', svg:'<circle cx="28" cy="16" r="10" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><rect x="20" y="28" width="16" height="20" rx="3" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><line x1="23" y1="34" x2="33" y2="34" stroke="rgba(246,213,12,0.6)" stroke-width="1.5"/><line x1="23" y1="38" x2="33" y2="38" stroke="rgba(246,213,12,0.6)" stroke-width="1.5"/><text x="28" y="52" font-size="8" text-anchor="middle" fill="rgba(246,213,12,0.7)" font-family="monospace">VENCIDO</text>', q:'O operador está com seu cartão de identificação (com nome e foto) vencido há 2 anos, mas continua operando a máquina normalmente.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:1, feedback_ok:'✅ O cartão possui validade de 1 ano e deve ser revalidado mediante exame de saúde.', feedback_nok:'❌ O cartão possui validade de 1 ano e deve ser revalidado. Esta é uma infração.' },
    { theme:'TRIÂNGULO DA ESTABILIDADE', svg:'<polygon points="28,4 52,48 4,48" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="rgba(246,213,12,0.08)"/><circle cx="28" cy="32" r="5" fill="rgba(246,213,12,0.8)"/><line x1="28" y1="37" x2="28" y2="45" stroke="rgba(246,213,12,0.6)" stroke-width="2" stroke-dasharray="3,3"/>', q:'Para ganhar tempo, o operador faz um giro rápido à esquerda enquanto transporta uma carga pesada elevada.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:1, feedback_ok:'✅ Curvas rápidas deslocam o centro de gravidade fora do triângulo e podem causar tombamento.', feedback_nok:'❌ Curvas rápidas com carga elevada podem causar tombamento. Situação de risco.' },
    { theme:'TRÂNSITO E PEDESTRES', svg:'<rect x="4" y="40" width="48" height="4" rx="1" fill="rgba(246,213,12,0.3)"/><line x1="14" y1="40" x2="14" y2="44" stroke="rgba(246,213,12,0.6)" stroke-width="2"/><line x1="22" y1="40" x2="22" y2="44" stroke="rgba(246,213,12,0.6)" stroke-width="2"/><line x1="30" y1="40" x2="30" y2="44" stroke="rgba(246,213,12,0.6)" stroke-width="2"/><line x1="38" y1="40" x2="38" y2="44" stroke="rgba(246,213,12,0.6)" stroke-width="2"/><circle cx="28" cy="10" r="5" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><line x1="28" y1="15" x2="28" y2="28" stroke="rgba(246,213,12,0.8)" stroke-width="2"/><line x1="20" y1="20" x2="36" y2="20" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/><line x1="28" y1="28" x2="22" y2="38" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/><line x1="28" y1="28" x2="34" y2="38" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/>', q:'Ao se aproximar de um cruzamento interno do galpão, o operador faz a parada obrigatória e toca a buzina antes de prosseguir.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:0, feedback_ok:'✅ A parada obrigatória e o uso da buzina são procedimentos corretos e obrigatórios.', feedback_nok:'❌ Este é o procedimento correto. Parada obrigatória e buzina são exigências da NR-11.' },
    { theme:'MARCHA À RÉ', svg:'<rect x="8" y="18" width="30" height="20" rx="4" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="rgba(246,213,12,0.06)"/><circle cx="14" cy="40" r="5" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><circle cx="32" cy="40" r="5" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><line x1="38" y1="24" x2="50" y2="24" stroke="rgba(246,213,12,0.5)" stroke-width="1" stroke-dasharray="3,2"/><polygon points="46,20 52,24 46,28" fill="rgba(246,213,12,0.7)"/><text x="28" y="14" font-size="8" text-anchor="middle" fill="rgba(246,213,12,0.7)" font-family="monospace">◄ RÉ</text>', q:'O operador transporta uma carga que bloqueia totalmente sua visão frontal e decide conduzir a empilhadeira de marcha à ré.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:0, feedback_ok:'✅ Quando a visão frontal é comprometida, a operação deve ocorrer em marcha à ré.', feedback_nok:'❌ Este é o procedimento correto. Com visão frontal bloqueada, deve-se operar em marcha à ré.' },
    { theme:'CHECKLIST E MANUTENÇÃO', svg:'<rect x="14" y="4" width="28" height="36" rx="3" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><line x1="20" y1="14" x2="36" y2="14" stroke="rgba(246,213,12,0.4)" stroke-width="1.5"/><line x1="20" y1="20" x2="36" y2="20" stroke="rgba(246,213,12,0.4)" stroke-width="1.5"/><line x1="20" y1="26" x2="30" y2="26" stroke="rgba(246,213,12,0.4)" stroke-width="1.5"/><circle cx="34" cy="44" r="8" fill="rgba(220,50,50,0.2)" stroke="rgba(220,50,50,0.8)" stroke-width="1.5"/><line x1="31" y1="41" x2="37" y2="47" stroke="rgba(220,50,50,0.9)" stroke-width="2" stroke-linecap="round"/><line x1="37" y1="41" x2="31" y2="47" stroke="rgba(220,50,50,0.9)" stroke-width="2" stroke-linecap="round"/>', q:'Durante o checklist diário, o operador percebe que a buzina não funciona, registra a falha, mas continua utilizando a máquina.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:1, feedback_ok:'✅ Equipamentos com itens obrigatórios defeituosos devem ser retirados de operação.', feedback_nok:'❌ A buzina é item obrigatório. O equipamento deve ser retirado para manutenção.' },
    { theme:'CARONA PROIBIDA', svg:'<circle cx="20" cy="10" r="5" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="none"/><line x1="20" y1="15" x2="20" y2="26" stroke="rgba(246,213,12,0.8)" stroke-width="2"/><line x1="12" y1="20" x2="28" y2="20" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/><line x1="20" y1="26" x2="15" y2="36" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/><line x1="20" y1="26" x2="25" y2="36" stroke="rgba(246,213,12,0.8)" stroke-width="1.5"/><circle cx="28" cy="28" r="14" stroke="rgba(220,50,50,0.8)" stroke-width="2" fill="none"/><line x1="18" y1="18" x2="38" y2="38" stroke="rgba(220,50,50,0.8)" stroke-width="2.5" stroke-linecap="round"/>', q:'O operador permite que um ajudante viaje em pé na lateral da empilhadeira para atravessar o estoque.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:1, feedback_ok:'✅ Empilhadeiras não são meios de transporte de pessoas. Caronas são terminantemente proibidas.', feedback_nok:'❌ Caronas são proibidas. Empilhadeiras não são meios de transporte de pessoas.' },
    { theme:'CASA DE BATERIAS', svg:'<rect x="8" y="14" width="36" height="24" rx="3" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="rgba(246,213,12,0.06)"/><rect x="18" y="8" width="6" height="6" rx="1" fill="rgba(246,213,12,0.6)"/><rect x="28" y="8" width="6" height="6" rx="1" fill="rgba(246,213,12,0.6)"/><line x1="20" y1="22" x2="20" y2="32" stroke="rgba(246,213,12,0.8)" stroke-width="2"/><line x1="15" y1="27" x2="25" y2="27" stroke="rgba(246,213,12,0.8)" stroke-width="2"/><line x1="30" y1="27" x2="38" y2="27" stroke="rgba(246,213,12,0.5)" stroke-width="2"/><text x="28" y="50" font-size="7" text-anchor="middle" fill="rgba(246,213,12,0.5)" font-family="monospace">H₂O APÓS</text>', q:'Antes de iniciar o carregamento da bateria, o operador completa o nível dos elementos com água.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:1, feedback_ok:'✅ A água deve ser adicionada apenas após o carregamento completo, nunca antes.', feedback_nok:'❌ A água deve ser adicionada apenas após o carregamento completo.' },
    { theme:'EMERGÊNCIA E INCÊNDIO', svg:'<polygon points="28,4 10,44 46,44" stroke="rgba(246,213,12,0.8)" stroke-width="1.5" fill="rgba(246,213,12,0.06)"/><line x1="28" y1="18" x2="28" y2="30" stroke="rgba(246,213,12,0.8)" stroke-width="2.5" stroke-linecap="round"/><circle cx="28" cy="36" r="2.5" fill="rgba(246,213,12,0.8)"/>', q:'Ao ouvir o alarme de incêndio, o operador estaciona a empilhadeira em local seguro, libera a passagem e aguarda as orientações da brigada.', opts:['🟢 OPERAÇÃO SEGURA','🔴 RISCO / INFRAÇÃO'], correct:0, feedback_ok:'✅ O procedimento segue corretamente o plano de emergência.', feedback_nok:'❌ Este é o procedimento correto de emergência.' }
];



function toggleQuiz6Music() {
    const m = document.getElementById('q6-bg-music');
    const btn = document.getElementById('q6-btn-music-toggle');
    if (!m) return;
    m.muted = !m.muted;
    if (m.muted) {
        btn.innerHTML = '🔇 MUSIC OFF';
        btn.style.color = 'var(--red)';
        btn.style.borderColor = 'var(--red)';
    } else {
        btn.innerHTML = '🔊 MUSIC ON';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
    }
}

function playQuiz6Audio(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        if (type === 'start') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 1);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 1);
        } else if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'correct') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine'; osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(440, now);
            osc1.frequency.setValueAtTime(554.37, now + 0.1);
            osc1.frequency.setValueAtTime(659.25, now + 0.2);
            osc2.frequency.setValueAtTime(220, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
            osc1.start(now); osc2.start(now); osc1.stop(now + 0.5); osc2.stop(now + 0.5);
        } else if (type === 'incorrect') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'transition') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.linearRampToValueAtTime(2000, now + 0.2);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'end') {
            // Soft short tech sound instead of strong chord
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.5);
        }
    } catch (e) { }
}

function createQuiz6Engine(questions) {
    let idx = 0, answered = false, score = 0, selectedOptIdx = -1;

    function start() {
        const introPanel = document.getElementById('q6-intro-panel');
        const qPanel = document.getElementById('q6-question-panel');
        if (introPanel) introPanel.style.display = 'none';
        if (qPanel) {
            qPanel.style.display = 'block';
            qPanel.style.opacity = '0';
            setTimeout(() => qPanel.style.opacity = '1', 50);
        }
        playQuiz6Audio('start');
        const m = document.getElementById('q6-bg-music');
        if (m) {
            m.volume = 0.15;
            m.play().catch(e => console.log('Audio autoplay blocked'));
        }
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    function render() {
        const qPanel = document.getElementById('q6-question-panel');
        if (qPanel) qPanel.classList.remove('q-result-anim');
        const q = questions[idx];
        const stepLabels = ['LEGISLAÇÃO','ESTABILIDADE','TRÂNSITO','MARCHA À RÉ','CHECKLIST','CARONA','BATERIA','EMERGÊNCIA'];
        // Contador
        const counter = document.getElementById('q6-counter');
        if (counter) counter.textContent = 'ANÁLISE ' + (idx + 1) + '/' + questions.length;
        // Progress steps
        const prog = document.getElementById('q6-progress');
        if (prog) {
            prog.innerHTML = '';
            for (var i = 0; i < questions.length; i++) {
                var step = document.createElement('div');
                step.className = 'q6-step ' + (i < idx ? 'done' : i === idx ? 'cur' : 'todo');
                var sym = i < idx ? '✓' : (i + 1).toString();
                step.innerHTML = '<div class="q6-step-circle">' + sym + '</div><div class="q6-step-label">' + (stepLabels[i] || '') + '</div>';
                prog.appendChild(step);
            }
        }
        // Ícone SVG
        const svgEl = document.getElementById('q6-icon-svg');
        if (svgEl && q.svg) svgEl.innerHTML = q.svg;
        // Badge
        const badge = document.getElementById('q6-icon-badge');
        if (badge) badge.textContent = q.theme || '';
        // Texto
        const txt = document.getElementById('q6-text');
        if (txt) txt.innerHTML = q.q;
        // Feedback reset
        const fb = document.getElementById('q6-feedback');
        if (fb) { fb.className = 'q-feedback'; fb.textContent = ''; }
        // Botões reset
        document.querySelectorAll('#q6-options .q6-btn').forEach(function(b) { b.classList.remove('selected'); b.style.pointerEvents = ''; });
        const vCont = document.getElementById('q6-verify-container');
        if (vCont) { vCont.style.display = 'none'; vCont.style.opacity = '0'; vCont.style.visibility = 'hidden'; }
        const btn = document.getElementById('btn-next-q6');
        if (btn) btn.className = 'btn-next-q';
        answered = false; selectedOptIdx = -1;
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    function selectAnswer(i, el) {
        if (answered) return;
        selectedOptIdx = i;
        document.querySelectorAll('#q6-options .q6-btn').forEach(function(b) { b.classList.remove('selected'); });
        el.classList.add('selected');
        playQuiz6Audio('click');
        const vCont = document.getElementById('q6-verify-container');
        if (vCont) { vCont.style.display = 'block'; setTimeout(function() { vCont.style.opacity = '1'; vCont.style.visibility = 'visible'; }, 50); }
    }

    function verify() {
        if (answered || selectedOptIdx === -1) return;
        answered = true;

        const vCont = document.getElementById('q6-verify-container');
        if (vCont) { vCont.style.display = 'none'; vCont.style.opacity = '0'; vCont.style.visibility = 'hidden'; }

        const q = questions[idx];
        const allOpts = document.querySelectorAll('#q6-options .q6-btn');
        allOpts.forEach(function (o) {
            o.style.pointerEvents = 'none';
        });
        if (allOpts[selectedOptIdx]) allOpts[selectedOptIdx].classList.add('selected');
        const fb = document.getElementById('q6-feedback');

        if (selectedOptIdx === q.correct) {
            if (fb) { fb.innerHTML = q.feedback_ok || ''; fb.className = 'q-feedback ok'; }
            score++; playQuiz6Audio('correct');
        } else {
            if (fb) { fb.innerHTML = q.feedback_nok || ''; fb.className = 'q-feedback nok'; }
            playQuiz6Audio('incorrect');
        }
        const btn = document.getElementById('btn-next-q6');
        if (btn) {
            const isLast = idx >= questions.length - 1;
            btn.textContent = isLast ? 'Ver resultado →' : 'Continuar →';
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.className = 'btn-next-q show';
            btn.style.display = 'inline-flex';
            setTimeout(function () {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
            }, 450);
        }
    }

    function next() {
        if (!answered) return;
        idx++;
        if (idx < questions.length) {
            playQuiz6Audio('transition');
            render();
        }
        else { showResult(); }
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    function showResult() {
        playQuiz6Audio('end');
        const m = document.getElementById('q6-bg-music');
        if (m) m.pause();

        const qPanel = document.getElementById('q6-question-panel');
        if (qPanel) qPanel.style.display = 'none';
        const rPanel = document.getElementById('q6-result-panel');
        if (rPanel) {
            rPanel.style.display = 'block';
            rPanel.classList.remove('q-result-anim');
            void rPanel.offsetWidth;
            rPanel.classList.add('q-result-anim');
        }
        const pct = score / questions.length;
        const approved = pct >= 0.60;
        if (rPanel) {
            if (approved) rPanel.classList.add('req-done');
            else rPanel.classList.remove('req-done');
        }

        const pctEl = document.getElementById('q6-pct');
        if (pctEl) {
            pctEl.textContent = Math.round(pct * 100) + '%';
            pctEl.className = 'result-pct ' + (approved ? 'green' : 'red-c');
            if (!approved) {
                pctEl.style.textShadow = '0 0 50px rgba(231,76,60,0.5)';
            } else {
                pctEl.style.textShadow = '0 0 50px rgba(46,204,113,0.5)';
            }
        }

        const starsEl = document.getElementById('q6-stars');
        if (starsEl) {
            starsEl.textContent = pct === 1 ? '⭐⭐⭐' : pct >= 0.60 ? '⭐⭐' : '⭐';
            starsEl.classList.remove('stars-anim');
            void starsEl.offsetWidth;
            starsEl.classList.add('stars-anim');
        }

        const status = document.getElementById('q6-status');
        if (status) {
            status.textContent = approved ? '✅ Aprovado!' : '❌ Quase lá!';
            status.className = 'r-status ' + (approved ? 'ap' : 'ref');
        }

        const sub = document.getElementById('q6-sub');
        if (sub) {
            sub.textContent = `Você acertou ${score} de ${questions.length} questões.` + (approved ? ' Parabéns!' : ' Revise o módulo e tente novamente.');
        }

        const subAdd = document.getElementById('q6-sub-additional');
        if (subAdd) {
            subAdd.textContent = `Você validou ${score} de ${questions.length} operações corretamente.`;
        }

        const btnF = document.getElementById('q6-btn-final');
        if (btnF) {
            btnF.textContent = approved ? 'FINALIZAR TREINAMENTO' : 'REFAZER VALIDAÇÃO';
            btnF.onclick = approved ? () => goTo(currentSlide + 1) : resetQuiz6;
        }
        if (approved) {
            try { playBeep('end'); } catch (e) { }
        }
        updateNextButton();
        try { window.updateQuizAudioHelper(); } catch (e) { }
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('quiz-result'); } catch (e) { }
    }

    function reset() {
        idx = 0; score = 0; answered = false; selectedOptIdx = -1;
        const introPanel = document.getElementById('q6-intro-panel');
        const qPanel = document.getElementById('q6-question-panel');
        const rPanel = document.getElementById('q6-result-panel');

        if (introPanel) introPanel.style.display = 'block';
        if (qPanel) qPanel.style.display = 'none';
        if (rPanel) {
            rPanel.style.display = 'none';
            rPanel.classList.remove('req-done');
        }
        const m = document.getElementById('q6-bg-music');
        if (m) { m.pause(); m.currentTime = 0; }

        // Re-render immediately to clear visual selections
        render();
        if (typeof updateNextButton === 'function') updateNextButton();
        try { window.updateQuizAudioHelper(); } catch (e) { }
    }

    return { start, render, verify, next, reset, selectAnswerPublic: selectAnswer };
}

const quiz6 = createQuiz6Engine(q6_questions);
if (document.getElementById('q6-question-panel')) quiz6.render();
function startQuiz6Intro() { quiz6.start(); }
function verifyAnswer6() { quiz6.verify(); }
function nextQuestion6() { quiz6.next(); }
function resetQuiz6() { quiz6.reset(); }
window.q6Select = function(i, el) {
    if (typeof quiz6 !== 'undefined') quiz6.selectAnswerPublic(i, el);
};



/* === Override Próximo button label/behavior at module end === */
(function () {
    const btnFwd = document.getElementById('btn-fwd');
    if (!btnFwd) return;

    // Normalize button structure: <span class="fwd-label">TEXT</span> + <svg/>
    (function normalize() {
        const svg = btnFwd.querySelector('svg');
        let label = btnFwd.querySelector('.fwd-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'fwd-label';
            label.textContent = 'PRÓXIMO';
            btnFwd.innerHTML = '';
            btnFwd.appendChild(label);
            if (svg) btnFwd.appendChild(svg);
        }
    })();

    const origUpdate = window.updateNextButton;
    window.updateNextButton = function () {
        if (typeof origUpdate === 'function') origUpdate();
        try {
            const activeSlide = document.querySelector('.slide.active');
            if (activeSlide && activeSlide.id === 's44') {
                btnFwd.style.display = 'none';
                return;
            }

            if (activeSlide && activeSlide.id === 's43') {
                btnFwd.style.display = 'flex';
            }

            const total = document.querySelectorAll('.slide').length;
            const label = btnFwd.querySelector('.fwd-label');
            const isLast = currentSlide === total - 1;
            const hasNextModule = window.MODULE_NAV && window.MODULE_NAV.next;

            if (isLast && hasNextModule) {
                // Último slide do módulo: avança para a página seguinte
                btnFwd.style.display = 'flex';
                btnFwd.disabled = !isSlideCompleted(currentSlide);
                if (label) label.textContent = 'PRÓXIMO MÓDULO';
                btnFwd.classList.add('btn-next-module');
            } else {
                // Demais slides: texto padrão
                if (label) label.textContent = 'PRÓXIMO';
                btnFwd.classList.remove('btn-next-module');
            }

            // Cover slide (index, slide 0): hide nav completely - "INICIAR" handles it
            const navEl = document.getElementById('nav');
            if (window.MODULE_NAV && window.MODULE_NAV.id === 'index' && currentSlide === 0) {
                if (navEl) navEl.classList.add('nav-hidden-cover');
            } else {
                if (navEl) navEl.classList.remove('nav-hidden-cover');
            }
        } catch (e) { }
    };
    try { window.updateNextButton(); } catch (e) { }
})();



/* ════════════════════════════════════════
   GLOBAL CLICK SOUND for cards (sem duplicar)
   Toca o som do flip card SOMENTE em cards que
   não tem som próprio. Detecta pelo onclick handler.
   ════════════════════════════════════════ */
(function () {
    const cardSelectors = [
        '.flip-card',
        '.comp-card-modern',
        '.compare-card',
        '.hub-spoke',
        '.icon-card',
        '.check-item',
        '.stat-pill',
        '.risk-card',
        '.sum-item',
        '.rule-card',
        '.rampas-card',
        '.mod5-card',
        '.hud-panel-item',
        '.passo-card',
        '.c-badge',
        '.epi-img-wrapper',
        '.epi-card',
        '.myth-card',
        '.step-item',
        '.reveal-card'
    ];
    const soundPatterns = /playBeep|playHUDBeep|playTechClick|playQuiz6Audio|soundClick|playClick|clickAudio|new Audio/;

    function hasOwnSound(el) {
        if (!el) return false;
        // Walk up the tree checking onclick attributes
        let cur = el;
        while (cur && cur !== document.body) {
            const oc = cur.getAttribute && cur.getAttribute('onclick');
            if (oc && soundPatterns.test(oc)) return true;
            cur = cur.parentElement;
        }
        return false;
    }

    document.addEventListener('click', function (ev) {
        const target = ev.target.closest(cardSelectors.join(','));
        if (!target) return;
        if (hasOwnSound(target)) return;
        try { playBeep('flip'); } catch (e) { }
    }, true);
})();


/* ════════════════════════════════════════
   ACESSIBILIDADE — Ouvir (narração TTS cloud)
   Injetado automaticamente em todas as páginas

   - Endpoint: NR06_TTS.url + Bearer token (mesmo de generate-audios.js)
   - Ouvir: narra o estado atual; clique de novo para parar
   - Com modo ativo, troca de slide/pergunta/card reinicia a narração
   ════════════════════════════════════════ */
(function () {
    if (window.__a11yInjected) return;
    window.__a11yInjected = true;

    /* ── Config TTS cloud (mesmo endpoint/token de generate-audios.js) ──
       Ouvir ao vivo usa a API (voz ElevenLabs). A geração leva alguns segundos. */
    var NR06_TTS = window.NR06_TTS || {
        url: 'https://texttospeech.escolatecnocursos.cloud/api/tts',
        token: 'Bearer eyJzdWIiOiJ0ZWNub2N1cnNvcy10ZXh0dG9zcGVlY2gifQ.w4-wYfGzQXcHMV9Gynkj5JdQc3De7WFIMTskxFYXsII',
        preferCloud: true, /* true = voz da API; false = voz robotizada do navegador */
        cloudFallbackMs: 0, /* 0 = espera a API; não inicia voz do navegador no meio */
        debounceMs: 80
    };
    window.NR06_TTS = NR06_TTS;

    function init() {
        if (document.getElementById('a11y-bar')) return;

        const bar = document.createElement('div');
        bar.id = 'a11y-bar';
        bar.setAttribute('role', 'toolbar');
        bar.setAttribute('aria-label', 'Ferramentas de acessibilidade');
        bar.innerHTML = `
            <button type="button" id="a11y-launcher" aria-expanded="false" aria-controls="a11y-tools" aria-label="Ouvir o conteúdo da página" title="Ouvir">
                <svg class="a11y-speaker-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 9v6h3.5L12 19V5L7.5 9H4z" fill="currentColor"/>
                    <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M17.8 6a7.5 7.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div id="a11y-tools" role="group" aria-label="Opções de acessibilidade">
                <button type="button" class="a11y-btn" id="a11y-btn-ouvir" aria-pressed="false" aria-label="Ouvir o conteúdo do slide">
                    <span class="a11y-ico" aria-hidden="true">🔊</span>
                    <span class="a11y-lbl">Ouvir</span>
                </button>
            </div>
            <div class="audio-helper">Reproduza o áudio em cada nova pergunta.</div>
        `;
        document.body.appendChild(bar);

        function positionA11yBar() {
            const logo = document.getElementById('logo');
            const launcher = document.getElementById('a11y-launcher');
            const demoBtn = document.getElementById('btn-demo');
            const demoInd = document.getElementById('demo-indicator');
            const isMobile = window.matchMedia('(max-width: 768px)').matches;

            if (isMobile) {
                // Mobile: som logo abaixo da logo (canto superior direito)
                if (!logo) {
                    bar.style.top = 'calc(40px + env(safe-area-inset-top, 0px))';
                    bar.style.bottom = 'auto';
                    bar.style.right = '10px';
                    bar.style.left = 'auto';
                } else {
                    const r = logo.getBoundingClientRect();
                    const gap = 6;
                    bar.style.top = Math.round(r.bottom + gap) + 'px';
                    bar.style.bottom = 'auto';
                    bar.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
                    bar.style.left = 'auto';
                }
                if (demoBtn) {
                    demoBtn.style.removeProperty('top');
                    demoBtn.style.removeProperty('right');
                    demoBtn.style.removeProperty('left');
                    demoBtn.style.removeProperty('bottom');
                    demoBtn.style.removeProperty('z-index');
                }
                return;
            }

            if (!logo) return;
            const r = logo.getBoundingClientRect();
            const gap = 10;
            const launcherSize = launcher
                ? parseFloat(getComputedStyle(launcher).width) || 36
                : 36;
            const topPx = Math.max(8, r.top + (r.height - launcherSize) / 2);
            const rightPx = Math.max(8, window.innerWidth - r.left + gap);
            bar.style.top = topPx + 'px';
            bar.style.bottom = 'auto';
            bar.style.right = rightPx + 'px';
            bar.style.left = 'auto';

            if (demoBtn && window.matchMedia('(min-width: 769px)').matches) {
                const demoGap = 10;
                const demoHeight = demoBtn.offsetHeight || 36;
                const demoTop = Math.max(8, r.top + (r.height - demoHeight) / 2);
                demoBtn.style.setProperty('position', 'fixed', 'important');
                demoBtn.style.setProperty('top', demoTop + 'px', 'important');
                demoBtn.style.setProperty('right', (rightPx + launcherSize + demoGap) + 'px', 'important');
                demoBtn.style.setProperty('left', 'auto', 'important');
                demoBtn.style.setProperty('bottom', 'auto', 'important');
                demoBtn.style.setProperty('z-index', '901', 'important');
            } else if (demoBtn) {
                demoBtn.style.removeProperty('top');
                demoBtn.style.removeProperty('right');
                demoBtn.style.removeProperty('left');
                demoBtn.style.removeProperty('bottom');
                demoBtn.style.removeProperty('z-index');
            }

            if (demoInd && window.matchMedia('(min-width: 769px)').matches) {
                const indRight = Math.max(8, window.innerWidth - r.right);
                const indTop = Math.max(4, r.top - 26);
                demoInd.style.setProperty('position', 'fixed', 'important');
                demoInd.style.setProperty('top', indTop + 'px', 'important');
                demoInd.style.setProperty('right', indRight + 'px', 'important');
                demoInd.style.setProperty('left', 'auto', 'important');
                demoInd.style.setProperty('bottom', 'auto', 'important');
            }
        }
        window.positionA11yBar = positionA11yBar;
        positionA11yBar();
        window.addEventListener('resize', positionA11yBar);
        window.addEventListener('load', positionA11yBar);
        const logoEl = document.getElementById('logo');
        if (logoEl) {
            const logoImg = logoEl.querySelector('img');
            if (logoImg) {
                if (logoImg.complete) positionA11yBar();
                else logoImg.addEventListener('load', positionA11yBar);
            }
        }

        const btnOuvir = document.getElementById('a11y-btn-ouvir');
        let currentAudio = null;
        let currentObjectUrl = null;
        let currentAbort = null;
        let usingTTS = false;
        let speakDebounceTimer = null;
        let listeningMode = false; /* após Ouvir, acompanha troca de slide/pergunta/card */
        let lastNarrationFingerprint = '';

        function setListeningUI(on, label) {
            if (btnOuvir) {
                btnOuvir.classList.toggle('is-active', on);
                btnOuvir.setAttribute('aria-pressed', on ? 'true' : 'false');
                var lbl = btnOuvir.querySelector('.a11y-lbl');
                if (lbl) lbl.textContent = on ? (label || 'Lendo...') : 'Ouvir';
            }
            var launcherBtn = document.getElementById('a11y-launcher');
            if (launcherBtn) {
                launcherBtn.classList.toggle('is-speaking', on);
                launcherBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
                launcherBtn.title = on ? (label || 'Parar narração') : 'Ouvir';
            }
        }

        function isSpeakingNow() {
            if (btnOuvir && btnOuvir.classList.contains('is-active')) return true;
            if (currentAudio && !currentAudio.paused) return true;
            if (currentAbort) return true;
            if (usingTTS) return true;
            return false;
        }

        function stopSpeech(opts) {
            opts = opts || {};
            if (speakDebounceTimer) {
                clearTimeout(speakDebounceTimer);
                speakDebounceTimer = null;
            }
            if (currentAbort) {
                try { currentAbort.abort(); } catch (e) { }
                currentAbort = null;
            }
            if (currentAudio) {
                try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) { }
                currentAudio = null;
            }
            if (currentObjectUrl) {
                try { URL.revokeObjectURL(currentObjectUrl); } catch (e) { }
                currentObjectUrl = null;
            }
            if (usingTTS && window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch (e) { }
            }
            usingTTS = false;
            setListeningUI(false);
            if (opts.disableListening) {
                listeningMode = false;
                lastNarrationFingerprint = '';
            }
        }
        var stopSpeak = function () { stopSpeech({ disableListening: true }); };

        /** "Página X de Y" a partir do contador global do curso. */
        function getPageLabel() {
            var n = (typeof nr11GlobalSlide === 'function') ? nr11GlobalSlide() : 1;
            var total = (typeof NR11_TOTAL_SLIDES === 'number') ? NR11_TOTAL_SLIDES : 47;
            return 'Página ' + n + ' de ' + total + '.';
        }

        function cleanSpeakText(s) {
            return (s || '')
                .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, ' ')
                .replace(/[·•●▪►▶←→✓✕✖❌✅🏅📚🔊🎥📑🛡️📋🥽🎯]+/g, ' ')
                .replace(/[–—]+/g, '. ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function isElVisible(el) {
            if (!el) return false;
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
            return el.getClientRects().length > 0;
        }

        function isUiNoiseText(t) {
            t = cleanSpeakText(t);
            if (!t || t.length < 2) return true;
            if (/^(anterior|pr[oó]ximo|pr[oó]ximo m[oó]dulo|iniciar( o treinamento)?|iniciar desafio|confirmar( resposta)?|ouvir|lendo\.\.\.|simula[cç][aã]o|jogar novamente|revisar desafio|continuar|assista at[eé] o final|toque para ver|toque para revelar|ver tutorial)$/i.test(t)) return true;
            if (/^(pr[oó]xim[oa] (cen[aá]rio|a[cç][aã]o|miss[aã]o)|confirmar resposta)/i.test(t)) return true;
            return false;
        }

        function pushText(parts, elOrText) {
            var t = '';
            if (typeof elOrText === 'string') t = cleanSpeakText(elOrText);
            else if (elOrText && isElVisible(elOrText)) t = cleanSpeakText(elOrText.innerText || elOrText.textContent || '');
            if (!t || isUiNoiseText(t)) return;
            if (parts.indexOf(t) !== -1) return;
            parts.push(t);
        }

        function textFromCloneWithoutUi(root) {
            if (!root || !isElVisible(root)) return '';
            var clone = root.cloneNode(true);
            clone.querySelectorAll(
                'button, .nav-btn, .btn-start, .btn-next-q, .btn-verify, .quiz-result-btn, .mg-result-btn, ' +
                '.video-warn, .video-wrap, .wave, script, style, svg, iframe, img, audio, ' +
                '.a11y-bar, #nav, #logo, .q-dots, .mg-decide-actions, .opt-l'
            ).forEach(function (el) { el.remove(); });
            return cleanSpeakText(clone.innerText || clone.textContent || '');
        }

        /** Quiz/desafio: só o painel/estado visível (intro, pergunta atual ou resultado). */
        function getQuizNarration(slide) {
            if (!slide) return '';
            var parts = [];
            var result = slide.querySelector('[id$="-result-panel"]');
            if (result && isElVisible(result)) {
                pushText(parts, result.querySelector('.result-pct, [id$="-pct"]'));
                pushText(parts, result.querySelector('.quiz-result-title, [id$="-status"], .r-status'));
                pushText(parts, result.querySelector('.quiz-result-desc, [id$="-sub"]'));
                return parts.join(' ');
            }
            var intro = slide.querySelector('[id$="-intro-panel"], .quiz-intro-panel');
            if (intro && isElVisible(intro)) {
                pushText(parts, textFromCloneWithoutUi(intro));
                return parts.join(' ');
            }
            var qPanel = slide.querySelector('[id$="-question-panel"]');
            if (qPanel && isElVisible(qPanel)) {
                pushText(parts, qPanel.querySelector('[id$="-counter"]'));
                pushText(parts, qPanel.querySelector('[id$="-text"]'));
                var opts = qPanel.querySelector('[id$="-options"]');
                if (opts && isElVisible(opts)) {
                    Array.prototype.forEach.call(opts.children, function (opt) {
                        if (!isElVisible(opt)) return;
                        var label = cleanSpeakText(opt.innerText || opt.textContent || '');
                        if (label && !isUiNoiseText(label)) parts.push(label);
                    });
                }
                var fb = qPanel.querySelector('[id$="-feedback"], .q-feedback');
                if (fb && isElVisible(fb) && (fb.classList.contains('ok') || fb.classList.contains('nok') || fb.classList.contains('show'))) {
                    pushText(parts, fb);
                }
                return parts.join(' ');
            }
            return '';
        }

        /** Carrossel: só o card ativo + "Card i de n". */
        function getCarouselNarration(slide) {
            if (!slide) return '';
            var root = slide.querySelector('[class*="carousel"], .card-carousel, .carousel');
            if (!root || !isElVisible(root)) return '';
            var cards = root.querySelectorAll(
                '.carousel-card, .carousel-slide, .carousel-item, [data-carousel-item], .card-slide'
            );
            if (!cards.length) return '';
            var active = null;
            var activeIdx = 0;
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                if (c.classList.contains('active') || c.classList.contains('is-active') || c.classList.contains('is-current')) {
                    active = c;
                    activeIdx = i;
                    break;
                }
            }
            if (!active) {
                for (var j = 0; j < cards.length; j++) {
                    if (isElVisible(cards[j])) { active = cards[j]; activeIdx = j; break; }
                }
            }
            if (!active) return '';
            var parts = ['Card ' + (activeIdx + 1) + ' de ' + cards.length + '.'];
            pushText(parts, textFromCloneWithoutUi(active));
            return parts.join(' ');
        }

        /** Atividade Certo/Errado: situação atual. */
        function getDecideNarration(slide) {
            var board = slide.querySelector('.mg-board[data-mg="decide"]');
            if (!board || !isElVisible(board)) return '';
            if (board.querySelector('.mg-result.is-visible')) {
                return textFromCloneWithoutUi(board.querySelector('.mg-result'));
            }
            var parts = [];
            pushText(parts, board.querySelector('.mg-decide-prog'));
            pushText(parts, board.querySelector('.mg-decide-text'));
            pushText(parts, board.querySelector('.mg-hint'));
            pushText(parts, board.querySelector('.mg-status'));
            return parts.join(' ');
        }

        function getS1NarrationBody(slide) {
            var parts = [];
            pushText(parts, slide.querySelector('.s1-tag'));
            pushText(parts, slide.querySelector('h1'));
            pushText(parts, slide.querySelector('.s1-inner > p'));
            return parts.join(' ');
        }

        function getGenericSlideNarration(slide) {
            var parts = [];
            pushText(parts, slide.querySelector('.section-tag'));
            pushText(parts, slide.querySelector('.slide-title'));
            pushText(parts, slide.querySelector('.slide-subtitle'));
            pushText(parts, slide.querySelector('.mod-intro-card'));
            pushText(parts, slide.querySelector('.quiz-intro-card'));

            if (slide.classList.contains('slide-video') || slide.querySelector('.video-wrap')) {
                return parts.join(' ');
            }

            var area = slide.querySelector('.content-area') || slide;
            var boards = area.querySelectorAll('.mg-board, .info-wrap, .sum-grid, .reveal-grid, .compare-container, .flip-grid, .myth-grid, .step-flow, .content-wrap, .m4-check-list');
            if (boards.length) {
                Array.prototype.forEach.call(boards, function (b) {
                    if (!isElVisible(b)) return;
                    var t = textFromCloneWithoutUi(b);
                    if (t && !isUiNoiseText(t)) parts.push(t);
                });
            } else {
                Array.prototype.forEach.call(area.children, function (child) {
                    if (!child.classList) return;
                    if (child.classList.contains('wave') || child.classList.contains('bg-layer') || child.classList.contains('video-wrap')) return;
                    var t = textFromCloneWithoutUi(child);
                    if (t && !isUiNoiseText(t)) parts.push(t);
                });
            }
            return parts.join(' ');
        }

        function getCurrentNarrationText() {
            var slide = document.querySelector('.slide.active');
            if (!slide) return '';
            var parts = [getPageLabel()];
            var body = '';

            if (slide.id === 's1') {
                body = getS1NarrationBody(slide);
            } else {
                body = getQuizNarration(slide);
                if (!body) body = getCarouselNarration(slide);
                if (!body) body = getDecideNarration(slide);
                if (!body) body = getGenericSlideNarration(slide);
            }

            if (body) parts.push(body);
            return cleanSpeakText(parts.join(' '));
        }

        function narrationFingerprint(text) {
            return (text || '').slice(0, 240);
        }

        function pickPtBrVoice() {
            try {
                const voices = window.speechSynthesis.getVoices() || [];
                return voices.find(function (v) { return /pt-BR/i.test(v.lang); })
                    || voices.find(function (v) { return /^pt/i.test(v.lang); })
                    || null;
            } catch (e) {
                return null;
            }
        }

        function speakWithTTS(text) {
            if (!window.speechSynthesis || !text) {
                stopSpeech();
                return;
            }
            usingTTS = true;
            setListeningUI(true);

            function doSpeak() {
                try { window.speechSynthesis.cancel(); } catch (e) { }
                const utt = new SpeechSynthesisUtterance(text);
                utt.lang = 'pt-BR';
                utt.rate = 1.05;
                const voice = pickPtBrVoice();
                if (voice) utt.voice = voice;
                utt.onend = function () { stopSpeech(); };
                utt.onerror = function () { stopSpeech(); };
                window.speechSynthesis.speak(utt);
            }

            /* Não espera vozes carregarem — fala na hora */
            try { window.speechSynthesis.getVoices(); } catch (e) { }
            doSpeak();
        }

        /** Baixa áudio da API cloud (pode demorar vários segundos). */
        async function fetchCloudAudioBlob(text, signal) {
            var res = await fetch(NR06_TTS.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': NR06_TTS.token
                },
                body: JSON.stringify({ text: text }),
                signal: signal
            });
            if (!res.ok) {
                var errBody = await res.text().catch(function () { return ''; });
                throw new Error('HTTP ' + res.status + ' ' + (errBody || '').slice(0, 200));
            }
            var ct = (res.headers.get('content-type') || '').toLowerCase();
            var blob;
            if (ct.indexOf('application/json') !== -1) {
                var j = await res.json();
                var audioUrl = j.audioUrl || j.url || j.audio_url ||
                    (j.data && (j.data.url || j.data.audioUrl));
                if (!audioUrl) throw new Error('JSON sem URL de áudio');
                var r2 = await fetch(audioUrl, { signal: signal });
                if (!r2.ok) throw new Error('HTTP ' + r2.status + ' ao baixar áudio');
                blob = await r2.blob();
            } else {
                blob = await res.blob();
            }
            if (!blob || blob.size < 64) throw new Error('Áudio vazio da API');
            return blob;
        }

        function playCloudBlob(blob, text) {
            currentObjectUrl = URL.createObjectURL(blob);
            currentAudio = new Audio(currentObjectUrl);
            usingTTS = false;
            setListeningUI(true);
            currentAudio.onended = function () { stopSpeech(); };
            currentAudio.onerror = function () {
                console.warn('[TTS] Falha ao reproduzir áudio da API, usando voz do navegador.');
                speakWithTTS(text);
            };
            return currentAudio.play().catch(function (playErr) {
                console.warn('[TTS] play() bloqueado, usando voz do navegador:', playErr && playErr.message ? playErr.message : playErr);
                speakWithTTS(text);
            });
        }

        /**
         * Narração ao vivo via API (voz ElevenLabs).
         * Só usa a voz do navegador se a API falhar de verdade.
         */
        async function speakWithElevenLabs(text) {
            if (!text) {
                stopSpeech();
                return;
            }
            setListeningUI(true, 'Gerando...');

            if (!NR06_TTS.preferCloud) {
                speakWithTTS(text);
                return;
            }

            var ctrl = new AbortController();
            currentAbort = ctrl;
            var usedBrowser = false;
            var fallbackMs = NR06_TTS.cloudFallbackMs != null ? NR06_TTS.cloudFallbackMs : 0;
            var fallbackTimer = null;
            if (fallbackMs > 0) {
                fallbackTimer = setTimeout(function () {
                    if (ctrl.signal.aborted) return;
                    usedBrowser = true;
                    speakWithTTS(text);
                }, fallbackMs);
            }

            try {
                var blob = await fetchCloudAudioBlob(text, ctrl.signal);
                if (fallbackTimer) clearTimeout(fallbackTimer);
                if (ctrl.signal.aborted) return;
                /* Se já caiu no navegador por timeout, não reinicia no meio. */
                if (usedBrowser) return;
                if (usingTTS && window.speechSynthesis) {
                    try { window.speechSynthesis.cancel(); } catch (e) { }
                    usingTTS = false;
                }
                setListeningUI(true, 'Lendo...');
                await playCloudBlob(blob, text);
            } catch (e) {
                if (fallbackTimer) clearTimeout(fallbackTimer);
                if (e && e.name === 'AbortError') return;
                console.warn('[TTS] Falha na API / rede:', e && e.message ? e.message : e);
                if (!usedBrowser) speakWithTTS(text);
            } finally {
                if (currentAbort === ctrl) currentAbort = null;
            }
        }

        async function startSpeakNow(opts) {
            opts = opts || {};
            if (speakDebounceTimer) {
                clearTimeout(speakDebounceTimer);
                speakDebounceTimer = null;
            }
            if (currentAbort) {
                try { currentAbort.abort(); } catch (e) { }
                currentAbort = null;
            }
            if (currentAudio) {
                try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) { }
                currentAudio = null;
            }
            if (currentObjectUrl) {
                try { URL.revokeObjectURL(currentObjectUrl); } catch (e) { }
                currentObjectUrl = null;
            }
            if (usingTTS && window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch (e) { }
            }
            usingTTS = false;

            if (opts.enableListening) listeningMode = true;
            var liveText = '';
            try {
                liveText = getCurrentNarrationText();
            } catch (err) {
                console.warn('[TTS] Erro ao montar texto:', err);
            }
            if (!liveText) {
                console.warn('[TTS] Nenhum texto visível para narrar.');
                setListeningUI(false);
                return;
            }
            lastNarrationFingerprint = narrationFingerprint(liveText);
            setListeningUI(true);
            await speakWithElevenLabs(liveText);
        }

        function startSpeak(opts) {
            opts = opts || {};
            if (opts.enableListening !== false) listeningMode = true;
            var delay = opts.immediate ? 0 : (NR06_TTS.debounceMs || 320);
            if (speakDebounceTimer) clearTimeout(speakDebounceTimer);
            if (delay <= 0) {
                speakDebounceTimer = null;
                startSpeakNow({ enableListening: listeningMode });
                return;
            }
            speakDebounceTimer = setTimeout(function () {
                speakDebounceTimer = null;
                startSpeakNow({ enableListening: listeningMode });
            }, delay);
        }

        function toggleSpeak() {
            if (isSpeakingNow()) {
                stopSpeak();
                return;
            }
            startSpeak({ enableListening: true, immediate: true });
        }

        /** Chamado em goTo / quiz / carrossel — só renarra se o modo Ouvir estiver ativo. */
        function notifyNarrationChange(reason) {
            if (!listeningMode) return;
            var text = '';
            try { text = getCurrentNarrationText(); } catch (e) { return; }
            var fp = narrationFingerprint(text);
            if (fp && fp === lastNarrationFingerprint && reason !== 'force') return;
            startSpeak({ enableListening: true, immediate: false });
        }

        function bindNarrationEvents() {
            window.notifyNarrationChange = notifyNarrationChange;

            /* Carrossel: setas / dots */
            document.addEventListener('click', function (e) {
                var t = e.target;
                if (!t || !t.closest) return;
                if (t.closest('[class*="carousel-nav"], .carousel-prev, .carousel-next, .carousel-dot, [data-carousel-nav]')) {
                    setTimeout(function () { notifyNarrationChange('carousel'); }, 80);
                }
            }, true);

            /* Observa troca de card ativo */
            document.querySelectorAll('[class*="carousel"], .card-carousel').forEach(function (root) {
                try {
                    new MutationObserver(function () {
                        if (listeningMode) notifyNarrationChange('carousel');
                    }).observe(root, { attributes: true, subtree: true, attributeFilter: ['class'] });
                } catch (err) { }
            });
        }

        const launcher = document.getElementById('a11y-launcher');
        function setOpen(open) {
            bar.classList.toggle('open', open);
            if (launcher) launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) window.updateQuizAudioHelper();
        }
        /* Clique no alto-falante = ouvir/parar na hora (não depende de abrir/fechar o painel). */
        if (launcher) {
            launcher.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSpeak();
                setOpen(true);
            });
        }
        document.addEventListener('click', function (e) {
            if (!bar.contains(e.target) && bar.classList.contains('open')) {
                setOpen(false); /* fecha o painel, mas NÃO para a narração */
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && bar.classList.contains('open')) setOpen(false);
        });

        if (btnOuvir) {
            btnOuvir.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSpeak();
            });
        }

        if (window.speechSynthesis) {
            try { window.speechSynthesis.getVoices(); } catch (e) { }
            window.speechSynthesis.onvoiceschanged = function () { };
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stopSpeech();
        });
        window.addEventListener('beforeunload', function () { stopSpeech({ disableListening: true }); });

        if (typeof window.goTo === 'function' && !window.goTo.__a11yHooked) {
            const origGoTo = window.goTo;
            window.goTo = function () {
                stopSpeech();
                const result = origGoTo.apply(this, arguments);
                window.updateQuizAudioHelper();
                if (listeningMode) notifyNarrationChange('slide');
                return result;
            };
            window.goTo.__a11yHooked = true;
        }

        bindNarrationEvents();
        window.getPageLabel = getPageLabel;
        window.getCurrentNarrationText = getCurrentNarrationText;
        window.speakWithElevenLabs = speakWithElevenLabs;
        window.stopSpeech = function () { stopSpeech({ disableListening: true }); };
        window.toggleSpeak = toggleSpeak;

        window.updateQuizAudioHelper();
        ['q1-question-panel', 'q2-question-panel', 'q3-question-panel', 'q4-question-panel'].forEach(function (id) {
            const panel = document.getElementById(id);
            if (panel) {
                new MutationObserver(window.updateQuizAudioHelper).observe(panel, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


/* ════════════════════════════════════════
   MOBILE PERF — lazy load em imagens internas dos slides
   ════════════════════════════════════════ */
(function () {
    function shouldSkipLazy(img) {
        if (img.closest('.s1-hero-img, #logo, #a11y-bar, #nav, #a11y-launcher, .a11y-btn')) return true;
        if (img.closest('#s39')) return true;
        if (img.id === 'modalImg') return true;
        return false;
    }

    function applySlideImageLazyLoading() {
        document.querySelectorAll('.slide img').forEach(function (img) {
            if (shouldSkipLazy(img)) return;
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySlideImageLazyLoading);
    } else {
        applySlideImageLazyLoading();
    }
})();
/* ════════════════════════════════════════
   DEGRADÊ LATERAL — só sobre fundo da slide,
   atrás de conteúdo, logo e botões
   ════════════════════════════════════════ */
(function () {
    function injectSlideRightGradient() {
        // Remove versão antiga fixa no #app (cobria logo/botões)
        document.querySelectorAll('#app > .slide-right-gradient, body > .slide-right-gradient').forEach(function (el) {
            el.remove();
        });

        document.querySelectorAll('.slide').forEach(function (slide) {
            if (slide.querySelector(':scope > .slide-right-gradient')) return;
            var layer = document.createElement('div');
            layer.className = 'slide-right-gradient';
            layer.setAttribute('aria-hidden', 'true');
            slide.insertBefore(layer, slide.firstChild);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSlideRightGradient);
    } else {
        injectSlideRightGradient();
    }
})();
/* ════════════════════════════════════════
   TUTORIAL OBRIGATÓRIO — primeira tela
   ════════════════════════════════════════ */
(function () {
    if (window.__tutorialInjected) return;
    window.__tutorialInjected = true;

    function isIndexPage() {
        return !!(window.MODULE_NAV && window.MODULE_NAV.id === 'index');
    }

    function addReplayButton() {
        if (document.querySelector('.tutorial-replay')) return;
        const startBtn = document.querySelector('#s1 .btn-start');
        if (!startBtn) return;
        const replay = document.createElement('button');
        replay.type = 'button';
        replay.className = 'btn-tutorial tutorial-replay';
        replay.innerHTML = '▶ Ver tutorial';
        replay.onclick = function() {
            const staticModal = document.getElementById('tutorialModal');
            if (staticModal) staticModal.classList.add('active');
        };
        startBtn.insertAdjacentElement('afterend', replay);
    }

    function init() {
        if (!isIndexPage()) return;
        addReplayButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* ════════════════════════════════════════
   NR-06 MINIGAMES — palavras / classificar / combinar
   ════════════════════════════════════════ */
(function () {
    function beep(ok) {
        try { playBeep(ok ? 'ok' : 'nok'); } catch (e) { }
    }

    function setStatus(board, text, cls) {
        var el = board.querySelector('.mg-status');
        if (!el) return;
        el.textContent = text;
        el.className = 'mg-status' + (cls ? ' ' + cls : '');
    }

    function minPassCount(total) {
        return Math.floor(total / 2) + 1;
    }

    function ensureMgResult(board) {
        var wrap = board.querySelector('.mg-result');
        if (wrap) return wrap;
        wrap = document.createElement('div');
        wrap.className = 'mg-result';
        wrap.innerHTML =
            '<div class="mg-result-card">' +
            '  <div class="mg-result-icon" aria-hidden="true">🏅</div>' +
            '  <div class="mg-result-pct">0%</div>' +
            '  <h3 class="mg-result-title">Atividade concluída!</h3>' +
            '  <p class="mg-result-desc"></p>' +
            '  <button type="button" class="mg-result-btn">Refazer atividade</button>' +
            '</div>';
        board.appendChild(wrap);
        return wrap;
    }

    function hideMgResult(board) {
        var wrap = board.querySelector('.mg-result');
        if (wrap) {
            wrap.classList.remove('is-visible', 'is-approved', 'is-failed');
            wrap.style.display = 'none';
        }
        Array.prototype.forEach.call(board.children, function (child) {
            if (child.classList && child.classList.contains('mg-result')) return;
            child.style.display = '';
        });
    }

    function showMgResult(board, opts) {
        opts = opts || {};
        var score = opts.score || 0;
        var total = opts.total || 1;
        var wrongs = opts.wrongs != null ? opts.wrongs : Math.max(0, total - score);
        var attempts = opts.attempts != null ? opts.attempts : (score + wrongs);
        var denom = attempts > 0 ? attempts : total;
        var pct = Math.round((score / denom) * 100);
        var need = minPassCount(denom);
        var approved = score >= need;
        var wrap = ensureMgResult(board);
        var pctEl = wrap.querySelector('.mg-result-pct');
        var titleEl = wrap.querySelector('.mg-result-title');
        var descEl = wrap.querySelector('.mg-result-desc');
        var iconEl = wrap.querySelector('.mg-result-icon');
        var btn = wrap.querySelector('.mg-result-btn');

        Array.prototype.forEach.call(board.children, function (child) {
            if (child.classList && (child.classList.contains('mg-result') || child.classList.contains('mg-status'))) return;
            child.style.display = 'none';
        });

        wrap.style.display = 'flex';
        wrap.classList.add('is-visible');
        wrap.classList.toggle('is-approved', approved);
        wrap.classList.toggle('is-failed', !approved);

        if (pctEl) {
            pctEl.textContent = pct + '%';
            pctEl.className = 'mg-result-pct ' + (approved ? 'ok' : 'bad');
        }
        if (iconEl) iconEl.textContent = approved ? '🏅' : '📚';
        if (titleEl) titleEl.textContent = approved ? 'Atividade concluída!' : 'Atividade não concluída';
        if (descEl) {
            if (approved) {
                descEl.textContent = 'Você acertou ' + score + ' de ' + denom + ' (' + pct + '%). Pode avançar.';
            } else {
                descEl.textContent = 'Você acertou ' + score + ' de ' + denom + ' (' + pct + '%). É preciso acertar mais da metade (' + need + '). Refaça a atividade.';
            }
        }
        if (btn) {
            btn.style.display = approved ? 'none' : '';
            btn.textContent = 'Refazer atividade';
            btn.onclick = function () {
                if (typeof opts.onRetry === 'function') opts.onRetry();
            };
        }

        if (approved) {
            if (!board.classList.contains('req-done')) {
                board.classList.add('req-done');
                beep(true);
            }
            setStatus(board, '✓ ' + pct + '% de acertos — pode avançar.', 'ok');
        } else {
            board.classList.remove('req-done');
            beep(false);
            setStatus(board, '✗ ' + pct + '% de acertos — refaça a atividade.', 'bad');
        }
        try { updateNextButton(); } catch (e) { }
        return approved;
    }

    function completeBoard(board) {
        if (!board.classList.contains('req-done')) {
            board.classList.add('req-done');
            beep(true);
            try { updateNextButton(); } catch (e) { }
        }
        setStatus(board, '✓ Atividade concluída! Pode avançar.', 'ok');
    }

    window.mgToggleWord = function (btn) {
        var board = btn.closest('.mg-board');
        if (!board || board.classList.contains('req-done')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        btn.classList.toggle('is-on');
        btn.classList.remove('is-correct', 'is-wrong');
        setStatus(board, 'Selecione as opções corretas e toque em Conferir.', '');
    };

    window.mgCheckWords = function (boardId) {
        var board = document.getElementById(boardId);
        if (!board || board.classList.contains('req-done')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        var chips = board.querySelectorAll('.mg-chip[data-ok]');
        var score = 0;
        var total = chips.length;
        chips.forEach(function (chip) {
            var should = chip.getAttribute('data-ok') === '1';
            var selected = chip.classList.contains('is-on');
            chip.classList.remove('is-correct', 'is-wrong');
            var right = (should && selected) || (!should && !selected);
            if (right) {
                score++;
                if (should && selected) chip.classList.add('is-correct');
            } else {
                if (!should && selected) chip.classList.add('is-wrong');
            }
        });
        setTimeout(function () {
            showMgResult(board, {
                score: score,
                total: total,
                attempts: total,
                onRetry: function () { window.mgResetWords(boardId); }
            });
        }, 450);
    };

    window.mgResetWords = function (boardId) {
        var board = document.getElementById(boardId);
        if (!board) return;
        board.classList.remove('req-done');
        hideMgResult(board);
        board.querySelectorAll('.mg-chip').forEach(function (chip) {
            chip.classList.remove('is-on', 'is-correct', 'is-wrong');
            chip.disabled = false;
            chip.style.opacity = '';
        });
        setStatus(board, 'Selecione as opções corretas e toque em Conferir.', '');
        try { updateNextButton(); } catch (e) { }
    };

    var sortPicked = null;
    var sortScore = {};

    function resetSortScore(boardId) {
        sortScore[boardId] = { hits: 0, misses: 0 };
    }

    window.mgPickSort = function (btn) {
        var board = btn.closest('.mg-board');
        if (!board || board.classList.contains('req-done')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        if (btn.parentElement && btn.parentElement.classList.contains('mg-bin-drop')) return;
        board.querySelectorAll('.mg-chip.is-picked').forEach(function (c) { c.classList.remove('is-picked'); });
        board.querySelectorAll('.mg-bin.is-target').forEach(function (b) { b.classList.remove('is-target'); });
        sortPicked = btn;
        btn.classList.add('is-picked');
        board.querySelectorAll('.mg-bin').forEach(function (b) { b.classList.add('is-target'); });
        setStatus(board, 'Agora toque no destino correto.', '');
    };

    window.mgDropSort = function (binEl) {
        var board = binEl.closest('.mg-board');
        if (!board || board.classList.contains('req-done') || !sortPicked) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        var boardId = board.id;
        if (!sortScore[boardId]) resetSortScore(boardId);
        var binKey = binEl.getAttribute('data-bin');
        var chip = sortPicked;
        sortPicked = null;
        board.querySelectorAll('.mg-chip.is-picked').forEach(function (c) { c.classList.remove('is-picked'); });
        board.querySelectorAll('.mg-bin.is-target').forEach(function (b) { b.classList.remove('is-target'); });

        if (chip.getAttribute('data-bin') !== binKey) {
            sortScore[boardId].misses++;
            beep(false);
            chip.classList.add('is-wrong');
            setTimeout(function () { chip.classList.remove('is-wrong'); }, 400);
            setStatus(board, 'Destino incorreto (' + sortScore[boardId].hits + ' acertos / ' + sortScore[boardId].misses + ' erros). Tente outra combinação.', 'bad');
            return;
        }

        sortScore[boardId].hits++;
        var drop = binEl.querySelector('.mg-bin-drop');
        chip.classList.add('is-correct');
        chip.classList.remove('is-picked');
        chip.onclick = null;
        drop.appendChild(chip);
        beep(true);

        var left = board.querySelectorAll('.mg-pool .mg-chip').length;
        if (left === 0) {
            showMgResult(board, {
                score: sortScore[boardId].hits,
                wrongs: sortScore[boardId].misses,
                attempts: sortScore[boardId].hits + sortScore[boardId].misses,
                onRetry: function () { window.mgResetSort(boardId); }
            });
        } else {
            setStatus(board, 'Boa! Continue (' + sortScore[boardId].hits + ' acertos / ' + sortScore[boardId].misses + ' erros).', 'ok');
        }
    };

    window.mgResetSort = function (boardId) {
        var board = document.getElementById(boardId);
        if (!board) return;
        board.classList.remove('req-done');
        hideMgResult(board);
        resetSortScore(boardId);
        sortPicked = null;
        var pool = board.querySelector('.mg-pool');
        board.querySelectorAll('.mg-bin-drop .mg-chip').forEach(function (chip) {
            chip.classList.remove('is-correct', 'is-wrong', 'is-picked');
            chip.setAttribute('onclick', 'mgPickSort(this)');
            if (pool) pool.appendChild(chip);
        });
        board.querySelectorAll('.mg-bin.is-target').forEach(function (b) { b.classList.remove('is-target'); });
        setStatus(board, 'Classifique cada item no destino correto.', '');
        try { updateNextButton(); } catch (e) { }
    };

    var matchPicked = null;
    var matchScore = {};

    function resetMatchScore(boardId) {
        matchScore[boardId] = { hits: 0, misses: 0 };
    }

    window.mgPickMatch = function (btn) {
        var board = btn.closest('.mg-board');
        if (!board || board.classList.contains('req-done') || btn.classList.contains('is-locked')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        var boardId = board.id;
        if (!matchScore[boardId]) resetMatchScore(boardId);
        var side = btn.getAttribute('data-side');
        var key = btn.getAttribute('data-key');

        if (!matchPicked) {
            board.querySelectorAll('.mg-match-item.is-picked').forEach(function (c) { c.classList.remove('is-picked'); });
            matchPicked = btn;
            btn.classList.add('is-picked');
            setStatus(board, 'Agora toque no par correspondente.', '');
            return;
        }

        if (matchPicked === btn) {
            btn.classList.remove('is-picked');
            matchPicked = null;
            return;
        }

        var other = matchPicked;
        matchPicked = null;
        board.querySelectorAll('.mg-match-item.is-picked').forEach(function (c) { c.classList.remove('is-picked'); });

        if (other.getAttribute('data-side') === side) {
            btn.classList.add('is-picked');
            matchPicked = btn;
            setStatus(board, 'Escolha um item da outra coluna.', '');
            return;
        }

        if (other.getAttribute('data-key') === key) {
            matchScore[boardId].hits++;
            other.classList.add('is-locked');
            btn.classList.add('is-locked');
            other.classList.remove('is-picked');
            btn.classList.remove('is-picked');
            beep(true);
            var pending = board.querySelectorAll('.mg-match-item:not(.is-locked)').length;
            if (pending === 0) {
                showMgResult(board, {
                    score: matchScore[boardId].hits,
                    wrongs: matchScore[boardId].misses,
                    attempts: matchScore[boardId].hits + matchScore[boardId].misses,
                    onRetry: function () { window.mgResetMatch(boardId); }
                });
            } else {
                setStatus(board, 'Par correto! Continue (' + matchScore[boardId].hits + ' acertos / ' + matchScore[boardId].misses + ' erros).', 'ok');
            }
        } else {
            matchScore[boardId].misses++;
            beep(false);
            other.classList.add('is-wrong');
            btn.classList.add('is-wrong');
            setTimeout(function () {
                other.classList.remove('is-wrong');
                btn.classList.remove('is-wrong');
            }, 400);
            setStatus(board, 'Esse não é o par (' + matchScore[boardId].hits + ' acertos / ' + matchScore[boardId].misses + ' erros). Tente de novo.', 'bad');
        }
    };

    window.mgResetMatch = function (boardId) {
        var board = document.getElementById(boardId);
        if (!board) return;
        board.classList.remove('req-done');
        hideMgResult(board);
        resetMatchScore(boardId);
        matchPicked = null;
        board.querySelectorAll('.mg-match-item').forEach(function (item) {
            item.classList.remove('is-locked', 'is-picked', 'is-wrong');
        });
        setStatus(board, 'Toque em um item de cada coluna para formar o par.', '');
        try { updateNextButton(); } catch (e) { }
    };

    /* ── Decisão Certo/Errado (estilo NR-11) ── */
    var decideState = {};

    window.MG_DECIDE = {
        'mg-m1-g01': [
            { q: 'A alta administração lidera a prevenção de acidentes e doenças ocupacionais.', ans: true },
            { q: 'Ignorar normas e usar atalhos perigosos reforça a cultura de segurança.', ans: false },
            { q: 'Conformidade com a legislação vigente é parte da cultura de prevenção.', ans: true },
            { q: 'Improviso no trabalho é aceitável quando a meta está atrasada.', ans: false },
            { q: 'Saúde e segurança ocupacional são responsabilidade compartilhada do time.', ans: true }
        ],
        'mg-m4-g14': [
            { q: 'O melhor EPI do mundo é a prevenção.', ans: true },
            { q: 'Usar EPI só quando for conveniente já garante a segurança.', ans: false },
            { q: 'Escolher o EPI certo para cada missão reduz acidentes.', ans: true },
            { q: 'Cultura de segurança depende só do SESMT, sem o time da loja.', ans: false },
            { q: 'Cada colaborador fortalece a prevenção no dia a dia.', ans: true }
        ]
    };

    function ensureDecideContinueBtn(board) {
        var card = board.querySelector('.mg-decide-card');
        if (!card) return null;
        var wrap = card.querySelector('.mg-decide-continue');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'mg-decide-continue';
            wrap.style.display = 'none';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-next-q show mg-decide-continue-btn';
            btn.textContent = 'Continuar →';
            btn.setAttribute('onclick', 'mgDecideContinue(this)');
            wrap.appendChild(btn);
            card.appendChild(wrap);
        }
        return wrap;
    }

    function hideDecideContinue(board) {
        var wrap = board.querySelector('.mg-decide-continue');
        if (!wrap) return;
        wrap.style.display = 'none';
    }

    function showDecideContinue(board, isLast) {
        var wrap = ensureDecideContinueBtn(board);
        if (!wrap) return;
        var btn = wrap.querySelector('button');
        if (btn) {
            btn.textContent = isLast ? 'Ver resultado →' : 'Continuar →';
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.className = 'btn-next-q show mg-decide-continue-btn';
            btn.style.display = 'inline-flex';
            setTimeout(function () {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
            }, 450);
        }
        wrap.style.display = 'flex';
        wrap.style.justifyContent = 'center';
        wrap.style.marginTop = '12px';
    }

    function ensureDecideVerifyBtn(board) {
        var card = board.querySelector('.mg-decide-card');
        if (!card) return null;
        var wrap = card.querySelector('.mg-decide-verify');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'mg-decide-verify';
            wrap.style.display = 'none';
            wrap.style.opacity = '0';
            wrap.style.visibility = 'hidden';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-tf-verify mg-decide-confirm-btn';
            btn.textContent = '✔ Confirmar Resposta';
            btn.setAttribute('onclick', 'mgDecideConfirm(this)');
            wrap.appendChild(btn);
            card.appendChild(wrap);
        }
        return wrap;
    }

    function hideDecideVerify(board) {
        var wrap = board.querySelector('.mg-decide-verify');
        if (!wrap) return;
        wrap.style.display = 'none';
        wrap.style.opacity = '0';
        wrap.style.visibility = 'hidden';
    }

    function showDecideVerify(board) {
        var wrap = ensureDecideVerifyBtn(board);
        if (!wrap) return;
        wrap.style.display = 'flex';
        setTimeout(function () {
            wrap.style.opacity = '1';
            wrap.style.visibility = 'visible';
        }, 40);
    }

    function decideRender(boardId) {
        var board = document.getElementById(boardId);
        var list = window.MG_DECIDE[boardId];
        if (!board || !list) return;
        var st = decideState[boardId] || (decideState[boardId] = { idx: 0, pending: null, locking: false, score: 0 });
        st.pending = null;
        st.locking = false;
        hideMgResult(board);
        hideDecideContinue(board);
        if (st.idx >= list.length) {
            showMgResult(board, {
                score: st.score || 0,
                total: list.length,
                attempts: list.length,
                onRetry: function () { window.mgDecideStart(boardId); }
            });
            try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('decide-result'); } catch (e) { }
            return;
        }
        var item = list[st.idx];
        var prog = board.querySelector('.mg-decide-prog');
        var text = board.querySelector('.mg-decide-text');
        var actions = board.querySelector('.mg-decide-actions');
        if (prog) prog.textContent = 'Situação ' + (st.idx + 1) + ' de ' + list.length;
        if (text) text.textContent = item.q;
        if (actions) {
            actions.querySelectorAll('button').forEach(function (b) {
                b.disabled = false;
                b.classList.remove('is-correct', 'is-wrong', 'is-selected');
            });
        }
        ensureDecideVerifyBtn(board);
        hideDecideVerify(board);
        setStatus(board, st.idx > 0
            ? ('Toque em CERTO ou ERRADO e confirme. Acertos: ' + (st.score || 0) + '/' + st.idx)
            : 'Toque em CERTO ou ERRADO e confirme.', '');
        try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('decide'); } catch (e) { }
    }

    window.mgDecideStart = function (boardId) {
        decideState[boardId] = { idx: 0, pending: null, locking: false, score: 0 };
        var board = document.getElementById(boardId);
        if (board) board.classList.remove('req-done');
        decideRender(boardId);
        try { updateNextButton(); } catch (e) { }
    };

    /* 1º toque: só seleciona. A correção só acontece no Confirmar. */
    window.mgDecide = function (btn, choice) {
        var board = btn.closest('.mg-board');
        if (!board || board.classList.contains('req-done')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        var boardId = board.id;
        var list = window.MG_DECIDE[boardId];
        var st = decideState[boardId] || (decideState[boardId] = { idx: 0, pending: null, locking: false, score: 0 });
        if (!list || st.idx >= list.length || st.locking) return;

        var actions = board.querySelector('.mg-decide-actions');
        if (actions) {
            actions.querySelectorAll('button').forEach(function (b) {
                b.classList.remove('is-selected', 'is-correct', 'is-wrong');
            });
        }
        btn.classList.add('is-selected');
        st.pending = choice === true || choice === 'true' || choice === 1;
        try { playBeep('click'); } catch (e) { }
        hideDecideContinue(board);
        showDecideVerify(board);
        setStatus(board, 'Confirme sua resposta para continuar.', '');
    };

    window.mgDecideConfirm = function (btn) {
        var board = btn.closest('.mg-board');
        if (!board || board.classList.contains('req-done')) return;
        if (board.querySelector('.mg-result.is-visible')) return;
        var boardId = board.id;
        var list = window.MG_DECIDE[boardId];
        var st = decideState[boardId] || (decideState[boardId] = { idx: 0, pending: null, locking: false, score: 0 });
        if (!list || st.idx >= list.length || st.pending === null || st.locking) return;

        st.locking = true;
        hideDecideVerify(board);
        var item = list[st.idx];
        var actions = board.querySelector('.mg-decide-actions');
        var selected = actions ? actions.querySelector('.mg-decide-btn.is-selected') : null;
        if (actions) actions.querySelectorAll('button').forEach(function (b) { b.disabled = true; });

        var correct = st.pending === item.ans;
        if (correct) {
            st.score = (st.score || 0) + 1;
            if (selected) {
                selected.classList.remove('is-selected');
                selected.classList.add('is-correct');
            }
            beep(true);
            setStatus(board, '✓ Correto! Clique em Continuar. (' + st.score + '/' + (st.idx + 1) + ')', 'ok');
        } else {
            if (selected) {
                selected.classList.remove('is-selected');
                selected.classList.add('is-wrong');
            }
            beep(false);
            setStatus(board, '✗ Errado. Clique em Continuar. (' + st.score + '/' + (st.idx + 1) + ')', 'bad');
        }

        showDecideContinue(board, st.idx >= list.length - 1);
    };

    window.mgDecideContinue = function (btn) {
        var board = btn.closest('.mg-board');
        if (!board) return;
        var boardId = board.id;
        var st = decideState[boardId];
        if (!st || !st.locking) return;
        st.idx++;
        st.pending = null;
        st.locking = false;
        hideDecideContinue(board);
        decideRender(boardId);
    };

    document.querySelectorAll('.mg-board[data-mg="decide"]').forEach(function (board) {
        decideState[board.id] = { idx: 0, pending: null, locking: false, score: 0 };
        decideRender(board.id);
    });

    document.querySelectorAll('.mg-board .mg-pool').forEach(function (pool) {
        var board = pool.closest('.mg-board');
        if (board) resetSortScore(board.id);
    });
    document.querySelectorAll('.mg-board .mg-match-grid').forEach(function (grid) {
        var board = grid.closest('.mg-board');
        if (board) resetMatchScore(board.id);
    });
})();

/* Carrossel de conteúdo + placeholders de foto */
(function () {
    function fillPhotoSlot(slot) {
        if (!slot) return;
        var img = slot.querySelector('.photo-slot-img');
        if (!img) return;
        var src = (img.getAttribute('data-src') || '').trim();
        var expandBtn = slot.querySelector('.img-expand-btn, .pic-car-expand');

        if (!src) {
            img.hidden = true;
            img.removeAttribute('src');
            slot.classList.remove('has-image');
            if (expandBtn) {
                expandBtn.hidden = true;
                expandBtn.onclick = null;
            }
            return;
        }

        img.src = src;
        img.hidden = false;
        slot.classList.add('has-image');

        if (!expandBtn) {
            expandBtn = document.createElement('button');
            expandBtn.type = 'button';
            expandBtn.className = 'img-expand-btn';
            expandBtn.setAttribute('aria-label', 'Ampliar imagem');
            expandBtn.title = 'Ampliar imagem';
            expandBtn.textContent = '🔍';
            slot.appendChild(expandBtn);
        }
        expandBtn.hidden = false;
        expandBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof openImageModal === 'function') openImageModal(src);
        };
    }

    function showCard(root, index) {
        var cards = root.querySelectorAll('.cc-card');
        if (!cards.length) return;
        var i = ((index % cards.length) + cards.length) % cards.length;
        cards.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
        root._ccIndex = i;
        root._ccSeen = root._ccSeen || {};
        root._ccSeen[i] = true;
        var cur = root.querySelector('.cc-cur');
        var total = root.querySelector('.cc-total');
        if (cur) cur.textContent = String(i + 1);
        if (total) total.textContent = String(cards.length);
        var seen = Object.keys(root._ccSeen).length;
        if (seen >= cards.length) {
            root.classList.add('req-item', 'req-done');
            try { updateNextButton(); } catch (e) { }
        }
    }

    function initCarousel(root) {
        if (!root || root._ccReady) return;
        root._ccReady = true;
        root.classList.add('req-item');
        root._ccIndex = 0;
        root._ccSeen = { 0: true };
        var prev = root.querySelector('.cc-prev');
        var next = root.querySelector('.cc-next');
        if (prev) prev.addEventListener('click', function () { showCard(root, (root._ccIndex || 0) - 1); });
        if (next) next.addEventListener('click', function () { showCard(root, (root._ccIndex || 0) + 1); });
        showCard(root, 0);
    }

    function initAll() {
        document.querySelectorAll('.photo-slot').forEach(fillPhotoSlot);
        document.querySelectorAll('[data-content-carousel]').forEach(initCarousel);
        try { updateNextButton(); } catch (e) { }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();
})();

/* Step carousel — estilo NR-11 p.26 (PASSO + número) */
(function () {
    function parseCards(root) {
        var dataEl = root.querySelector('.step-car-data');
        if (!dataEl) return [];
        try {
            var data = JSON.parse(dataEl.textContent || '[]');
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function initStepCarousel(root) {
        if (!root || root._stepCarReady) return;
        var cards = parseCards(root);
        if (!cards.length) return;
        root._stepCarReady = true;

        var labelText = (root.getAttribute('data-label') || 'PASSO').toUpperCase();
        var idx = 0;
        var viewed = { 0: true };

        var labelEl = root.querySelector('.step-car-label');
        var numEl = root.querySelector('.step-car-num');
        var titleEl = root.querySelector('.step-car-title');
        var descEl = root.querySelector('.step-car-desc');
        var counterEl = root.querySelector('.step-car-counter');
        var progressEl = root.querySelector('.step-car-progress');
        var trackerEl = root.querySelector('.step-car-tracker');
        var prevBtn = root.querySelector('.step-car-prev');
        var nextBtn = root.querySelector('.step-car-next');
        var cardEl = root.querySelector('.step-car-card');

        if (labelEl) labelEl.textContent = labelText;

        if (progressEl) {
            progressEl.innerHTML = '';
            cards.forEach(function (_, i) {
                var dot = document.createElement('span');
                dot.className = 'step-car-dot' + (i === 0 ? ' is-active' : '');
                progressEl.appendChild(dot);
            });
        }

        function updateDots() {
            if (!progressEl) return;
            progressEl.querySelectorAll('.step-car-dot').forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === idx);
                dot.classList.toggle('is-done', !!viewed[i] && i !== idx);
            });
        }

        function markDone() {
            viewed[idx] = true;
            var seen = Object.keys(viewed).length;
            if (seen >= cards.length && trackerEl && !trackerEl.classList.contains('req-done')) {
                trackerEl.classList.add('req-item', 'req-done');
                try { if (typeof playBeep === 'function') playBeep('flip'); } catch (e) { }
                try { if (typeof updateNextButton === 'function') updateNextButton(); } catch (e) { }
            }
        }

        function render() {
            var c = cards[idx] || {};
            if (labelEl) labelEl.textContent = String(c.label || labelText).toUpperCase();
            if (numEl) {
                if (c.icon) {
                    numEl.textContent = c.icon;
                    numEl.classList.add('has-icon');
                } else {
                    numEl.textContent = String(c.step != null ? c.step : (idx + 1));
                    numEl.classList.remove('has-icon');
                }
            }
            if (titleEl) titleEl.textContent = c.title || '';
            if (descEl) descEl.textContent = c.desc || '';
            if (counterEl) counterEl.textContent = (idx + 1) + '/' + cards.length;
            if (cardEl) {
                cardEl.classList.add('is-active');
                cardEl.classList.remove('is-myth', 'is-truth');
                if (c.tone === 'myth') cardEl.classList.add('is-myth');
                if (c.tone === 'truth') cardEl.classList.add('is-truth');
            }
            updateDots();
            markDone();
            if (prevBtn) prevBtn.disabled = idx === 0;
            if (nextBtn) nextBtn.disabled = idx >= cards.length - 1;
        }

        function go(dir) {
            var next = idx + dir;
            if (next < 0 || next >= cards.length) return;
            idx = next;
            try { if (typeof playBeep === 'function') playBeep('click'); } catch (e) { }
            render();
            try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('carousel'); } catch (e) { }
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });

        if (trackerEl) trackerEl.classList.add('req-item');
        render();
    }

    function initAll() {
        document.querySelectorAll('[data-step-carousel]').forEach(initStepCarousel);
        try { updateNextButton(); } catch (e) { }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();
})();

/* Photo carousel — estilo NR-11 s10 (foto + ícone + título + nav) */
(function () {
    function parseCards(root) {
        var dataEl = root.querySelector('.pic-car-data');
        if (!dataEl) return [];
        try {
            var data = JSON.parse(dataEl.textContent || '[]');
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function initPicCarousel(root) {
        if (!root || root._picCarReady) return;
        var cards = parseCards(root);
        if (!cards.length) return;
        root._picCarReady = true;

        var idx = 0;
        var viewed = { 0: true };

        var cardEl = root.querySelector('.pic-car-card');
        var photoEl = root.querySelector('.pic-car-photo');
        var expandBtn = root.querySelector('.pic-car-expand');
        var iconEl = root.querySelector('.pic-car-icon');
        var titleEl = root.querySelector('.pic-car-title');
        var descEl = root.querySelector('.pic-car-desc');
        var statusEl = root.querySelector('.pic-car-status');
        var counterEl = root.querySelector('.pic-car-counter');
        var progressEl = root.querySelector('.pic-car-progress');
        var trackerEl = root.querySelector('.pic-car-tracker');
        var prevBtn = root.querySelector('.pic-car-prev');
        var nextBtn = root.querySelector('.pic-car-next');

        if (progressEl) {
            progressEl.innerHTML = '';
            cards.forEach(function (_, i) {
                var dot = document.createElement('span');
                dot.className = 'pic-car-dot' + (i === 0 ? ' is-active' : '');
                progressEl.appendChild(dot);
            });
        }

        function updateDots() {
            if (!progressEl) return;
            progressEl.querySelectorAll('.pic-car-dot').forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === idx);
                dot.classList.toggle('is-done', !!viewed[i] && i !== idx);
            });
        }

        function markDone() {
            viewed[idx] = true;
            updateDots();
            if (Object.keys(viewed).length >= cards.length && trackerEl && !trackerEl.classList.contains('req-done')) {
                trackerEl.classList.add('req-done');
                try { if (typeof playBeep === 'function') playBeep('click'); } catch (e) { }
                try { updateNextButton(); } catch (e) { }
            }
        }

        function render() {
            var c = cards[idx] || {};
            if (iconEl) iconEl.textContent = c.icon || '';
            if (titleEl) titleEl.textContent = c.title || '';
            if (descEl) descEl.textContent = c.desc || '';
            if (statusEl) {
                var st = (c.status || '').trim();
                statusEl.textContent = st;
                statusEl.style.display = st ? '' : 'none';
            }
            if (counterEl) counterEl.textContent = (idx + 1) + '/' + cards.length;
            if (cardEl) cardEl.classList.add('is-active');

            if (photoEl) {
                var existing = photoEl.querySelector('img');
                if (existing) existing.remove();
                var photo = (c.photo || '').trim();
                if (photo) {
                    photoEl.classList.add('has-image');
                    var img = document.createElement('img');
                    img.src = photo;
                    img.alt = c.title || '';
                    img.referrerPolicy = 'no-referrer';
                    photoEl.insertBefore(img, expandBtn || null);
                    if (expandBtn) {
                        expandBtn.classList.add('img-expand-btn');
                        expandBtn.onclick = function (e) {
                            e.stopPropagation();
                            if (typeof openImageModal === 'function') openImageModal(photo);
                        };
                    }
                } else {
                    photoEl.classList.remove('has-image');
                    if (expandBtn) expandBtn.onclick = null;
                }
            }

            markDone();
            if (prevBtn) prevBtn.disabled = idx === 0;
            if (nextBtn) nextBtn.disabled = idx >= cards.length - 1;
        }

        function go(dir) {
            var next = idx + dir;
            if (next < 0 || next >= cards.length) return;
            idx = next;
            try { if (typeof playBeep === 'function') playBeep('click'); } catch (e) { }
            render();
            try { if (typeof window.notifyNarrationChange === 'function') window.notifyNarrationChange('carousel'); } catch (e) { }
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });

        if (trackerEl) trackerEl.classList.add('req-item');
        render();
    }

    function initAll() {
        document.querySelectorAll('[data-pic-carousel]').forEach(initPicCarousel);
        try { updateNextButton(); } catch (e) { }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();
})();
