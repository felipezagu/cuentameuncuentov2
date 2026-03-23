const synth = window.speechSynthesis;
const LOG = true;
function log() {
  if (LOG && window.console) console.log("[CUC]", ...arguments);
}
log("story.js cargado");

const ESTROFAS_PER_PAGE = 1;

function uiDebug(msg) {
  const el = document.getElementById("js-debug");
  if (!el) return;
  el.style.display = "block";
  const ts = new Date().toLocaleTimeString();
  el.textContent = el.textContent ? el.textContent + "\n" + ts + " " + msg : ts + " " + msg;
}

window.onerror = function (message, source, lineno, colno, error) {
  uiDebug("JS ERROR: " + message + " @ " + (source || "") + ":" + lineno + ":" + colno);
};

uiDebug("init: script loaded");

let currentIndex = 0;
let sentences = [];
let isPlaying = false;
let isPaused = false;
let centerButtonUsed = false;
let repeatOnEnd = false;
let currentUtterance = null;
let storyData = null;
let sceneForSentence = [];
let pages = [];
let pageForSentence = [];
let lastRenderedPageIndex = -1;
let currentWordIndex = 0;
let wasPlayingBeforeConfig = false;
let narrationStarted = false;
let storyTitle = "";
let lastHandlePlayClickAt = 0;
let lastHandlePlayClickType = "";
let countdownActive = false;
let userGestureUnlocked = false;

/** Narración pregrabada (MP3 + JSON de tiempos por párrafo) */
let useRecordedNarration = false;
let narracionSyncData = null;
let narracionAudioEl = null;
let narracionTimeUpdateAttached = false;

// --- Voz hombre/mujer (MP3 pregrabado) ---
let allStoriesCache = null;
// Tolerante al tipo de guion raro que puede aparecer en el título.
const V2_VOICE_SUFFIX_RE = /\(\s*v2[^)]*narrador\s*(mujer|hombre)\s*\)\s*$/i;

function parseV2VoiceTitle(titulo) {
  const t = String(titulo || "").trim();
  const m = t.match(V2_VOICE_SUFFIX_RE);
  if (!m) return null;
  return { base: t.replace(m[0], "").trim(), gender: String(m[1]).toLowerCase() };
}

function stripV2VoiceTitle(titulo) {
  const p = parseV2VoiceTitle(titulo);
  return p ? p.base : String(titulo || "").trim();
}

function detectGenderFromAudio(audioUrl) {
  const a = (audioUrl ? String(audioUrl) : "").toLowerCase();
  if (!a) return null;
  if (a.includes("mujer") || a.endsWith("mujer.mp3")) return "mujer";
  if (a.includes("hombre") || a.endsWith("hombre.mp3")) return "hombre";
  return null;
}

function getBaseTitleForVoiceGrouping(titulo) {
  // Si todavía existiera sufijo v2 en algún título, lo quita; si no, devuelve el título tal cual.
  return stripV2VoiceTitle(titulo);
}

function jsSafeSlug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

async function fetchAllStoriesOnce() {
  if (allStoriesCache) return allStoriesCache;
  try {
    const res = await fetch("/api/stories/");
    if (!res.ok) return (allStoriesCache = []);
    allStoriesCache = await res.json();
    return allStoriesCache;
  } catch {
    return (allStoriesCache = []);
  }
}

function openGoogleSearch(term) {
  const q = encodeURIComponent(String(term || "").trim());
  if (!q) return;
  window.open("https://www.google.com/search?q=" + q, "_blank", "noopener,noreferrer");
}

async function setupVoiceChoiceOverlay(story, recordedNarrationOk) {
  const wrap = document.getElementById("voice-choice-overlay");
  const btnMale = document.getElementById("btn-voice-male");
  const btnFemale = document.getElementById("btn-voice-female");
  if (!wrap || !btnMale || !btnFemale) return;

  if (!story || !story.titulo) return;
  // Misma condición que useRecordedNarration: si no hay MP3 activo, no confundir con Hombre/Mujer.
  if (!recordedNarrationOk) {
    wrap.classList.add("hidden");
    return;
  }
  // Solo tiene sentido si existe narración pregrabada para ese cuento.
  if (!story.narracion_audio || !story.narracion_sync) {
    wrap.classList.add("hidden");
    return;
  }

  // Mostramos el bloque desde ya (aunque aún estemos cargando ids),
  // para que el usuario vea el mensaje antes de que termine el fetch.
  wrap.classList.remove("hidden");
  btnMale.disabled = true;
  btnFemale.disabled = true;
  btnMale.classList.remove("active");
  btnFemale.classList.remove("active");

  const currentGender = detectGenderFromAudio(story.narracion_audio) || "hombre";
  const baseTitle = getBaseTitleForVoiceGrouping(story.titulo);

  const stories = await fetchAllStoriesOnce();
  let maleId = null;
  let femaleId = null;
  (stories || []).forEach((s) => {
    if (!s || !s.titulo) return;
    if (getBaseTitleForVoiceGrouping(s.titulo) !== baseTitle) return;
    const g = detectGenderFromAudio(s.narracion_audio);
    if (g === "hombre") maleId = s.id;
    if (g === "mujer") femaleId = s.id;
  });

  if (!maleId && !femaleId) {
    wrap.classList.add("hidden");
    return;
  }

  const selectedGender = currentGender;
  const goTo = (targetId) => {
    if (!targetId) return;
    stopNarrationOnLeave();
    // Reutilizamos la misma convención del resto de la app: en móvil usa hash.
    const hash = isMobileOrTablet() ? "#cuento-inicio" : "";
    window.location.href = "/cuento/" + targetId + hash;
  };

  function bindVoiceTap(btn, targetId) {
    if (!btn) return;
    const handler = function (e) {
      // Evita que el overlay arranque la lectura mientras eliges voz.
      e.preventDefault();
      e.stopPropagation();
      goTo(targetId);
    };
    btn.addEventListener("click", handler);
    btn.addEventListener("pointerup", handler, { passive: false });
    btn.addEventListener("touchend", handler, { passive: false });
  }

  btnMale.disabled = selectedGender === "hombre" || !maleId;
  btnFemale.disabled = selectedGender === "mujer" || !femaleId;
  btnMale.classList.toggle("active", selectedGender === "hombre");
  btnFemale.classList.toggle("active", selectedGender === "mujer");

  bindVoiceTap(btnMale, maleId);
  bindVoiceTap(btnFemale, femaleId);
}

async function setupNarrationVoiceSelect(story, recordedEnabled) {
  const sel = document.getElementById("narration-voice-select");
  if (!sel) return;

  // Por defecto lo deshabilitamos.
  sel.disabled = true;
  sel.value = "hombre";
  const maleOpt = sel.querySelector('option[value="hombre"]');
  const femaleOpt = sel.querySelector('option[value="mujer"]');
  if (maleOpt) maleOpt.disabled = true;
  if (femaleOpt) femaleOpt.disabled = true;

  if (!recordedEnabled) return;
  if (!story || !story.titulo) return;
  const currentGender = detectGenderFromAudio(story.narracion_audio) || "hombre";
  const baseTitle = getBaseTitleForVoiceGrouping(story.titulo);

  const stories = await fetchAllStoriesOnce();
  let maleId = null;
  let femaleId = null;
  (stories || []).forEach((s) => {
    if (!s || !s.titulo) return;
    if (getBaseTitleForVoiceGrouping(s.titulo) !== baseTitle) return;
    const g = detectGenderFromAudio(s.narracion_audio);
    if (g === "hombre") maleId = s.id;
    if (g === "mujer") femaleId = s.id;
  });

  if (!maleId && !femaleId) return;

  sel.disabled = false;
  sel.value = currentGender;
  if (maleOpt) maleOpt.disabled = !maleId;
  if (femaleOpt) femaleOpt.disabled = !femaleId;
}

