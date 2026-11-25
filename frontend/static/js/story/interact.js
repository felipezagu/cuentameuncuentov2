/**
 * Interacción extra en la página del cuento (se carga después de story.js y usa su estado):
 *  - Tocar una palabra para escucharla.
 *  - Modo "Lo leo yo": sin narrador, el niño pasa las páginas a su ritmo.
 *  - Deslizar con el dedo / flechas del teclado para cambiar de página.
 *  - Estrellas al terminar el cuento y al responder el quiz (rewards.js).
 */
(function () {
  let selfReadMode = false;
  let quizCorrect = 0;
  let wordUtterance = null;

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------
  function isOverlayOpen() {
    const quiz = document.getElementById("book-quiz-overlay");
    const intro = document.getElementById("countdown-overlay");
    const cfg = document.getElementById("config-panel");
    return (
      (quiz && !quiz.classList.contains("hidden")) ||
      (intro && !intro.classList.contains("hidden")) ||
      (cfg && !cfg.classList.contains("hidden"))
    );
  }

  function isReading() {
    return narrationStarted || selfReadMode;
  }

  function cleanWord(w) {
    return String(w || "").replace(/[^\p{L}\p{N}'-]+/gu, "");
  }

  function showToast(text) {
    let el = document.getElementById("cuc-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cuc-toast";
      el.className = "cuc-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.remove("cuc-toast--show");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("cuc-toast--show");
  }

  // ---------------------------------------------------------------------------
  // 1) Tocar una palabra para escucharla
  // ---------------------------------------------------------------------------
  function speakWord(word, onDone) {
    if (!window.speechSynthesis || !word) {
      if (onDone) onDone();
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignorar
    }
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "es-ES";
    u.rate = 0.8;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const es = voices.find(function (v) { return /^es(-|_|$)/i.test(v.lang); });
    if (es) u.voice = es;
    u.onend = u.onerror = function () {
      if (wordUtterance === u && onDone) onDone();
    };
    wordUtterance = u;
    window.speechSynthesis.speak(u);
  }

  function onWordTap(e) {
    const wordEl = e.target.closest(".karaoke-word");
    if (!wordEl) return;
    const word = cleanWord(wordEl.textContent);
    if (!word) return;

    wordEl.classList.remove("karaoke-word--tapped");
    void wordEl.offsetWidth;
    wordEl.classList.add("karaoke-word--tapped");

    // Con voz del navegador leyendo el cuento no podemos intercalar otra frase sin cortarlo.
    if (!useRecordedNarration && isPlaying && !isPaused) return;

    const resumeAfter = useRecordedNarration && narracionAudioEl && !narracionAudioEl.paused;
    if (resumeAfter) narracionAudioEl.pause();
    speakWord(word, function () {
      if (resumeAfter && isPlaying && !isPaused) narracionAudioEl.play().catch(function () {});
    });
  }

  // ---------------------------------------------------------------------------
  // 2) Modo "Lo leo yo"
  // ---------------------------------------------------------------------------
  function startSelfRead(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!sentences.length) return;
    selfReadMode = true;
    document.body.classList.add("cuc-self-read");
    stopNarrationOnLeave();
    hideCountdownOverlay();
    hideStartButtons();
    setReadingUIVisible(true);
    currentIndex = 0;
    lastRenderedPageIndex = -1;
    highlight(0);
    showToast("📖 Toca una palabra si quieres escucharla");
  }

  /** Desde "Lo leo yo" se puede pedir que el narrador siga desde esta página. */
  function narrateFromHere(e) {
    if (e) e.stopPropagation();
    selfReadMode = false;
    document.body.classList.remove("cuc-self-read");
    isPlaying = false;
    isPaused = false;
    play();
    updatePauseButtonLabels();
  }

  function injectSelfReadControls() {
    const playBtn = document.getElementById("btn-play-overlay");
    if (playBtn && !document.getElementById("btn-self-read")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "btn-self-read";
      btn.className = "self-read-btn";
      btn.innerHTML = '<span aria-hidden="true">📖</span> Lo leo yo';
      btn.addEventListener("click", startSelfRead);
      playBtn.insertAdjacentElement("afterend", btn);
    }
    const controls = document.querySelector(".story-controls");
    if (controls && !document.getElementById("btn-narrate-here")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "btn-narrate-here";
      btn.className = "story-control-btn story-control-btn-narrate";
      btn.title = "Que me lo lean desde aquí";
      btn.innerHTML =
        '<span class="story-control-btn-icon" aria-hidden="true">🔊</span>' +
        '<span class="story-control-btn-label">Léemelo</span>';
      btn.addEventListener("click", narrateFromHere);
      controls.insertBefore(btn, controls.firstChild);
    }
  }

  // ---------------------------------------------------------------------------
  // 3) Deslizar / teclado para pasar página
  // ---------------------------------------------------------------------------
  function bindSwipe() {
    const area = document.getElementById("cuento-inicio");
    if (!area) return;
    let x0 = null;
    let y0 = null;
    area.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    area.addEventListener("touchend", function (e) {
      if (x0 === null || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = y0 = null;
      if (!isReading() || isOverlayOpen()) return;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      if (dx < 0) goNext();
      else goPrev();
    }, { passive: true });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (tag === "BUTTON" && e.key === " ") return; // espacio sobre un botón = pulsarlo
      if (!isReading() || isOverlayOpen()) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === " " && !selfReadMode) {
        e.preventDefault();
        handlePauseResumeClick();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4) Estrellas (hooks llamados desde story.js)
  // ---------------------------------------------------------------------------
  function renderStarsBadge(container, stars, label) {
    if (!container) return;
    const old = container.querySelector(".cuc-stars-earned");
    if (old) old.remove();
    const wrap = document.createElement("div");
    wrap.className = "cuc-stars-earned";
    wrap.setAttribute("aria-label", label);
    const s = document.createElement("div");
    s.className = "cuc-stars-earned__stars";
    for (let i = 0; i < 3; i++) {
      const star = document.createElement("span");
      star.className = "cuc-star" + (i < stars ? " cuc-star--on" : "");
      star.style.animationDelay = i * 0.18 + "s";
      star.textContent = "★";
      s.appendChild(star);
    }
    const t = document.createElement("p");
    t.className = "cuc-stars-earned__label";
    t.textContent = label;
    wrap.appendChild(s);
    wrap.appendChild(t);
    container.insertBefore(wrap, container.firstChild);
  }

  function onStoryFinished(cardEl) {
    quizCorrect = 0;
    if (!window.CUCRewards || !storyData) return;
    const gained = CUCRewards.markRead(storyData.id);
    const e = CUCRewards.get(storyData.id) || { estrellas: 1 };
    renderStarsBadge(
      cardEl,
      e.estrellas,
      gained ? "¡Ganaste una estrella por terminar el cuento!" : "Ya tienes " + e.estrellas + " de 3 estrellas en este cuento"
    );
    if (gained) showToast("⭐ ¡Nueva estrella!");
  }

  function onQuizAnswer(isCorrect) {
    if (isCorrect) quizCorrect += 1;
  }

  function onQuizDone(cardEl, total) {
    if (!window.CUCRewards || !storyData) return;
    const gained = CUCRewards.saveQuiz(storyData.id, quizCorrect, total);
    const e = CUCRewards.get(storyData.id) || { estrellas: 1 };
    const label =
      "Acertaste " + quizCorrect + " de " + total +
      (gained ? " · ¡+" + gained + (gained === 1 ? " estrella!" : " estrellas!") : "");
    renderStarsBadge(cardEl, e.estrellas, label);
    if (gained) showToast("⭐ ¡+" + gained + "!");
    if (gained && e.estrellas === 3) setTimeout(confetti, 500);
    quizCorrect = 0;
  }

  // ---------------------------------------------------------------------------
  // 5) Barra de lectura: puntos de página (saltar), tamaño de letra
  // ---------------------------------------------------------------------------
  const SCALE_KEY = "cuc_text_scale";
  const SCALES = [0.85, 1, 1.15, 1.3, 1.5];

  function goToPage(n) {
    if (n < 0 || n >= pages.length) return;
    const idx = getFirstSentenceIndexForPage(n);
    if (useRecordedNarration && narracionAudioEl && narracionSyncData) {
      narracionAudioEl.currentTime = narracionStartSecForSentence(idx);
      currentWordIndex = 0;
      highlight(idx);
      if (isPlaying && !isPaused) narracionAudioEl.play().catch(function () {});
      return;
    }
    if (isPlaying && synth) synth.cancel();
    currentWordIndex = 0;
    highlight(idx);
    if (isPlaying && !isPaused) speakCurrent();
  }

  function getScaleIdx() {
    let v = 1;
    try {
      v = parseFloat(localStorage.getItem(SCALE_KEY) || "1");
    } catch (e) {
      v = 1;
    }
    const i = SCALES.indexOf(v);
    return i === -1 ? 1 : i;
  }

  function applyScale(i) {
    const idx = Math.max(0, Math.min(SCALES.length - 1, i));
    document.body.style.setProperty("--cuc-text-scale", String(SCALES[idx]));
    try {
      localStorage.setItem(SCALE_KEY, String(SCALES[idx]));
    } catch (e) {
      // Ignorar
    }
    const minus = document.getElementById("cuc-font-minus");
    const plus = document.getElementById("cuc-font-plus");
    if (minus) minus.disabled = idx === 0;
    if (plus) plus.disabled = idx === SCALES.length - 1;
    updateHighlightOnly();
    return idx;
  }

  function buildReadingBar() {
    const book = document.getElementById("cuento-inicio");
    if (!book || document.getElementById("cuc-reading-bar")) return;
    const bar = document.createElement("div");
    bar.id = "cuc-reading-bar";
    bar.className = "cuc-reading-bar hidden";

    const dots = document.createElement("nav");
    dots.id = "cuc-page-dots";
    dots.className = "cuc-page-dots";
    dots.setAttribute("aria-label", "Páginas del cuento");

    const font = document.createElement("div");
    font.className = "cuc-font-ctrl";
    font.setAttribute("role", "group");
    font.setAttribute("aria-label", "Tamaño de la letra");
    font.innerHTML =
      '<button type="button" id="cuc-font-minus" class="cuc-font-btn" aria-label="Letra más pequeña">A−</button>' +
      '<button type="button" id="cuc-font-plus" class="cuc-font-btn cuc-font-btn--big" aria-label="Letra más grande">A+</button>';

    bar.appendChild(dots);
    bar.appendChild(font);
    book.insertAdjacentElement("afterend", bar);

    let scaleIdx = applyScale(getScaleIdx());
    document.getElementById("cuc-font-minus").addEventListener("click", function () {
      scaleIdx = applyScale(scaleIdx - 1);
    });
    document.getElementById("cuc-font-plus").addEventListener("click", function () {
      scaleIdx = applyScale(scaleIdx + 1);
    });
  }

  function renderDots(page, total) {
    const nav = document.getElementById("cuc-page-dots");
    if (!nav) return;
    if (nav.childElementCount !== total) {
      nav.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cuc-page-dot";
        b.setAttribute("aria-label", "Ir a la página " + (i + 1));
        b.addEventListener("click", function () { goToPage(i); });
        nav.appendChild(b);
      }
    }
    Array.prototype.forEach.call(nav.children, function (b, i) {
      b.classList.toggle("is-current", i === page);
      b.classList.toggle("is-read", i < page);
      if (i === page) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  }

  /** Precarga la ilustración de la página siguiente para que el cambio sea instantáneo. */
  function preloadNextImage(page) {
    if (!storyData || !Array.isArray(storyData.escenas)) return;
    const next = (pages[page + 1] || [])[0];
    const esc = typeof next === "number" ? storyData.escenas[next] : null;
    if (esc && esc.imagen) {
      const img = new Image();
      img.decoding = "async";
      img.src = normalizeMediaUrl(esc.imagen);
    }
  }

  // ---------------------------------------------------------------------------
  // 6) Confeti cuando gana las 3 estrellas
  // ---------------------------------------------------------------------------
  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.className = "cuc-confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6", "#facc15"];
    const parts = [];
    for (let i = 0; i < 140; i++) {
      parts.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.3,
        y: h * 0.35,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 4,
        s: 5 + Math.random() * 6,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length],
      });
    }
    const start = performance.now();
    (function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p) {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 2600);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (t < 2600) requestAnimationFrame(frame);
      else canvas.remove();
    })(start);
  }

  // ---------------------------------------------------------------------------
  function init() {
    const container = document.getElementById("karaoke-container");
    if (container) container.addEventListener("click", onWordTap);
    injectSelfReadControls();
    buildReadingBar();
    document.addEventListener("cuc:page", function (e) {
      renderDots(e.detail.page, e.detail.total);
      preloadNextImage(e.detail.page);
    });
    bindSwipe();
    bindKeyboard();
  }

  window.CUCInteract = {
    onStoryFinished: onStoryFinished,
    onQuizAnswer: onQuizAnswer,
    onQuizDone: onQuizDone,
    isSelfRead: function () { return selfReadMode; },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
