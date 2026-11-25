/**
 * Texto del cuento: frases, páginas, karaoke, ilustraciones y sincronía con el MP3.
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

function hideCountdownOverlay() {
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.classList.add("hidden");
}
function setPlayStatus(msg) {
  const el = document.getElementById("play-status");
  if (el) el.textContent = msg;
}

function hideStartButtons() {
  const cover = document.getElementById("btn-play-cover");
  const startPlay = document.getElementById("btn-start-play");
  const start = document.getElementById("btn-start-reading");
  const startArea = document.getElementById("start-reading-area");
  [cover, startPlay, start].forEach((btn) => {
    if (btn) btn.classList.add("hidden");
  });
  if (startArea) startArea.classList.add("hidden");
}

function showStartButtons() {
  const cover = document.getElementById("btn-play-cover");
  const startPlay = document.getElementById("btn-start-play");
  const start = document.getElementById("btn-start-reading");
  [cover, startPlay, start].forEach((btn) => {
    if (btn) btn.classList.remove("hidden");
  });
}


function setReadingUIVisible(visible) {
  const container = document.getElementById("karaoke-container");
  const indicator = document.getElementById("page-indicator");
  const controls = document.querySelector(".story-controls");
  const dock = document.getElementById("story-player-dock");
  const cfgToggle = document.getElementById("config-toggle");

  if (container) container.classList.toggle("hidden", !visible);
  if (indicator) indicator.classList.toggle("hidden", !visible);
  if (controls) controls.classList.toggle("hidden", !visible);
  if (dock) dock.classList.toggle("hidden", !visible);
  if (cfgToggle) cfgToggle.classList.toggle("hidden", !visible);
  const readingBar = document.getElementById("cuc-reading-bar");
  if (readingBar) readingBar.classList.toggle("hidden", !visible);
}

function setKaraokeBoxVisible(visible) {
  const container = document.getElementById("karaoke-container");
  const indicator = document.getElementById("page-indicator");
  if (container) container.classList.toggle("hidden", !visible);
  if (indicator) indicator.classList.toggle("hidden", !visible);
}

function splitSentences(text) {
  return text
    .split(/(?<=[\.\!\?])\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildSentencesAndPages(story, useRecording) {
  sentences = [];
  sceneForSentence = [];
  pages = [];
  pageForSentence = [];
  if (!story || !story.escenas || !story.escenas.length) {
    log("buildSentencesAndPages: no hay escenas", story);
    return;
  }
  const recorded = !!useRecording;
  const numEscenas = story.escenas.length;
  for (let start = 0; start < numEscenas; start += ESTROFAS_PER_PAGE) {
    const pageEscenas = [];
    for (let i = 0; i < ESTROFAS_PER_PAGE && start + i < numEscenas; i++) {
      pageEscenas.push(start + i);
    }
    pages.push(pageEscenas);
  }
  if (
    recorded &&
    narracionSyncData &&
    Array.isArray(narracionSyncData.segments) &&
    narracionSyncData.segments.length > 0
  ) {
    narracionSyncData.segments.forEach(function (seg) {
      const si = segmentSceneIndex(seg);
      const txt = seg.text != null ? String(seg.text).trim() : "";
      sentences.push({ text: txt.length ? txt : "\u00A0", sceneIndex: si });
      sceneForSentence.push(si);
      pageForSentence.push(Math.floor(si / ESTROFAS_PER_PAGE));
    });
    log(
      "buildSentencesAndPages: frases=" +
        sentences.length +
        " (segmentos MP3), páginas=" +
        pages.length
    );
    return;
  }

  story.escenas.forEach((escena, idxEscena) => {
    const texto = (escena && escena.texto) ? String(escena.texto) : "";
    const sceneSentences = recorded
      ? [texto.trim()].filter(function (t) {
          return t.length > 0;
        })
      : splitSentences(texto);
    const pageIdx = Math.floor(idxEscena / ESTROFAS_PER_PAGE);
    sceneSentences.forEach((sentence) => {
      sentences.push({ text: sentence, sceneIndex: idxEscena });
      sceneForSentence.push(idxEscena);
      pageForSentence.push(pageIdx);
    });
  });

  log(
    "buildSentencesAndPages: frases=" +
      sentences.length +
      ", páginas=" +
      pages.length +
      (recorded ? " (narración grabada)" : "")
  );
}

/** Índice de frase (en `sentences`) según el tiempo del audio. */
function getRecordedSentenceIndexForTime(t) {
  if (!narracionSyncData) return 0;
  const dur =
    narracionAudioEl && narracionAudioEl.duration && !Number.isNaN(narracionAudioEl.duration)
      ? narracionAudioEl.duration
      : 999999;

  if (narracionSyncData.segments && narracionSyncData.segments.length > 0) {
    const segs = narracionSyncData.segments;
    for (let i = 0; i < segs.length; i++) {
      const start = typeof segs[i].startSec === "number" ? segs[i].startSec : 0;
      let end;
      if (i < segs.length - 1) {
        end =
          typeof segs[i + 1].startSec === "number"
            ? segs[i + 1].startSec
            : segs[i].endSec;
      } else {
        end = typeof segs[i].endSec === "number" ? segs[i].endSec : dur;
        if (end == null || Number.isNaN(end) || end > dur) end = dur;
      }
      if (i === segs.length - 1) {
        if (t >= start && t <= dur + 0.08) return i;
      } else if (t >= start && t < end) {
        return i;
      }
    }
    return segs.length - 1;
  }

  const paras = narracionSyncData.paragraphs;
  if (!paras || !paras.length) return 0;
  for (let i = 0; i < paras.length; i++) {
    const start = typeof paras[i].startSec === "number" ? paras[i].startSec : 0;
    let end = paras[i].endSec;
    if (end == null || Number.isNaN(end) || end > dur) {
      end = dur;
    }
    const isLast = i === paras.length - 1;
    if (isLast) {
      if (t >= start) return i;
    } else if (t >= start && t < end) {
      return i;
    }
  }
  return paras.length - 1;
}