async function goToV2NarrationGender(gender) {
  if (!storyData || !storyData.titulo) return;
  const baseTitle = getBaseTitleForVoiceGrouping(storyData.titulo);
  if (!gender) return;

  const stories = await fetchAllStoriesOnce();
  let targetId = null;
  (stories || []).forEach((s) => {
    if (!s || !s.titulo) return;
    if (getBaseTitleForVoiceGrouping(s.titulo) !== baseTitle) return;
    const g = detectGenderFromAudio(s.narracion_audio);
    if (g === gender) targetId = s.id;
  });

  if (!targetId) return;
  stopNarrationOnLeave();
  const hash = isMobileOrTablet() ? "#cuento-inicio" : "";
  window.location.href = "/cuento/" + targetId + hash;
}

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

function startCountdownAndAutoplay() {
  narrationStarted = false;
  countdownActive = true;
  userGestureUnlocked = false;
  const overlay = document.getElementById("countdown-overlay");
  const numberEl = document.getElementById("countdown-number");
  const headingEl = document.getElementById("countdown-heading");
  const titleEl = document.getElementById("countdown-title");
  const startArea = document.getElementById("start-reading-area");
  const startBtn = document.getElementById("btn-start-reading");
  if (!overlay || !numberEl) return;

  overlay.classList.remove("hidden");

  let remaining = 5;
  const stepMs = 1000;
  numberEl.textContent = String(remaining);
  if (titleEl) titleEl.textContent = storyTitle || "";

  const showManualStartFallback = () => {
    if (startArea) startArea.classList.remove("hidden");
    if (startBtn) startBtn.classList.remove("hidden");
    if (startBtn) startBtn.disabled = false;
    // Nunca mostramos el play grande como fallback.
    const big = document.getElementById("btn-start-play");
    if (big) big.classList.add("hidden");
  };

  const startFromUserGesture = () => {
    if (!countdownActive) return;
    countdownActive = false;
    userGestureUnlocked = true;
    hideCountdownOverlay();
    setReadingUIVisible(true);
    hideStartButtons();
    isPlaying = false;
    isPaused = false;
    currentIndex = 0;
    highlight(currentIndex);
    play();
  };

  // En muchos móviles, SpeechSynthesis no funciona sin "user gesture".
  // Si el usuario toca la pantalla durante el conteo, iniciamos de inmediato.
  const gestureHandler = () => {
    userGestureUnlocked = true;
    startFromUserGesture();
  };
  // Poniéndolo en `overlay` + captura es más robusto en móviles
  // (a veces el toque sobre overlays no llega a `document` como esperamos).
  overlay.addEventListener("touchend", gestureHandler, { passive: true, once: true });
  overlay.addEventListener("pointerup", gestureHandler, { passive: true, once: true });
  overlay.addEventListener("click", gestureHandler, { once: true });

  document.addEventListener("touchend", gestureHandler, { passive: true, once: true, capture: true });
  document.addEventListener("pointerup", gestureHandler, { passive: true, once: true, capture: true });

  const intervalId = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(intervalId);
      countdownActive = false;

      // Termina la cuenta: intentamos iniciar automáticamente.
      setTimeout(() => {
        // Quitamos el overlay para que se vea la caja del cuento.
        hideCountdownOverlay();
        hideStartButtons();
        isPlaying = false;
        isPaused = false;
        currentIndex = 0;

        // Pre-render para que el texto quede destacado.
        highlight(currentIndex);

        // Mostrar controles desde el inicio (sin el play grande).
        setReadingUIVisible(true);

        // Solo intentamos "auto" si ya hubo user gesture válida durante el conteo.
        if (userGestureUnlocked) {
          play();
          setTimeout(() => {
            if (!narrationStarted) showManualStartFallback();
          }, 600);
        } else {
          // Sin user gesture, en iOS/Android normalmente se bloquea.
          showManualStartFallback();
          setPlayStatus("Autoinicio bloqueado en móvil. Toca 'Iniciar lectura'.");
        }
      }, 150);
    } else {
      numberEl.textContent = String(remaining);
    }
  }, stepMs);
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

function speakCurrent() {
  if (useRecordedNarration) return;
  if (!sentences.length || currentIndex < 0 || currentIndex >= sentences.length) return;
  if (!synth) return;

  // En móviles, `cancel()` puede interferir si estamos iniciando desde cero.
  // Solo cancelamos si ya hay algo hablando/pausado.
  try {
    if (synth.speaking || synth.paused) synth.cancel();
  } catch (e) {
    // Ignoramos errores de cancel según el navegador.
  }
  currentUtterance = null;

  const rateEl = document.getElementById("rate-range");
  const rate = parseFloat((rateEl && rateEl.value ? rateEl.value : "1") || "1");
  const voiceSelect = document.getElementById("voice-select");
  const voiceId = voiceSelect && voiceSelect.value ? voiceSelect.value : "";

  const sentenceText = sentences[currentIndex].text;
  const utter = new SpeechSynthesisUtterance(sentenceText);
  utter.lang = "es-ES";
  utter.rate = rate;

  if (voiceId && synth.getVoices) {
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.name === voiceId || v.voiceURI === voiceId);
    if (voice) {
      utter.voice = voice;
    }
  }

  utter.onstart = () => {
    setPlayStatus("onstart: idx=" + currentIndex);
    isPlaying = true;
    narrationStarted = true;
    hideCountdownOverlay();
    setReadingUIVisible(true);
    hideStartButtons();
    highlight(currentIndex);
  };

  utter.onerror = (event) => {
    const msg =
      event && event.error
        ? String(event.error)
        : "unknown";
    setPlayStatus("utter.onerror: " + msg);
  };

  utter.onboundary = (event) => {
    if (event.name === "word" && typeof event.charIndex !== "undefined") {
      const wordIdx = getWordIndexFromCharIndex(sentenceText, event.charIndex);
      highlightKaraokeWord(wordIdx);
    }
  };

  utter.onend = () => {
    // Ignorar fin de frases canceladas (p. ej. al pulsar Avanzar): si no es el utter activo, no avanzar.
    if (utter !== currentUtterance) return;
    // En algunos móviles, al pausar puede dispararse `onend` como si la frase hubiera terminado.
    // Eso avanzaba el índice o mostraba el final y al reanudar volvía al inicio.
    if (isPaused) return;
    setPlayStatus("onend: idx=" + currentIndex);
    isPaused = false;
    if (!isPlaying) return;
    let nextIndex = currentIndex + 1;
    if (nextIndex < sentences.length) {
      highlight(nextIndex);
      speakCurrent();
    } else if (repeatOnEnd && sentences.length > 0) {
      highlight(0);
      speakCurrent();
    } else {
      isPlaying = false;
      updateCenterPlayVisibility();
      highlight(-1);
      showEndPanel();
    }
  };

  currentUtterance = utter;
  try {
    setPlayStatus(
      "speak() llamado. rate=" +
        rate +
        " idx=" +
        currentIndex +
        " voiceId=" +
        (voiceId || "(auto)")
    );
    synth.speak(utter);
    // `speaking/paused` puede tardar en actualizar; sirve como pista rápida.
    setPlayStatus(
      "speak() llamado OK. speaking=" +
        (synth.speaking ? "1" : "0") +
        " paused=" +
        (synth.paused ? "1" : "0")
    );
  } catch (err) {
    setPlayStatus("speak() ERROR: " + (err && err.message ? err.message : err));
    throw err;
  }
}

