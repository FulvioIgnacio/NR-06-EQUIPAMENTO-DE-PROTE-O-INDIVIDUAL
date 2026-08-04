/* ============================================================
   AUDIO DATA — Mapa de slides e textos para narração
   ------------------------------------------------------------
   Este arquivo é a ÚNICA fonte de verdade que descreve:
     (1) ordem dos slides em cada HTML (precisa bater com NR11_MODULE_OFFSETS de shared.js)
     (2) quais slides têm múltiplos estados (quiz, micro-quiz)
     (3) o que deve ser narrado em cada estado de um slide multi-estado

   Usado por:
     - generate-audios.js  (Node, gera os MP3 batendo na API de TTS)
     - shared.js           (browser, escolhe qual MP3 tocar a cada clique em "Ouvir")

   NR 06 — Equipamento de Proteção Individual (Leroy Merlin)
   ============================================================ */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.AUDIO_DATA = factory();
}(typeof self !== 'undefined' ? self : this, function () {

    /* Ordem dos slides em cada HTML — DEVE bater com NR11_MODULE_OFFSETS.
       Soma das slides = NR11_TOTAL_SLIDES (39).                             */
    const SLIDE_ORDER = {
        'index.html': ['s1', 's-sumario'],
        'modulo-1.html': ['s-m1-intro', 's-v01', 's-m1-g01', 's-m1-i01', 's-v02', 's-m1-g02', 's-v03', 's-m1-g03', 's-m1-i02', 's-m1-quiz'],
        'modulo-2.html': ['s-m2-intro', 's-v04', 's-m2-g04', 's-m2-i03', 's-v05', 's-m2-g05', 's-v06', 's-m2-g06', 's-m2-i04', 's-m2-quiz'],
        'modulo-3.html': ['s-m3-intro', 's-v07', 's-m3-g07', 's-m3-i05', 's-v08', 's-m3-g08', 's-v09', 's-m3-g09', 's-v10', 's-m3-g10', 's-m3-i06', 's-m3-game'],
        'modulo-4.html': ['s-m4-intro', 's-v11', 's-m4-g11', 's-m4-i07', 's-v12', 's-m4-g12', 's-v13', 's-m4-g13', 's-m4-i08', 's-v14', 's-m4-g14', 's-m4-quiz', 's44']
    };

    /* MULTI_STATE: slides com múltiplos conteúdos exibidos em sequência.
       O player troca de áudio conforme o estado visível na tela.

       Campos:
         panels: { intro:'#id', question:'#id', result:'#id' }  -> usado para detectar estado no DOM
         counterSelector:  seletor para ler "Pergunta X de N" e descobrir índice
         intro / result:   texto narrado para esses estados
         questions[]:      texto narrado para cada pergunta (i+1 = Q1, Q2 …)                */
    const MULTI_STATE = {
        // ─── MITO × VERDADE (modulo-1.html, s-m1-g01) — página 5 ─────────────────────
        's-m1-g01': {
            panels: { question: '#mito-question-panel' },
            counterSelector: '#mito-counter',
            questions: [
                'Afirmação 1 de 4. Segurança é assunto do time de SSO, não meu. Verdade ou mito?',
                'Afirmação 2 de 4. A empresa é obrigada a fornecer o EPI de graça. Verdade ou mito?',
                'Afirmação 3 de 4. Tenho experiência, faço rápido e sem o EPI dá certo. Verdade ou mito?',
                'Afirmação 4 de 4. Recusar o uso do EPI tem consequência. Verdade ou mito?'
            ]
        },

        // ─── QUIZ 1 (modulo-1.html, s-m1-quiz) — Fundamentos e Cultura de Segurança ───
        's-m1-quiz': {
            panels: { intro: '#q1-intro-panel', question: '#q1-question-panel', result: '#q1-result-panel' },
            counterSelector: '#q1-counter',
            intro: 'Cenários de Cultura SSO do Módulo 1. Cinco situações de campo. Acerte no mínimo três. Toque em Iniciar Desafio para começar.',
            questions: [
                'Cenário 1 de 5. Um líder vê um colaborador iniciando a tarefa sem o EPI indicado. Qual é a decisão correta?',
                'Cenário 2 de 5. Para organizar objetivos de saúde e segurança no dia a dia, a Leroy Merlin conta com o quê?',
                'Cenário 3 de 5. Na prática, a gestão de segurança envolve quem?',
                'Cenário 4 de 5. Por que ouvir quem está na operação é fundamental nas decisões de SSO?',
                'Cenário 5 de 5. O sistema de SSO deve ser revisado periodicamente com foco em quê?'
            ],
            result: 'Resultado dos cenários do Módulo 1. Veja sua pontuação na tela. Toque em Jogar Novamente para refazer ou avance.'
        },

        // ─── QUIZ 2 (modulo-2.html, s-m2-quiz) — Conceito de EPI e Responsabilidades ──
        's-m2-quiz': {
            panels: { intro: '#q2-intro-panel', question: '#q2-question-panel', result: '#q2-result-panel' },
            counterSelector: '#q2-counter',
            intro: 'Verdadeiro ou Falso do Módulo 2. Oito afirmações sobre EPI e responsabilidades. Acerte no mínimo cinco. Toque em Iniciar Desafio para começar.',
            questions: [
                'Afirmação 1 de 8. Segundo a NR-06, EPI é qualquer equipamento coletivo instalado na loja. Verdadeiro ou falso?',
                'Afirmação 2 de 8. A Leroy Merlin deve fornecer o EPI gratuitamente, adequado ao risco e em bom estado. Verdadeiro ou falso?',
                'Afirmação 3 de 8. O colaborador pode usar qualquer EPI trazido de casa, sem aprovação da empresa. Verdadeiro ou falso?',
                'Afirmação 4 de 8. O EPI entra quando a proteção coletiva não é viável ou não oferece proteção completa. Verdadeiro ou falso?',
                'Afirmação 5 de 8. Basta usar o EPI só quando o fiscal estiver presente. Verdadeiro ou falso?',
                'Afirmação 6 de 8. Danificar, extraviar ou alterar o EPI exige comunicação imediata para substituição. Verdadeiro ou falso?',
                'Afirmação 7 de 8. A organização deve adquirir apenas EPIs aprovados pelo órgão nacional competente. Verdadeiro ou falso?',
                'Afirmação 8 de 8. Emprestar o EPI do colega de outro setor, sem critério, é uma boa prática. Verdadeiro ou falso?'
            ],
            result: 'Resultado do Verdadeiro ou Falso do Módulo 2. Veja sua pontuação na tela.'
        },

        // ─── DESAFIO 3 (modulo-3.html, s-m3-game) — Combine o EPI certo ───────────────
        's-m3-game': {
            panels: { intro: '#q3-intro-panel', question: '#q3-question-panel', result: '#q3-result-panel' },
            counterSelector: '#q3-counter',
            intro: 'Permitido ou Proibido do Módulo 3. Seis condutas com EPI para classificar. Acerte no mínimo quatro. Toque em Iniciar Desafio para começar.',
            questions: [
                'Ação 1 de 6. Usar capacete de segurança com carneira ajustada e cinta jugular na manutenção. É permitido ou proibido?',
                'Ação 2 de 6. Entrar no depósito com chinelo aberto, sem calçado de segurança. É permitido ou proibido?',
                'Ação 3 de 6. No corte de madeira, utilizar respirador PFF3 contra partículas finas. É permitido ou proibido?',
                'Ação 4 de 6. Fixar talabarte ou trava-quedas abaixo do nível dos pés em trabalho em altura. É permitido ou proibido?',
                'Ação 5 de 6. Continuar a tarefa com luvas rasgadas porque já está no meio do serviço. É permitido ou proibido?',
                'Ação 6 de 6. Usar óculos de proteção e protetor facial contra partículas e respingos. É permitido ou proibido?'
            ],
            result: 'Resultado do Permitido ou Proibido do Módulo 3. Veja sua pontuação na tela.'
        },

        // ─── QUIZ FINAL 4 (modulo-4.html, s-m4-quiz) — EPI por Missão ─────────────────
        's-m4-quiz': {
            panels: { intro: '#q4-intro-panel', question: '#q4-question-panel', result: '#q4-result-panel' },
            counterSelector: '#q4-counter',
            intro: 'Liberar uso do EPI, Módulo 4. Seis missões para liberar ou bloquear o uso. Acerte no mínimo quatro. Toque em Iniciar Desafio para começar.',
            questions: [
                'Missão 1 de 6. Técnico de manutenção com kit completo. Liberar ou não liberar?',
                'Missão 2 de 6. Operador de empilhadeira sem protetor auricular. Liberar ou não liberar?',
                'Missão 3 de 6. Assessor do drive-in com óculos, calçado, PFF2, creme e protetor solar. Liberar ou não liberar?',
                'Missão 4 de 6. No corte, colaborador com máscara cirúrgica no lugar do respirador. Liberar ou não liberar?',
                'Missão 5 de 6. Central de cores com luvas nitrílicas e óculos contra respingos. Liberar ou não liberar?',
                'Missão 6 de 6. Colaborador insiste em começar com EPI rasgado. Liberar ou não liberar?'
            ],
            result: 'Resultado da liberação de uso do Módulo 4. Veja sua pontuação na tela.'
        }
    };

    /* Textos hardcoded para slides "normais" cujos áudios atuais ficaram ruins.
       Adicione aqui se quiser sobrescrever o texto extraído do HTML.
       Slides não listados usam extração automática via jsdom no generator.    */
    const OVERRIDES = {
        // exemplo: 's1': 'Bem-vindo ao treinamento NR 06...'
    };

    /* Calcula o número global do slide (1..NR11_TOTAL_SLIDES) a partir do
       nome do arquivo HTML e do índice interno do slide. Mantém em sintonia
       com NR11_MODULE_OFFSETS de shared.js.                                    */
    const MODULE_OFFSETS = {
        'index.html': 0, 'modulo-1.html': 2, 'modulo-2.html': 12,
        'modulo-3.html': 22, 'modulo-4.html': 34
    };

    function globalSlideOf(file, slideId) {
        const order = SLIDE_ORDER[file];
        if (!order) return null;
        const idx = order.indexOf(slideId);
        if (idx < 0) return null;
        return (MODULE_OFFSETS[file] || 0) + idx + 1;
    }

    return { SLIDE_ORDER, MULTI_STATE, OVERRIDES, MODULE_OFFSETS, globalSlideOf };
}));