function narracionStartSecForSentence(sentenceIdx) {
  if (!narracionSyncData || sentenceIdx < 0) return 0;
  if (narracionSyncData.segments && narracionSyncData.segments[sentenceIdx]) {
    const s = narracionSyncData.segments[sentenceIdx].startSec;
    return typeof s === "number" ? s : 0;
  }
  if (narracionSyncData.paragraphs && narracionSyncData.paragraphs[sentenceIdx]) {
    const s = narracionSyncData.paragraphs[sentenceIdx].startSec;
    return typeof s === "number" ? s : 0;
  }
  return 0;
}

function onNarracionTimeUpdate() {
  if (!useRecordedNarration || !narracionAudioEl || !narracionSyncData || !isPlaying || isPaused) {
    return;
  }
  const t = narracionAudioEl.currentTime;
  const idx = getRecordedSentenceIndexForTime(t);
  if (idx === currentIndex) return;
  currentIndex = idx;
  currentWordIndex = 0;
  highlight(currentIndex);
}

function ensureNarracionListeners() {
  if (!narracionAudioEl || narracionTimeUpdateAttached) return;
  narracionTimeUpdateAttached = true;
  narracionAudioEl.addEventListener("timeupdate", onNarracionTimeUpdate);
  narracionAudioEl.addEventListener("playing", function () {
    narrationStarted = true;
    hideCountdownOverlay();
    setReadingUIVisible(true);
    hideStartButtons();
    highlight(currentIndex);
  });
  narracionAudioEl.addEventListener("ended", function () {
    if (!useRecordedNarration) return;
    if (repeatOnEnd && sentences.length > 0) {
      narracionAudioEl.currentTime = 0;
      currentIndex = 0;
      highlight(0);
      narracionAudioEl.play().catch(function () {});
      return;
    }
    isPlaying = false;
    isPaused = false;
    updateCenterPlayVisibility();
    highlight(-1);
    showEndPanel();
  });
}