function play() {
  log("play() llamada. sentences.length=" + sentences.length + ", isPaused=" + isPaused + ", isPlaying=" + isPlaying);
  if (!sentences.length) {
    log("play() NO hace nada: no hay frases (¿cargó el cuento?)");
    setPlayStatus("play(): no hay texto (sentences=0)");
    return;
  }
  if (useRecordedNarration && narracionAudioEl) {
    const rateEl = document.getElementById("rate-range");
    const rate = parseFloat((rateEl && rateEl.value ? rateEl.value : "1") || "1");
    narracionAudioEl.playbackRate = rate;
    if (isPaused) {
      narracionAudioEl
        .play()
        .then(function () {
          isPaused = false;
          isPlaying = true;
          narrationStarted = true;
          updateCenterPlayVisibility();
          updateHighlightOnly();
        })
        .catch(function (err) {
          setPlayStatus("audio.play: " + (err && err.message ? err.message : err));
        });
      return;
    }
    if (!isPlaying) {
      if (currentIndex < 0 || currentIndex >= sentences.length) currentIndex = 0;
      narracionAudioEl.currentTime = narracionStartSecForSentence(currentIndex);
      isPlaying = true;
      isPaused = false;
      narracionAudioEl
        .play()
        .then(function () {
          narrationStarted = true;
          hideCountdownOverlay();
          setReadingUIVisible(true);
          hideStartButtons();
          highlight(currentIndex);
        })
        .catch(function (err) {
          isPlaying = false;
          setPlayStatus("audio.play: " + (err && err.message ? err.message : err));
        });
      return;
    }
    narracionAudioEl.play().catch(function () {});
    return;
  }
  if (!synth) {
    setPlayStatus("play(): SpeechSynthesis no disponible en este navegador");
    return;
  }
  if (isPaused && synth) {
    // Priorizar resume real: en móvil a veces `speaking` no refleja bien el estado.
    if (synth.paused) {
      try {
        synth.resume();
      } catch (e) {
        // Ignorar
      }
      isPaused = false;
      updateCenterPlayVisibility();
      updateHighlightOnly();
      return;
    }
    if (synth.speaking) {
      try {
        synth.resume();
      } catch (e) {
        // Ignorar
      }
      isPaused = false;
      updateCenterPlayVisibility();
      updateHighlightOnly();
      return;
    }
    // Sin cola activa: volver a hablar la frase actual (no reiniciar al inicio).
    if (currentIndex < 0 || currentIndex >= sentences.length) {
      currentIndex = Math.max(0, Math.min(sentences.length - 1, currentIndex));
    }
    isPaused = false;
    isPlaying = true;
    try {
      speakCurrent();
    } catch (err) {
      setPlayStatus("play(): speakCurrent ERROR: " + (err && err.message ? err.message : err));
    }
    return;
  }

  // Si SpeechSynthesis se bloqueó en el primer intento (autoplay),
  // puede quedar `isPlaying=true` pero sin estar hablando ni en pausa.
  // En ese caso, al tocar “Iniciar lectura” debemos reintentar speakCurrent().
  const synthIsSpeaking = synth.speaking ? true : false;
  const synthIsPaused = synth.paused ? true : false;
  const shouldRetrySpeak = isPlaying && !synthIsSpeaking && !synthIsPaused;

  if (!isPlaying || shouldRetrySpeak) {
    if (currentIndex >= sentences.length || currentIndex < 0) currentIndex = 0;
    isPlaying = true;
    try {
      speakCurrent();
    } catch (err) {
      setPlayStatus("play(): speakCurrent ERROR: " + (err && err.message ? err.message : err));
    }
    return;
  }

  if (synthIsPaused) {
    synth.resume();
    isPaused = false;
    updateCenterPlayVisibility();
    updateHighlightOnly();
  }
}

function pause() {
  if (useRecordedNarration && narracionAudioEl) {
    try {
      narracionAudioEl.pause();
    } catch (e) {
      // Ignorar
    }
    isPaused = true;
    updateCenterPlayVisibility();
    updateHighlightOnly();
    setReadingUIVisible(true);
    hideStartButtons();
    return;
  }
  if (synth) {
    try {
      if (synth.speaking) synth.pause();
    } catch (e) {
      // Ignoramos errores de pause según el navegador.
    }
  }
  isPaused = true;
  updateCenterPlayVisibility();
  updateHighlightOnly();
  setReadingUIVisible(true);
  // No mostramos el botón de play grande; el usuario reanuda desde los controles.
  hideStartButtons();
}

function stop() {
  isPlaying = false;
  isPaused = false;
  if (useRecordedNarration && narracionAudioEl) {
    try {
      narracionAudioEl.pause();
      narracionAudioEl.currentTime = 0;
    } catch (e) {
      // Ignorar
    }
  } else if (synth) synth.cancel();
  updateCenterPlayVisibility();
  highlight(-1);
  updateHighlightOnly();
}

function stopNarrationOnLeave() {
  isPlaying = false;
  isPaused = false;
  if (useRecordedNarration && narracionAudioEl) {
    try {
      narracionAudioEl.pause();
    } catch (e) {
      // Ignorar
    }
  } else if (synth) synth.cancel();
  stopAllQuizPanelAudio();
  log("Narración detenida (cambio de página o salida)");
}

async function fetchStory(id) {
  const res = await fetch(`/api/stories/${id}`);
  if (!res.ok) throw new Error("No se pudo cargar el cuento");
  return await res.json();
}

function populateHeader(story) {
  const titleEl = document.getElementById("story-title");
  const descEl = document.getElementById("story-description");

  titleEl.textContent = story.titulo;
  descEl.textContent = story.descripcion || "";
  if (story.portada) {
    applyStoryCoverImage(story.portada);
  }
}

function isMobileOrTablet() {
  return window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function initVoices() {
  const voiceSelect = document.getElementById("voice-select");
  if (!voiceSelect) return;
  if (!window.speechSynthesis) {
    voiceSelect.innerHTML =
      '<option value="">Narrador del navegador no disponible</option>';
    return;
  }
  const voices = synth.getVoices();
  voiceSelect.innerHTML = '<option value="">Automática</option>';
  let defaultVoiceName = null;
  const preferPaulina = isMobileOrTablet();
  voices.forEach((v) => {
    const labelParts = [];
    if (/female|woman|frau|mujer/i.test(v.name)) labelParts.push("Voz femenina");
    else if (/male|man|herr|hombre/i.test(v.name)) labelParts.push("Voz masculina");
    else labelParts.push("Narrador neutro");
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${labelParts[0]} - ${v.name}`;
    voiceSelect.appendChild(opt);
    if (preferPaulina && /paulina/i.test(v.name)) {
      defaultVoiceName = v.name;
    }
    if (!defaultVoiceName && (/google.*español.*estados unidos|narrador neutro.*google español/i.test(v.name) ||
        /Google español de Estados Unidos/i.test(v.name))) {
      defaultVoiceName = v.name;
    }
  });
  if (defaultVoiceName) {
    voiceSelect.value = defaultVoiceName;
  }
}

function initRateControl() {
  const range = document.getElementById("rate-range");
  const label = document.getElementById("rate-label");
  const applyRate = () => {
    const v = parseFloat((range && range.value) || "1") || 1;
    if (label) label.textContent = `${v}x`;
    if (narracionAudioEl) {
      try {
        narracionAudioEl.playbackRate = v;
      } catch (e) {
        /* ignore */
      }
    }
  };
  if (range) range.addEventListener("input", applyRate);
  document.querySelectorAll(".story-speed-btn[data-rate]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const r = parseFloat(btn.getAttribute("data-rate"));
      if (range && !Number.isNaN(r)) range.value = String(r);
      document.querySelectorAll(".story-speed-btn[data-rate]").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      applyRate();
    });
  });
  applyRate();
}

function initAmbient() {
  const select = document.getElementById("ambient-select");
  const audio = document.getElementById("ambient-sound");
  if (!select || !audio) return; // panel reducido (solo voz/velocidad)

  select.addEventListener("change", () => {
    const value = select.value;
    audio.pause();
    audio.removeAttribute("src");
    if (!value) return;
    let src = "";
    if (value === "bosque") src = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_84d888fff0.mp3?filename=forest-birds-chirping-ambient-110243.mp3";
    if (value === "mar") src = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_e9465d9b02.mp3?filename=ocean-waves-110239.mp3";
    if (value === "noche") src = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_7c7cbeed52.mp3?filename=night-crickets-110246.mp3";
    if (src) {
      audio.src = src;
      audio.volume = 0.35;
      audio.play().catch(() => {});
    }
  });
}

function getFirstSentenceIndexForPage(pageIdx) {
  const indices = getSentenceIndicesOnPage(pageIdx);
  return indices.length > 0 ? indices[0] : 0;
}

function goPrev() {
  if (useRecordedNarration && narracionSyncData && narracionAudioEl) {
    const currentPage = getCurrentPageIndex();
    const prevPage = Math.max(0, currentPage - 1);
    const targetIdx = getFirstSentenceIndexForPage(prevPage);
    narracionAudioEl.currentTime = narracionStartSecForSentence(targetIdx);
    currentWordIndex = 0;
    currentIndex = targetIdx;
    highlight(targetIdx);
    if (isPlaying && !isPaused) {
      narracionAudioEl.play().catch(function () {});
    }
    return;
  }
  const currentPage = getCurrentPageIndex();
  const prevPage = Math.max(0, currentPage - 1);
  const targetIndex = getFirstSentenceIndexForPage(prevPage);
  if (isPlaying) {
    isPlaying = false;
    if (synth) synth.cancel();
  }
  currentWordIndex = 0;
  highlight(targetIndex);
}

function goNext() {
  if (useRecordedNarration && narracionSyncData && narracionAudioEl) {
    const currentPage = getCurrentPageIndex();
    const nextPage = currentPage + 1;
    if (nextPage >= pages.length) {
      isPlaying = false;
      isPaused = false;
      try {
        narracionAudioEl.pause();
      } catch (e) {
        // Ignorar
      }
      highlight(-1);
      showEndPanel();
      return;
    }
    const targetIdx = getFirstSentenceIndexForPage(nextPage);
    narracionAudioEl.currentTime = narracionStartSecForSentence(targetIdx);
    currentWordIndex = 0;
    currentIndex = targetIdx;
    highlight(targetIdx);
    if (isPlaying && !isPaused) {
      narracionAudioEl.play().catch(function () {});
    }
    return;
  }
  const currentPage = getCurrentPageIndex();
  const nextPage = currentPage + 1;
  if (nextPage >= pages.length) {
    if (sentences.length > 0) {
      if (isPlaying) {
        isPlaying = false;
        if (synth) synth.cancel();
      }
      highlight(-1);
      showEndPanel();
    }
    return;
  }
  if (isPlaying) {
    if (synth) synth.cancel();
  }
  currentWordIndex = 0;
  const targetIndex = getFirstSentenceIndexForPage(nextPage);
  highlight(targetIndex);
  // Solo seguir hablando si estaba reproduciendo y no en pausa (Silencio)
  if (isPlaying && !isPaused) {
    speakCurrent();
  }
}

function updatePauseButtonLabels() {
  const main = document.getElementById("btn-pause-main");
  const panel = document.getElementById("btn-pause");
  const icon = isPaused ? "▶" : "🔇";
  const labelText = isPaused ? "Reanudar" : "Silencio";
  if (main) {
    const iconEl = main.querySelector(".story-control-btn-icon");
    const labelEl = main.querySelector(".story-control-btn-label");
    if (iconEl) iconEl.textContent = icon;
    if (labelEl) labelEl.textContent = labelText;
    else main.textContent = icon + " " + labelText;
  }
  if (panel) panel.textContent = icon + " " + labelText;
}

function updateCenterPlayVisibility() {
  if (centerButtonUsed) return;
  var overlay = document.querySelector(".book-play-overlay");
  if (!overlay) return;
  if (isPlaying && !isPaused) {
    overlay.classList.add("book-play-overlay-hidden");
    overlay.style.pointerEvents = "none";
  } else {
    overlay.classList.remove("book-play-overlay-hidden");
    overlay.style.pointerEvents = "auto";
  }
}

function hideCenterPlayNow() {
  var overlay = document.querySelector(".book-play-overlay");
  if (overlay) {
    overlay.classList.add("book-play-overlay-hidden");
    overlay.style.pointerEvents = "none";
  }
}

function showCenterPlayNow() {
  if (centerButtonUsed) return;
  var overlay = document.querySelector(".book-play-overlay");
  if (overlay) {
    overlay.classList.remove("book-play-overlay-hidden");
    overlay.style.pointerEvents = "auto";
  }
}

function markCenterButtonUsed() {
  centerButtonUsed = true;
  hideCenterPlayNow();
}

let currentQuestionIndex = 0;
let quizPreguntas = [];
let quizUtterance = null;
let quizAudioEl = null;
/** Evita que suene audio del panel/cuestionario tras un clic (timeouts pendientes). */
let quizSpeakDelayTimer = null;

function clearQuizSpeakDelay() {
  if (quizSpeakDelayTimer != null) {
    clearTimeout(quizSpeakDelayTimer);
    quizSpeakDelayTimer = null;
  }
}

/** Detiene de inmediato MP3 de configuración, voz del cuestionario y anuncios del panel final. */
function stopAllQuizPanelAudio() {
  clearQuizSpeakDelay();
  try {
    if (quizAudioEl) {
      quizAudioEl.pause();
      quizAudioEl.currentTime = 0;
      quizAudioEl.onended = null;
      quizAudioEl.onerror = null;
      quizAudioEl.removeAttribute("src");
      quizAudioEl.load();
    }
  } catch (e) {
    // Ignorar
  }
  quizUtterance = null;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/** Mensajes al terminar el cuestionario: uno al azar, tono motivacional para niños (~20) */
const QUIZ_DONE_MESSAGES = [
  "¡Bravo! Has respondido todas las preguntas. Eres un explorador de cuentos muy valiente. ¡Sigue leyendo y soñando!",
  "¡Lo lograste! Cada respuesta que diste es una estrella en tu mente. ¡Estamos muy orgullosos de ti!",
  "¡Genial! Aprendes un poquito más cada día. Así se hace: curiosidad, esfuerzo y mucha imaginación.",
  "¡Fantástico! Has terminado el cuestionario como un campeón. Los cuentos te abren puertas a mundos increíbles.",
  "¡Muy bien! Tu cabeza brilla como un tesoro. Sigue así: leer y preguntar te hace más fuerte cada día.",
  "¡Increíble! Completaste todas las preguntas. Eso demuestra que prestaste atención y que te gusta aprender. ¡Eres genial!",
  "¡Felicitaciones! Eres un lector valiente. Cada cuento que escuchas y cada pregunta que respondes te hace crecer.",
  "¡Qué bien! Terminaste el cuestionario con todo tu esfuerzo. Recuerda: leer es un superpoder que llevas dentro.",
  "¡Sí se puede! Respondiste todo el cuestionario. Eres capaz de muchas cosas bonitas cuando te concentras.",
  "¡Enhorabuena! Has llegado al final de las preguntas. Sigue disfrutando los cuentos: son magia para el corazón y la mente.",
  "¡Eres una estrella! Cada pregunta superada es un pasito más hacia ser un gran lector. ¡Sigue así!",
  "¡Qué orgullo! Escuchaste con atención y lo demostraste con tus respuestas. Los cuentos te acompañan siempre.",
  "¡Brillante! Tu imaginación y tu esfuerzo hacen equipo. ¡El próximo cuento te espera con más aventuras!",
  "¡Campeón o campeona del cuento! Terminaste las preguntas con alegría. Eso también es aprender jugando.",
  "¡Tú puedes! Las historias te enseñan cosas sin que casi te des cuenta. ¡Sigue preguntando y descubriendo!",
  "¡Un aplauso para ti! Completar el cuestionario no es fácil, y tú lo lograste. ¡Eres muy capaz!",
  "¡Magia pura! Cuando lees y respondes, entrenas tu memoria y tu corazón. ¡Eres increíble!",
  "¡Súper! Las respuestas correctas importan, pero lo más bonito es que te hayas atrevido a intentarlo todo.",
  "¡Héroe o heroína de la lectura! Cada cuento te deja algo bueno. ¡Hoy te dejó una sonrisa y un ¡muy bien hecho!",
  "¡Dale una estrella a tu esfuerzo! Terminaste el cuestionario. El mundo de los cuentos siempre te abrirá la puerta.",
];

function speakQuizText(text, onEnd) {
  // Firma retrocompatible: speakQuizText(text, onEnd?, audioKey?)
  var cb = null;
  var audioKey = null;
  if (typeof onEnd === "function") cb = onEnd;
  if (arguments.length >= 3 && typeof arguments[2] === "string") audioKey = arguments[2];
  if (!text) return;

  function stopQuizAudio() {
    if (!quizAudioEl) return;
    try {
      quizAudioEl.pause();
      quizAudioEl.currentTime = 0;
      quizAudioEl.onended = null;
      quizAudioEl.onerror = null;
    } catch (e) {
      // Ignorar
    }
  }

  function narrationGenderForQuiz() {
    var g = detectGenderFromAudio(storyData && storyData.narracion_audio ? storyData.narracion_audio : "");
    return g || "hombre";
  }

  function tryPlayConfigAudio(key, onEnded) {
    var slug = jsSafeSlug(key);
    if (!slug) return false;
    var gender = narrationGenderForQuiz();
    var src = "/imagenes/configuracion/" + slug + gender + ".mp3";
    try {
      if (!quizAudioEl) {
        quizAudioEl = new Audio();
        quizAudioEl.preload = "auto";
      }
      stopQuizAudio();
      quizAudioEl.src = src;
      quizAudioEl.onended = function () {
        if (typeof onEnded === "function") onEnded();
      };
      quizAudioEl.onerror = function () {
        // Si falla este MP3, caemos a SpeechSynthesis.
        fallbackSpeak(text, onEnded);
      };
      quizAudioEl.play().catch(function () {
        fallbackSpeak(text, onEnded);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function fallbackSpeak(txt, onEnded) {
    if (!window.speechSynthesis || !txt) return;
    if (quizUtterance) window.speechSynthesis.cancel();
    const rate = parseFloat(document.getElementById("rate-range") && document.getElementById("rate-range").value || "1");
    const voiceSelect = document.getElementById("voice-select");
    const voiceId = voiceSelect ? voiceSelect.value : "";
    const utter = new SpeechSynthesisUtterance(txt);
    utter.rate = rate;
    utter.lang = "es-ES";
    if (voiceId && window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(function (v) { return v.name === voiceId || v.voiceURI === voiceId; });
      if (voice) utter.voice = voice;
    }
    if (typeof onEnded === "function") {
      utter.onend = onEnded;
    }
    quizUtterance = utter;
    window.speechSynthesis.speak(utter);
  }

  // Prioridad: MP3 generado en /imagenes/configuracion.
  if (audioKey && tryPlayConfigAudio(audioKey, cb)) return;
  fallbackSpeak(text, cb);
}

function speakQuestionAndOptions(questionText, opts, qIdx) {
  var parts = ["Pregunta. " + questionText];
  if (opts && opts.length) {
    opts.forEach(function (op, i) {
      parts.push("Opción " + (i + 1) + ": " + op);
    });
  }
  const baseSlug = jsSafeSlug(getBaseTitleForVoiceGrouping(storyData && storyData.titulo ? storyData.titulo : ""));
  const n = typeof qIdx === "number" ? qIdx + 1 : 1;
  const key = "config_" + baseSlug + "__q" + String(n).padStart(2, "0");
  speakQuizText(parts.join(". "), null, key);
}

function renderOneQuestion(container, q, qIdx, total) {
  if (!container) return;
  stopAllQuizPanelAudio();
  hideQuizActionsBar();
  container.innerHTML = "";
  const opts = q.opciones || [];
  const correcta = typeof q.correcta === "number" ? q.correcta : 0;
  const questionLabel = (qIdx + 1) + ". " + (q.p || q.pregunta || "");

  const card = document.createElement("div");
  card.className = "book-quiz-card";

  const title = document.createElement("h3");
  title.className = "text-lg font-bold text-purple-900";
  title.textContent = "¿Qué tal te fue?";
  card.appendChild(title);

  const listenBtn = document.createElement("button");
  listenBtn.type = "button";
  listenBtn.className = "quiz-listen-btn mt-1 mb-2";
  listenBtn.innerHTML = "🔊 Escuchar pregunta";
  listenBtn.setAttribute("aria-label", "Escuchar la pregunta en voz alta");
  listenBtn.addEventListener("click", function () {
    stopAllQuizPanelAudio();
    speakQuestionAndOptions(questionLabel, opts, qIdx);
  });
  card.appendChild(listenBtn);

  const questionTextEl = document.createElement("p");
  questionTextEl.className = "book-quiz-question-text font-semibold text-purple-900";
  questionTextEl.textContent = questionLabel;
  card.appendChild(questionTextEl);

  var mensajesBien = [
    "¡Muy bien hecho!",
    "¡Excelente!",
    "¡Genial!",
    "¡Así se hace!",
    "¡Perfecto!",
    "¡Fenomenal!",
    "¡Qué bien!",
    "¡Lo lograste!",
    "¡Muy buen trabajo!",
    "¡Increíble!"
  ];

  const wrap = document.createElement("div");
  wrap.className = "quiz-options-wrap";
  const optionButtons = [];
  opts.forEach(function (op, i) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    if (i === correcta) btn.classList.add("quiz-option-correct-hint");
    btn.textContent = op;
    btn.dataset.index = String(i);
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      stopAllQuizPanelAudio();
      optionButtons.forEach(function (b, idx) {
        b.disabled = true;
        b.classList.remove("quiz-option-correct-hint");
        if (idx === correcta) b.classList.add("quiz-option-correct");
        else b.classList.add("quiz-option-wrong");
      });
      const isCorrect = i === correcta;
      if (isCorrect) {
        feedbackEl.textContent = mensajesBien[Math.floor(Math.random() * mensajesBien.length)];
        feedbackEl.className = "mt-2 text-base font-bold text-green-700";
      } else {
        feedbackEl.textContent = "La respuesta correcta era: " + (opts[correcta] || "");
        feedbackEl.className = "mt-2 text-base font-semibold text-amber-800";
      }
      setTimeout(function () {
        if (currentQuestionIndex + 1 < quizPreguntas.length) {
          currentQuestionIndex += 1;
          renderOneQuestion(container, quizPreguntas[currentQuestionIndex], currentQuestionIndex, quizPreguntas.length);
        } else {
          showQuizDone(container);
        }
      }, 1600);
    });
    wrap.appendChild(btn);
    optionButtons.push(btn);
  });
  card.appendChild(wrap);

  const feedbackEl = document.createElement("p");
  feedbackEl.className = "mt-3 text-sm";
  feedbackEl.setAttribute("aria-live", "polite");
  card.appendChild(feedbackEl);

  container.appendChild(card);

  speakQuestionAndOptions(questionLabel, opts, qIdx);
}

function hideQuizActionsBar() {
  const el = document.getElementById("book-quiz-actions");
  if (el) {
    el.innerHTML = "";
    el.classList.add("hidden");
  }
  const overlay = document.getElementById("book-quiz-overlay");
  if (overlay) overlay.classList.remove("book-quiz-overlay--motivational");
}

async function goToRandomStory() {
  stopNarrationOnLeave();
  try {
    const res = await fetch("/api/stories/");
    if (!res.ok) {
      window.location.href = "/";
      return;
    }
    const stories = await res.json();
    if (!stories || stories.length === 0) {
      window.location.href = "/";
      return;
    }
    const currentId = storyData && storyData.id;
    const others = currentId
      ? stories.filter(function (s) { return s.id !== currentId; })
      : stories;
    const list = others.length ? others : stories;
    const pick = list[Math.floor(Math.random() * list.length)];
    if (pick && pick.id) {
      window.location.href = "/cuento/" + pick.id;
      return;
    }
    window.location.href = "/";
  } catch {
    window.location.href = "/";
  }
}

function showQuizDone(container) {
  if (!container) return;
  stopAllQuizPanelAudio();
  container.innerHTML = "";
  const actionsClear = document.getElementById("book-quiz-actions");
  if (actionsClear) {
    actionsClear.innerHTML = "";
    actionsClear.classList.remove("hidden");
  }
  const doneIdx = Math.floor(Math.random() * QUIZ_DONE_MESSAGES.length);
  const motivational = QUIZ_DONE_MESSAGES[doneIdx];

  const card = document.createElement("div");
  card.className = "book-quiz-card book-quiz-card--done text-center";
  const p = document.createElement("p");
  p.className = "text-purple-900/95 text-base sm:text-lg font-semibold leading-relaxed";
  p.textContent = motivational;
  card.appendChild(p);
  container.appendChild(card);

  const actionsEl = document.getElementById("book-quiz-actions");
  if (actionsEl) {
    actionsEl.innerHTML = "";
    actionsEl.classList.remove("hidden");
    const btnOtro = document.createElement("button");
    btnOtro.type = "button";
    btnOtro.className = "book-quiz-btn book-quiz-btn-yes book-quiz-btn-leer-otro";
    btnOtro.textContent = "OTRO CUENTO AL AZAR";
    btnOtro.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      stopAllQuizPanelAudio();
      await goToRandomStory();
    });
    actionsEl.appendChild(btnOtro);
  }

  clearQuizSpeakDelay();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  quizSpeakDelayTimer = window.setTimeout(function () {
    quizSpeakDelayTimer = null;
    const key = "config_quiz_done_" + String(doneIdx + 1).padStart(2, "0");
    speakQuizText(motivational, null, key);
  }, 350);

  const overlay = document.getElementById("book-quiz-overlay");
  if (overlay) overlay.classList.add("book-quiz-overlay--motivational");
}

function showEndPanel() {
  const overlay = document.getElementById("book-quiz-overlay");
  const body = document.getElementById("book-quiz-body");
  const actionsEl = document.getElementById("book-quiz-actions");
  if (!overlay || !body) return;

  stopAllQuizPanelAudio();

  overlay.classList.remove("book-quiz-overlay--motivational");

  quizPreguntas = (storyData && storyData.preguntas && Array.isArray(storyData.preguntas)) ? storyData.preguntas : [];
  currentQuestionIndex = 0;

  body.innerHTML = "";
  if (actionsEl) {
    actionsEl.innerHTML = "";
    actionsEl.classList.remove("hidden");
  }

  const card = document.createElement("div");
  card.className = "book-quiz-card text-center";
  const title = document.createElement("h3");
  title.className = "text-lg font-bold text-purple-900 mb-2";
  title.textContent = "¡Has llegado al final del cuento!";
  card.appendChild(title);
  const p = document.createElement("p");
  p.className = "text-purple-800/90 text-base mb-4";
  if (quizPreguntas.length > 0) {
    p.textContent = "¿Quieres responder algunas preguntas sobre la historia o prefieres escuchar otro cuento?";
  } else {
    p.textContent = "¿Quieres escuchar otro cuento?";
  }
  card.appendChild(p);

  // Solo el botón SI dentro de la caja (si hay preguntas)
  if (quizPreguntas.length > 0) {
    const buttonsWrap = document.createElement("div");
    buttonsWrap.className = "flex flex-col gap-3 mt-1 justify-center items-center";
    const btnQuiz = document.createElement("button");
    btnQuiz.type = "button";
    btnQuiz.className = "book-quiz-btn book-quiz-btn-restart book-quiz-btn-yes";
    btnQuiz.textContent = "SI";
    btnQuiz.addEventListener("click", function () {
      stopAllQuizPanelAudio();
      renderOneQuestion(body, quizPreguntas[0], 0, quizPreguntas.length);
    });
    buttonsWrap.appendChild(btnQuiz);
    card.appendChild(buttonsWrap);
  }

  body.appendChild(card);

  // OTRO CUENTO y Leer mismo: fuera de la caja
  if (actionsEl) {
    const btnAnother = document.createElement("button");
    btnAnother.type = "button";
    btnAnother.className = "book-quiz-btn book-quiz-btn-another";
    btnAnother.textContent = "OTRO CUENTO AL AZAR";
    btnAnother.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      stopAllQuizPanelAudio();
      await goToRandomStory();
    });
    actionsEl.appendChild(btnAnother);

    const btnSameAgain = document.createElement("button");
    btnSameAgain.type = "button";
    btnSameAgain.className = "book-quiz-btn book-quiz-btn-same-again";
    btnSameAgain.textContent = "Leer mismo cuento nuevamente";
    btnSameAgain.addEventListener("click", function () {
      stopAllQuizPanelAudio();
      hideEndPanel();
      restartStory();
    });
    actionsEl.appendChild(btnSameAgain);

    // Metadatos del cuento (título + autor) en la pantalla final.
    const cuentoNombre = stripV2VoiceTitle(storyData && storyData.titulo ? storyData.titulo : storyTitle);
    if (cuentoNombre) {
      const meta = document.createElement("div");
      meta.className = "book-end-meta";

      const cuentoLink = document.createElement("a");
      cuentoLink.href = "https://www.google.com/search?q=" + encodeURIComponent(cuentoNombre);
      cuentoLink.target = "_blank";
      cuentoLink.rel = "noopener noreferrer";
      cuentoLink.textContent = cuentoNombre;
      meta.appendChild(cuentoLink);

      const authorEl = document.createElement("div");
      const authorPrefix = document.createElement("span");
      authorPrefix.textContent = "Autor: ";
      authorEl.appendChild(authorPrefix);
      const authorLink = document.createElement("a");
      const authorName = (storyData && storyData.autor ? String(storyData.autor) : "").trim() || "Autor desconocido";
      authorLink.href = "https://www.google.com/search?q=" + encodeURIComponent(authorName);
      authorLink.target = "_blank";
      authorLink.rel = "noopener noreferrer";
      authorLink.textContent = authorName;
      authorEl.appendChild(authorLink);

      meta.appendChild(authorEl);
      const portada = (storyData && storyData.portada ? String(storyData.portada) : "").trim();
      if (portada) {
        const coverWrap = document.createElement("div");
        coverWrap.className = "book-end-cover-wrap";
        const coverImg = document.createElement("img");
        coverImg.src = portada;
        coverImg.alt = "Portada del cuento";
        coverImg.loading = "lazy";
        coverImg.decoding = "async";
        coverImg.className = "book-end-cover-img";
        coverWrap.appendChild(coverImg);
        meta.appendChild(coverWrap);
      }

      actionsEl.appendChild(meta);
    }
  }

  overlay.classList.remove("hidden");
  document.body.classList.add("story-end-panel-open");

  const announce =
    "¡Has llegado al final del cuento! " +
    (quizPreguntas.length > 0
      ? "¿Quieres responder algunas preguntas sobre la historia o prefieres escuchar otro cuento?"
      : "¿Quieres escuchar otro cuento?");
  // Retraso: en móvil, al terminar el último utterance a veces hay un "ghost click"
  // que activaba el enlace del logo (/) antes de que el usuario tocara nada.
  clearQuizSpeakDelay();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  quizSpeakDelayTimer = window.setTimeout(function () {
    quizSpeakDelayTimer = null;
    const key = quizPreguntas.length > 0 ? "config_endpanel_con_preguntas" : "config_endpanel_sin_preguntas";
    speakQuizText(announce, null, key);
  }, 400);
}

function hideEndPanel() {
  stopAllQuizPanelAudio();
  document.body.classList.remove("story-end-panel-open");
  hideQuizActionsBar();
  const overlay = document.getElementById("book-quiz-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function restartStory() {
  hideEndPanel();
  currentIndex = 0;
  renderCurrentPage(false);
  updateSceneImageForIndex(0);
  highlight(0);
  updatePauseButtonLabels();
  if (isMobileOrTablet()) scrollToCuentoInicio();
  isPlaying = true;
  isPaused = false;
  if (useRecordedNarration && narracionAudioEl) {
    try {
      narracionAudioEl.pause();
      narracionAudioEl.currentTime = 0;
    } catch (e) {
      // Ignorar
    }
    narracionAudioEl.play().catch(function () {});
    return;
  }
  speakCurrent();
}

function scrollToCuentoInicio() {
  const el = document.getElementById("cuento-inicio");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handlePlayClick(e) {
  const now = Date.now();
  const type = e && e.type ? e.type : "";
  // En móvil, al tener `onclick/ontouchend` en el HTML + listeners en JS,
  // suele dispararse `handlePlayClick` 2-3 veces seguidas (touchend + click).
  // Como `speakCurrent()` hace `synth.cancel()`, esas llamadas duplicadas evitan que arranque.
  // Así que ignoramos taps duplicados muy rápidos.
  if (now - lastHandlePlayClickAt < 650) {
    if (type === "click" && lastHandlePlayClickType === "touchend") return;
    // También ignoramos duplicados genéricos en ventana corta.
    return;
  }
  lastHandlePlayClickAt = now;
  lastHandlePlayClickType = type;

  if (e) {
    // En móviles, `preventDefault()` en `touchend` puede interferir con el
    // "user gesture" necesario para SpeechSynthesis. Solo cortamos propagación.
    e.stopPropagation();
  }
  log("handlePlayClick (botón central)");
  uiDebug(
    "handlePlayClick type=" + (e && e.type ? e.type : "") + " target=" + (e && e.target ? e.target.id : "")
  );
  setPlayStatus(
    "Tap: type=" +
      (e && e.type ? e.type : "click") +
      " | sentences=" +
      sentences.length
  );
  if (!sentences.length) {
    setPlayStatus("No hay texto todavía (sentences=0)");
    return;
  }
  const btn = e && e.currentTarget ? e.currentTarget : null;
  if (btn && btn.disabled) btn.disabled = false;

  // Evita scroll suave que a veces puede afectar la "user gesture"
  // necesaria en algunos móviles para SpeechSynthesis.
  if (isMobileOrTablet() && btn && btn.id === "btn-play-cover") {
    scrollToCuentoInicio();
  }
  play();
  updatePauseButtonLabels();
}

function handlePauseResumeClick() {
  log("handlePauseResumeClick. isPaused=" + isPaused);
  uiDebug("handlePauseResumeClick isPaused=" + isPaused);
  if (useRecordedNarration && narracionAudioEl) {
    const ap = narracionAudioEl.paused;
    if (isPaused || ap) {
      isPaused = false;
      play();
    } else {
      pause();
      isPaused = true;
    }
    updatePauseButtonLabels();
    return;
  }
  const synthPaused = synth && synth.paused;
  const shouldResume = isPaused || synthPaused;

  if (shouldResume) {
    isPaused = false;
    play();
  } else {
    pause();
    // Algunos móviles no actualizan `synth.speaking/synth.paused` de forma consistente.
    // Forzamos el estado para que el próximo tap reanude.
    isPaused = true;
  }
  updatePauseButtonLabels();
}

function initControls() {
  const playCoverBtn = document.getElementById("btn-play-cover");
  const startPlayBtn = document.getElementById("btn-start-play");
  const startBtn = document.getElementById("btn-start-reading");
  const btnPause = document.getElementById("btn-pause");
  const btnPauseMain = document.getElementById("btn-pause-main");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  log(
    "initControls: playCover=" + !!playCoverBtn + ", startBtn=" + !!startBtn + ", btn-pause=" + !!btnPause + ", btn-pause-main=" + !!btnPauseMain + ", prev=" + !!btnPrev + ", next=" + !!btnNext
  );
  uiDebug("initControls bound");

  function bindStartButtons(btn) {
    if (!btn) return;
    btn.addEventListener("click", handlePlayClick);
    // En móvil, el `touchend` suele mantener mejor el "user gesture".
    btn.addEventListener(
      "touchend",
      function (e) {
        handlePlayClick(e);
      },
      { passive: true }
    );
  }

  bindStartButtons(playCoverBtn);
  bindStartButtons(startPlayBtn);
  bindStartButtons(startBtn);
  if (btnPause) btnPause.addEventListener("click", handlePauseResumeClick);
  if (btnPauseMain) btnPauseMain.addEventListener("click", handlePauseResumeClick);
  if (btnPrev) btnPrev.addEventListener("click", goPrev);
  if (btnNext) btnNext.addEventListener("click", goNext);
  const btnStop = document.getElementById("btn-stop");
  if (btnStop) btnStop.addEventListener("click", () => {
    repeatOnEnd = false;
    const rep = document.getElementById("btn-repeat");
    if (rep) rep.classList.remove("ring-2", "ring-offset-2");
    stop();
    updatePauseButtonLabels();
  });
  const btnRepeat = document.getElementById("btn-repeat");
  if (btnRepeat) btnRepeat.addEventListener("click", () => {
    repeatOnEnd = !repeatOnEnd;
    const btn = document.getElementById("btn-repeat");
    if (btn) {
      if (repeatOnEnd) btn.classList.add("ring-2", "ring-offset-2", "ring-sky-200");
      else btn.classList.remove("ring-2", "ring-offset-2", "ring-sky-200");
    }
  });

  const cfgToggle = document.getElementById("config-toggle");
  const cfgPanel = document.getElementById("config-panel");
  const btnSave = document.getElementById("btn-save-config");

  function openConfigModal() {
    wasPlayingBeforeConfig = isPlaying && !isPaused;
    if (useRecordedNarration && narracionAudioEl && !narracionAudioEl.paused) {
      try {
        narracionAudioEl.pause();
      } catch (e) {
        // Ignorar
      }
      isPaused = true;
    } else if (wasPlayingBeforeConfig && synth && synth.speaking && !synth.paused) {
      pause();
    }
    cfgPanel.classList.remove("hidden");
  }

  function closeConfigModal() {
    cfgPanel.classList.add("hidden");
    if (wasPlayingBeforeConfig) {
      if (useRecordedNarration && narracionAudioEl) {
        isPaused = false;
        narracionAudioEl.play().catch(function () {});
        updateHighlightOnly();
      } else if (synth && synth.speaking && synth.paused) {
        synth.resume();
        isPaused = false;
        updateHighlightOnly();
      }
    }
    wasPlayingBeforeConfig = false;
  }

  if (cfgToggle && cfgPanel) {
    cfgToggle.addEventListener("click", () => {
      const isHidden = cfgPanel.classList.contains("hidden");
      if (isHidden) openConfigModal();
      else closeConfigModal();
    });

    cfgPanel.addEventListener("click", (e) => {
      if (e.target === cfgPanel) closeConfigModal();
    });
  }

  if (btnSave && cfgPanel) {
    btnSave.addEventListener("click", async function () {
      // Si la narración del cuento es pregrabada, la voz Hombre/Mujer
      // se resuelve cargando el cuento v2 correspondiente.
      const narrVoiceSel = document.getElementById("narration-voice-select");
      if (useRecordedNarration && narrVoiceSel && !narrVoiceSel.disabled) {
        const desired = narrVoiceSel.value;
        const currentGender = detectGenderFromAudio(storyData && storyData.narracion_audio ? storyData.narracion_audio : "") || "hombre";
        if (desired && desired !== currentGender) {
          await goToV2NarrationGender(desired);
          return;
        }
      }
      closeConfigModal();
    });
  }
  const btnAnother = document.getElementById("btn-another-story");
  if (btnAnother) {
    btnAnother.addEventListener("click", function () {
      stopNarrationOnLeave();
    });
  }

  log("initControls terminado");
}

async function initPage() {
  const storyId = typeof window.STORY_ID !== "undefined" ? window.STORY_ID : null;
  log("initPage: storyId=" + storyId);
  uiDebug("initPage start storyId=" + storyId);

  // Evita clicks antes de que el cuento esté cargado (sentences.length=0).
  const coverBtn = document.getElementById("btn-play-cover");
  const startPlayBtn = document.getElementById("btn-start-play");
  const startBtn = document.getElementById("btn-start-reading");
  if (coverBtn) coverBtn.disabled = true;
  if (startPlayBtn) startPlayBtn.disabled = true;
  if (startBtn) startBtn.disabled = true;

  try {
    if (storyId == null) throw new Error("No hay STORY_ID en la página");
    storyData = await fetchStory(storyId);
    log("Cuento cargado:", storyData.titulo, "escenas:", storyData.escenas ? storyData.escenas.length : 0);
    uiDebug("fetchStory OK titulo=" + (storyData && storyData.titulo ? storyData.titulo : ""));
    storyTitle = storyData && storyData.titulo ? storyData.titulo : "";
    populateHeader(storyData);

    useRecordedNarration = false;
    narracionSyncData = null;
    narracionTimeUpdateAttached = false;
    narracionAudioEl = document.getElementById("story-narration");
    const na = storyData.narracion_audio && String(storyData.narracion_audio).trim();
    const ns = storyData.narracion_sync && String(storyData.narracion_sync).trim();
    if (na && ns && narracionAudioEl) {
      try {
        const syncUrl = normalizeMediaUrl(ns);
        const syncRes = await fetch(syncUrl);
        if (!syncRes.ok) {
          log("narracion_sync: HTTP", syncRes.status, syncUrl);
          uiDebug("narracion_sync no cargó (" + syncRes.status + "): " + syncUrl);
        }
        if (syncRes.ok) {
          const syncJson = await syncRes.json();
          const nEscenas = (storyData.escenas && storyData.escenas.length) || 0;
          const segments = syncJson && syncJson.segments;
          const paras = syncJson && syncJson.paragraphs;
          let ok = false;
          if (segments && Array.isArray(segments) && segments.length > 0 && nEscenas > 0) {
            const maxScene = segments.reduce(function (m, s) {
              return Math.max(m, segmentSceneIndex(s));
            }, 0);
            ok = maxScene === nEscenas - 1;
            if (!ok) {
              log("narracion_sync: sceneIndex no coincide con escenas (max", maxScene, "vs", nEscenas - 1, ")");
              uiDebug(
                "MP3 desactivado: sync tiene max escena " +
                  maxScene +
                  " pero el cuento tiene " +
                  nEscenas +
                  " escenas. Recarga cuentos en la BD o revisa el JSON."
              );
            }
          } else if (paras && Array.isArray(paras) && paras.length === nEscenas && nEscenas > 0) {
            ok = true;
          }
          if (ok) {
            narracionSyncData = syncJson;
            narracionAudioEl.src = normalizeMediaUrl(na);
            narracionAudioEl.preload = "auto";
            useRecordedNarration = true;
            ensureNarracionListeners();
            log("Narración grabada activa:", na, segments ? "(" + segments.length + " segmentos)" : "");
            uiDebug("Narración MP3 activa: " + na);
          } else if (!segments || !segments.length) {
            log("narracion_sync: sin segments válidos ni paragraphs=", nEscenas);
          }
        }
      } catch (err) {
        log("Error cargando narracion_sync:", err);
      }
    }

    buildSentencesAndPages(storyData, useRecordedNarration);
    renderCurrentPage(false);
    updateSceneImageForIndex(0);
    scheduleCenterMobileStoryCover();
    log("initPage OK. Frases totales:", sentences.length);
    uiDebug("initPage OK sentences=" + sentences.length);

    if (coverBtn) coverBtn.disabled = false;
    if (startPlayBtn) startPlayBtn.disabled = false;
    if (startBtn) startBtn.disabled = false;
    // Mostramos overlay de "play" y mantenemos la hoja en pausa.
    setKaraokeBoxVisible(false);
    setReadingUIVisible(false);
    const overlayTitle = document.getElementById("overlay-story-title");
    if (overlayTitle) overlayTitle.textContent = storyData && storyData.titulo ? storyData.titulo : "";
    // Botones Hombre/Mujer (solo si el cuento tiene MP3 pregrabado correspondiente).
    setupVoiceChoiceOverlay(storyData, useRecordedNarration).catch(function () {});
    setupNarrationVoiceSelect(storyData, useRecordedNarration).catch(function () {});
    hideStartButtons();
  } catch (e) {
    log("initPage ERROR:", e.message || e);
    uiDebug("initPage ERROR: " + (e && e.message ? e.message : e));
    const container = document.getElementById("karaoke-container");
    if (container) {
      container.textContent = "No se pudo cargar el cuento.";
    }
    setKaraokeBoxVisible(false);
    setReadingUIVisible(false);
    hideStartButtons();
  }

  initVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = initVoices;
  }
  initRateControl();
  initAmbient();
  initControls();

  let resizeCoverTimer = null;
  function onResizeCoverLayout() {
    clearTimeout(resizeCoverTimer);
    resizeCoverTimer = setTimeout(function () {
      scheduleCenterMobileStoryCover();
      updateHighlightOnly();
    }, 80);
  }
  window.addEventListener("resize", onResizeCoverLayout);
  window.addEventListener("orientationchange", scheduleCenterMobileStoryCover);

  if (isMobileOrTablet()) {
    if (!window.location.hash || window.location.hash !== "#cuento-inicio") {
      window.location.hash = "cuento-inicio";
    }
    setTimeout(function () {
      scrollToCuentoInicio();
    }, 400);
  }

  window.addEventListener("pagehide", stopNarrationOnLeave);
  window.addEventListener("beforeunload", stopNarrationOnLeave);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stopNarrationOnLeave();
  });

}

function bootstrapStoryPage() {
  syncCoverSlot();
  clearCoverFrameInlineStyles();
  initPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapStoryPage);
} else {
  bootstrapStoryPage();
}