function getCurrentPageIndex() {
  if (currentIndex < 0 || currentIndex >= sentences.length) return 0;
  return pageForSentence[currentIndex] ?? 0;
}

function getSentenceIndicesOnPage(pageIdx) {
  const pageEscenas = pages[pageIdx] || [];
  const result = [];
  for (let i = 0; i < sentences.length; i++) {
    if (pageEscenas.indexOf(sceneForSentence[i]) !== -1) result.push(i);
  }
  return result;
}

function getWordIndexFromCharIndex(sentence, charIndex) {
  const words = sentence.split(/\s+/).filter(Boolean);
  let pos = 0;
  for (let i = 0; i < words.length; i++) {
    const wordLen = words[i].length;
    if (charIndex >= pos && charIndex < pos + wordLen) return i;
    pos += wordLen + 1;
  }
  return Math.min(charIndex > pos ? words.length - 1 : 0, words.length - 1);
}

function renderCurrentPage(animate) {
  const container = document.getElementById("karaoke-container");
  const indicator = document.getElementById("page-indicator");
  if (!container) return;

  const pageIdx = getCurrentPageIndex();
  const pageEscenas = pages[pageIdx] || [];
  const pageChanged = pageIdx !== lastRenderedPageIndex;
  let flipClone = null;
  if (pageChanged && animate) {
    const paper = container.closest(".book-page-paper");
    if (paper && paper.children.length) {
      const wrap = document.createElement("div");
      wrap.className = "page-turn-flip-wrap";
      for (let i = 0; i < paper.children.length; i++) {
        wrap.appendChild(paper.children[i].cloneNode(true));
      }
      flipClone = wrap;
    }
  }

  if (pageChanged) {
    container.innerHTML = "";
    lastRenderedPageIndex = pageIdx;

    if (!storyData || !storyData.escenas || pageEscenas.length === 0) {
      // No mostramos hint extra: el inicio se controla con los botones fijos.
    } else {
      const sentenceIndicesOnPage = getSentenceIndicesOnPage(pageIdx);
      pageEscenas.forEach((escenaIdx) => {
        const escena = storyData.escenas[escenaIdx];
        const block = document.createElement("p");
        block.className = "karaoke-strofa";
        block.setAttribute("data-scene-index", String(escenaIdx));
        const isCurrentScene = currentIndex >= 0 && currentIndex < sentences.length && sceneForSentence[currentIndex] === escenaIdx;
        if (isCurrentScene) block.classList.add("current");

        const texto = (escena && escena.texto) ? escena.texto.trim() : "";
        const useSegmentLayout =
          useRecordedNarration &&
          narracionSyncData &&
          Array.isArray(narracionSyncData.segments) &&
          narracionSyncData.segments.length > 0;

        let localSentenceIndex = 0;
        if (useSegmentLayout) {
          const segs = narracionSyncData.segments;
          const segsHereCount = segs.filter(function (x) {
            return segmentSceneIndex(x) === escenaIdx;
          }).length;
          for (let globalIdx = 0; globalIdx < segs.length; globalIdx++) {
            const seg = segs[globalIdx];
            if (segmentSceneIndex(seg) !== escenaIdx) continue;
            const s = seg.text != null ? String(seg.text).trim() : "";
            const line = s.length ? s : "\u00A0";
            const isCurrentSentence = currentIndex === globalIdx;
            const sentenceWrap = document.createElement("span");
            sentenceWrap.className = "karaoke-sentence";
            sentenceWrap.setAttribute("data-sentence-index", String(localSentenceIndex));
            sentenceWrap.setAttribute("data-global-sentence-index", String(globalIdx));
            if (isCurrentSentence) sentenceWrap.classList.add("current");

            const parts = line.split(/(\s+)/);
            let wordIdx = 0;
            parts.forEach((w) => {
              const span = document.createElement("span");
              if (/^\s+$/.test(w)) {
                span.className = "karaoke-space";
                span.textContent = w;
              } else {
                span.className = "karaoke-word";
                span.setAttribute("data-word-index", String(wordIdx));
                span.textContent = w;
                wordIdx++;
              }
              sentenceWrap.appendChild(span);
            });
            block.appendChild(sentenceWrap);
            if (localSentenceIndex < segsHereCount - 1) {
              block.appendChild(document.createTextNode(" "));
            }
            localSentenceIndex++;
          }
        } else {
          const sceneSentences = splitSentences(texto);
          sceneSentences.forEach((s) => {
            const globalIdx = sentenceIndicesOnPage[localSentenceIndex];
            const isCurrentSentence = currentIndex === globalIdx;
            const sentenceWrap = document.createElement("span");
            sentenceWrap.className = "karaoke-sentence";
            sentenceWrap.setAttribute("data-sentence-index", String(localSentenceIndex));
            sentenceWrap.setAttribute("data-global-sentence-index", String(globalIdx));
            if (isCurrentSentence) sentenceWrap.classList.add("current");

            const parts = s.split(/(\s+)/);
            let wordIdx = 0;
            parts.forEach((w) => {
              const span = document.createElement("span");
              if (/^\s+$/.test(w)) {
                span.className = "karaoke-space";
                span.textContent = w;
              } else {
                span.className = "karaoke-word";
                span.setAttribute("data-word-index", String(wordIdx));
                span.textContent = w;
                wordIdx++;
              }
              sentenceWrap.appendChild(span);
            });
            block.appendChild(sentenceWrap);
            if (localSentenceIndex < sceneSentences.length - 1) {
              const space = document.createTextNode(" ");
              block.appendChild(space);
            }
            localSentenceIndex++;
          });
        }
        container.appendChild(block);
      });
    }
  }

  if (indicator) {
    const totalPages = pages.length;
    indicator.textContent = totalPages > 0 ? "Página " + (pageIdx + 1) + " de " + totalPages : "—";
  }

  updateHighlightOnly();

  if (flipClone) {
    triggerPageTurnEffect(flipClone);
  }

  if (pageChanged) {
    // Aviso para interact.js (puntos de página, precarga de la siguiente ilustración)
    document.dispatchEvent(
      new CustomEvent("cuc:page", { detail: { page: pageIdx, total: pages.length } })
    );
  }
}

function triggerPageTurnEffect(flipContentClone) {
  const container = document.getElementById("karaoke-container");
  const paper = container ? container.closest(".book-page-paper") : null;
  if (!paper || !flipContentClone) return;
  const existing = paper.querySelector(".page-turn-flip");
  if (existing) existing.remove();
  const flip = document.createElement("div");
  flip.className = "page-turn-flip";
  flip.appendChild(flipContentClone);
  paper.appendChild(flip);
  void paper.offsetWidth;
  flip.classList.add("page-turn-flip--animate");
  setTimeout(function () {
    flip.remove();
  }, 750);
}

/** Celular: modo “solo lectura activa” (ocultar frases ya leídas). */
function isNarrowMobileKaraokeViewport() {
  return typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches;
}

/**
 * En móvil, mientras suena la voz: oculta oraciones ya leídas (queda la actual bajo la imagen).
 * En silencio/pausa o fuera de móvil: muestra todo el texto.
 * Sin scroll automático al cambiar de frase (evita subir la vista y perder la imagen).
 */
function updateMobileKaraokeReadVisibility() {
  const container = document.getElementById("karaoke-container");
  if (!container) return;

  const narrow = isNarrowMobileKaraokeViewport();
  const compactRead = narrow && isPlaying && !isPaused && currentIndex >= 0 && currentIndex < sentences.length;

  container.classList.toggle("book-text--mobile-compact-read", compactRead);

  container.querySelectorAll(".karaoke-strofa--past-mobile").forEach((el) => el.classList.remove("karaoke-strofa--past-mobile"));
  container.querySelectorAll(".karaoke-sentence--past-mobile").forEach((el) => el.classList.remove("karaoke-sentence--past-mobile"));

  if (!compactRead) return;

  container.querySelectorAll(".karaoke-strofa").forEach((block) => {
    const spans = block.querySelectorAll(".karaoke-sentence");
    if (!spans.length) return;
    const hasCurrent = [...spans].some(function (el) {
      const g = parseInt(el.getAttribute("data-global-sentence-index"), 10);
      return !Number.isNaN(g) && g === currentIndex;
    });
    if (!hasCurrent) {
      block.classList.add("karaoke-strofa--past-mobile");
      return;
    }
    spans.forEach(function (el) {
      const g = parseInt(el.getAttribute("data-global-sentence-index"), 10);
      if (!Number.isNaN(g) && g !== currentIndex) el.classList.add("karaoke-sentence--past-mobile");
    });
  });
}

function updateHighlightOnly() {
  const container = document.getElementById("karaoke-container");
  if (!container) return;

  container.querySelectorAll(".karaoke-sentence").forEach((el) => el.classList.remove("current"));
  container.querySelectorAll(".karaoke-word").forEach((el) => el.classList.remove("current"));
  container.querySelectorAll(".karaoke-strofa").forEach((block) => block.classList.remove("current"));

  const active = isPlaying && !isPaused;
  if (active) document.body.classList.add("story-reading-active");
  else document.body.classList.remove("story-reading-active");

  if (active) {
    const pageIdx = getCurrentPageIndex();
    const sentenceIndicesOnPage = getSentenceIndicesOnPage(pageIdx);
    const localSentenceIndex = sentenceIndicesOnPage.indexOf(currentIndex);
    const currentSentenceEl = container.querySelector(".karaoke-sentence[data-sentence-index=\"" + localSentenceIndex + "\"]");
    if (currentSentenceEl) currentSentenceEl.classList.add("current");

    const sceneIdx = currentIndex >= 0 && currentIndex < sentences.length ? sceneForSentence[currentIndex] : -1;
    const currentBlock = sceneIdx >= 0 ? container.querySelector(".karaoke-strofa[data-scene-index=\"" + sceneIdx + "\"]") : null;
    if (currentBlock) currentBlock.classList.add("current");
  }

  updateMobileKaraokeReadVisibility();
}

function highlightKaraokeWord(wordIndex) {
  currentWordIndex = wordIndex;
  updateHighlightOnly();
}

function highlight(index) {
  const prevPage = getCurrentPageIndex();
  if (index < 0) {
    currentIndex = 0;
    currentWordIndex = 0;
    lastRenderedPageIndex = -1;
    updateSceneImageForIndex(0);
    renderCurrentPage(false);
    return;
  }
  currentIndex = index;
  currentWordIndex = 0;
  const newPage = getCurrentPageIndex();
  const shouldAnimate = newPage !== prevPage;
  updateSceneImageForIndex(index);
  renderCurrentPage(shouldAnimate);
}

function normalizeMediaUrl(url) {
  if (url == null || url === "") return "";
  const s = String(url).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return "/" + s.replace(/^\/+/, "");
}

/** Índice de escena en segmentos del sync (número o string en JSON). */
function segmentSceneIndex(seg) {
  if (!seg || seg.sceneIndex == null) return 0;
  const v = seg.sceneIndex;
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return Math.max(0, n);
  }
  return 0;
}

/** Tablet/escritorio: portada en la franja oscura (columna izquierda). */
function isWideStoryCoverLayout() {
  return typeof window.matchMedia === "function" && window.matchMedia("(min-width: 768px)").matches;
}

/**
 * Mueve #book-cover-slot (y el play) entre la hoja oscura y la hoja del texto.
 * En celular (≤767px) la imagen queda en la misma caja crema que el karaoke → centrado simple con CSS.
 */
function syncCoverSlot() {
  const slot = document.getElementById("book-cover-slot");
  const btn = document.getElementById("btn-play-cover");
  const leftPaper = document.getElementById("book-left-paper-slot");
  const rightPaper = document.getElementById("book-page-text-paper");
  const karaoke = document.getElementById("karaoke-container");
  const leftHost = document.getElementById("book-page-cover-host");
  if (!slot || !leftPaper || !rightPaper || !karaoke) return;

  if (isWideStoryCoverLayout()) {
    if (leftHost) leftHost.style.display = "";
    if (slot.parentElement !== leftPaper) {
      leftPaper.insertBefore(slot, leftPaper.firstChild);
      if (btn) slot.insertAdjacentElement("afterend", btn);
    }
  } else {
    if (slot.parentElement !== rightPaper) {
      rightPaper.insertBefore(slot, karaoke);
      if (btn) slot.insertAdjacentElement("afterend", btn);
    }
    if (leftHost) leftHost.style.display = "none";
  }
}

function clearCoverFrameInlineStyles() {
  const frame = document.querySelector("#book-cover-slot .book-illustration-frame");
  if (!frame) return;
  [
    "width",
    "maxWidth",
    "marginLeft",
    "marginRight",
    "marginTop",
    "marginBottom",
    "left",
    "transform",
    "display",
    "position",
    "boxSizing",
  ].forEach(function (p) {
    frame.style[p] = "";
  });
}

let _centerCoverTimer = null;
function scheduleCenterMobileStoryCover() {
  if (_centerCoverTimer) clearTimeout(_centerCoverTimer);
  _centerCoverTimer = setTimeout(function () {
    _centerCoverTimer = null;
    requestAnimationFrame(function () {
      syncCoverSlot();
      clearCoverFrameInlineStyles();
    });
  }, 32);
}

function applyStoryCoverImage(url) {
  const coverEl = document.getElementById("story-cover");
  if (!coverEl || url == null || url === "") return;
  const u = normalizeMediaUrl(url);
  if (!u) return;
  /* <img src> es más fiable que background-image en div (menos conflictos con CSS) */
  if (coverEl.tagName === "IMG") {
    coverEl.onerror = function () {
      log("story-cover: no se pudo cargar", u);
    };
    coverEl.onload = function () {
      log("story-cover: imagen lista", u);
      scheduleCenterMobileStoryCover();
    };
    coverEl.src = u;
    coverEl.alt = storyTitle || "Ilustración del cuento";
    coverEl.removeAttribute("srcset");
    log("story-cover: src asignado →", u);
    if (coverEl.complete) scheduleCenterMobileStoryCover();
  } else {
    const isWide = typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1025px)").matches;
    coverEl.style.backgroundImage = "url(" + JSON.stringify(u) + ")";
    coverEl.style.backgroundPosition = "center";
    coverEl.style.backgroundRepeat = "no-repeat";
    coverEl.style.backgroundSize = isWide ? "contain" : "cover";
  }
}

function updateSceneImageForIndex(index) {
  if (!storyData || index < 0) return;
  let url = null;
  if (Array.isArray(storyData.escenas) && storyData.escenas.length > 0) {
    const sceneIdx = sceneForSentence[index];
    const escena = typeof sceneIdx === "number" ? storyData.escenas[sceneIdx] : null;
    if (escena && escena.imagen && String(escena.imagen).trim()) url = String(escena.imagen).trim();
  }
  if (!url && storyData.portada && String(storyData.portada).trim()) url = String(storyData.portada).trim();
  if (url) {
    applyStoryCoverImage(url);
  } else {
    log("updateSceneImageForIndex: sin URL (ni escena ni portada) índice=", index);
  }
  scheduleCenterMobileStoryCover();
}
