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
function setPlayStatus(msg) {
  const el = document.getElementById("play-status");
  if (el) el.textContent = msg;
}

function hideStartButtons() {
  const cover = document.getElementById("btn-play-cover");
  const startPlay = document.getElementById("btn-start-play");
  const start = document.getElementById("btn-start-reading");
  [cover, startPlay, start].forEach((btn) => {
    if (btn) btn.classList.add("hidden");
  });
}

function showStartButtons() {
  const cover = document.getElementById("btn-play-cover");
  const startPlay = document.getElementById("btn-start-play");
  const start = document.getElementById("btn-start-reading");
  [cover, startPlay, start].forEach((btn) => {
    if (btn) btn.classList.remove("hidden");
  });
}

function splitSentences(text) {
  return text
    .split(/(?<=[\.\!\?])\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildSentencesAndPages(story) {
  sentences = [];
  sceneForSentence = [];
  pages = [];
  pageForSentence = [];
  if (!story || !story.escenas || !story.escenas.length) {
    log("buildSentencesAndPages: no hay escenas", story);
    return;
  }
  const numEscenas = story.escenas.length;
  for (let start = 0; start < numEscenas; start += ESTROFAS_PER_PAGE) {
    const pageEscenas = [];
    for (let i = 0; i < ESTROFAS_PER_PAGE && start + i < numEscenas; i++) {
      pageEscenas.push(start + i);
    }
    pages.push(pageEscenas);
  }
  story.escenas.forEach((escena, idxEscena) => {
    const sceneSentences = splitSentences(escena.texto);
    const pageIdx = Math.floor(idxEscena / ESTROFAS_PER_PAGE);
    sceneSentences.forEach((sentence) => {
      sentences.push({ text: sentence, sceneIndex: idxEscena });
      sceneForSentence.push(idxEscena);
      pageForSentence.push(pageIdx);
    });
  });

  log("buildSentencesAndPages: frases=" + sentences.length + ", páginas=" + pages.length);
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
        const sceneSentences = splitSentences(texto);
        let localSentenceIndex = 0;
        sceneSentences.forEach((s) => {
          const globalIdx = sentenceIndicesOnPage[localSentenceIndex];
          const isCurrentSentence = currentIndex === globalIdx;
          const sentenceWrap = document.createElement("span");
          sentenceWrap.className = "karaoke-sentence";
          sentenceWrap.setAttribute("data-sentence-index", String(localSentenceIndex));
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

function updateHighlightOnly() {
  const container = document.getElementById("karaoke-container");
  if (!container) return;

  container.querySelectorAll(".karaoke-sentence").forEach((el) => el.classList.remove("current"));
  container.querySelectorAll(".karaoke-word").forEach((el) => el.classList.remove("current"));
  container.querySelectorAll(".karaoke-strofa").forEach((block) => block.classList.remove("current"));

  const active = isPlaying && !isPaused;
  if (active) document.body.classList.add("story-reading-active");
  else document.body.classList.remove("story-reading-active");

  if (!active) return;

  const pageIdx = getCurrentPageIndex();
  const sentenceIndicesOnPage = getSentenceIndicesOnPage(pageIdx);
  const localSentenceIndex = sentenceIndicesOnPage.indexOf(currentIndex);
  const currentSentenceEl = container.querySelector(".karaoke-sentence[data-sentence-index=\"" + localSentenceIndex + "\"]");
  if (currentSentenceEl) currentSentenceEl.classList.add("current");

  const sceneIdx = currentIndex >= 0 && currentIndex < sentences.length ? sceneForSentence[currentIndex] : -1;
  const currentBlock = sceneIdx >= 0 ? container.querySelector(".karaoke-strofa[data-scene-index=\"" + sceneIdx + "\"]") : null;
  if (currentBlock) currentBlock.classList.add("current");
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

function updateSceneImageForIndex(index) {
  if (!storyData || !storyData.escenas || index < 0) return;
  const sceneIdx = sceneForSentence[index];
  const escena = storyData.escenas[sceneIdx];
  const coverEl = document.getElementById("story-cover");
  if (!coverEl) return;
  if (escena && escena.imagen) {
    coverEl.style.backgroundImage = `url('${escena.imagen}')`;
    coverEl.style.backgroundSize = "contain";
    coverEl.style.backgroundPosition = "center";
  } else if (storyData.portada) {
    coverEl.style.backgroundImage = `url('${storyData.portada}')`;
    coverEl.style.backgroundSize = "contain";
    coverEl.style.backgroundPosition = "center";
  }
}

function speakCurrent() {
  if (!sentences.length || currentIndex < 0 || currentIndex >= sentences.length) return;
  if (!synth) return;

  // Limpia cualquier cola anterior para que en móvil no se "pierda" el user gesture.
  synth.cancel();
  currentUtterance = null;

  const rate = parseFloat(document.getElementById("rate-range").value || "1");
  const voiceSelect = document.getElementById("voice-select");
  const voiceId = voiceSelect.value;

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
    hideStartButtons();
    highlight(currentIndex);
  };

  utter.onboundary = (event) => {
    if (event.name === "word" && typeof event.charIndex !== "undefined") {
      const wordIdx = getWordIndexFromCharIndex(sentenceText, event.charIndex);
      highlightKaraokeWord(wordIdx);
    }
  };

  utter.onend = () => {
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
    setPlayStatus("speak() rate=" + rate + " idx=" + currentIndex);
    synth.speak(utter);
  } catch (err) {
    setPlayStatus("speak() ERROR: " + (err && err.message ? err.message : err));
    throw err;
  }
}

function play() {
  log("play() llamada. sentences.length=" + sentences.length + ", isPaused=" + isPaused + ", isPlaying=" + isPlaying);
  if (!sentences.length) {
    log("play() NO hace nada: no hay frases (¿cargó el cuento?)");
    return;
  }
  if (isPaused && synth) {
    isPaused = false;
    if (synth.speaking && synth.paused) {
      synth.resume();
      updateCenterPlayVisibility();
      updateHighlightOnly();
      return;
    }
    if (currentIndex >= sentences.length || currentIndex < 0) currentIndex = 0;
    isPlaying = true;
    speakCurrent();
    return;
  }
  if (!isPlaying) {
    if (currentIndex >= sentences.length || currentIndex < 0) {
      currentIndex = 0;
    }
    isPlaying = true;
    speakCurrent();
  } else if (synth && synth.paused) {
    synth.resume();
    isPaused = false;
    updateCenterPlayVisibility();
    updateHighlightOnly();
  }
}

function pause() {
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
}

function stop() {
  isPlaying = false;
  isPaused = false;
  if (synth) synth.cancel();
  updateCenterPlayVisibility();
  highlight(-1);
  updateHighlightOnly();
}

function stopNarrationOnLeave() {
  isPlaying = false;
  isPaused = false;
  if (synth) synth.cancel();
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
  const coverEl = document.getElementById("story-cover");

  titleEl.textContent = story.titulo;
  descEl.textContent = story.descripcion || "";
  if (story.portada) {
    coverEl.style.backgroundImage = `url('${story.portada}')`;
    coverEl.style.backgroundSize = "cover";
    coverEl.style.backgroundPosition = "center";
  }
}

function isMobileOrTablet() {
  return window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function initVoices() {
  const voiceSelect = document.getElementById("voice-select");
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
  const update = () => {
    label.textContent = `${range.value}x`;
  };
  range.addEventListener("input", update);
  update();
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

function speakQuizText(text, onEnd) {
  if (!window.speechSynthesis || !text) return;
  if (quizUtterance) window.speechSynthesis.cancel();
  const rate = parseFloat(document.getElementById("rate-range") && document.getElementById("rate-range").value || "1");
  const voiceSelect = document.getElementById("voice-select");
  const voiceId = voiceSelect ? voiceSelect.value : "";
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.lang = "es-ES";
  if (voiceId && window.speechSynthesis.getVoices) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(function (v) { return v.name === voiceId || v.voiceURI === voiceId; });
    if (voice) utter.voice = voice;
  }
  if (typeof onEnd === "function") {
    utter.onend = onEnd;
  }
  quizUtterance = utter;
  window.speechSynthesis.speak(utter);
}

function speakQuestionAndOptions(questionText, opts) {
  var parts = ["Pregunta. " + questionText];
  if (opts && opts.length) {
    opts.forEach(function (op, i) {
      parts.push("Opción " + (i + 1) + ": " + op);
    });
  }
  speakQuizText(parts.join(". "));
}

function renderOneQuestion(container, q, qIdx, total) {
  if (!container) return;
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
    speakQuestionAndOptions(questionLabel, opts);
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
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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

  speakQuestionAndOptions(questionLabel, opts);
}

function showQuizDone(container) {
  if (!container) return;
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "book-quiz-card";
  const title = document.createElement("h3");
  title.className = "text-lg font-bold text-purple-900 mb-2";
  title.textContent = "¿Qué tal te fue?";
  card.appendChild(title);
  const p = document.createElement("p");
  p.className = "text-purple-800/90 text-base mb-4";
  p.textContent = "Has terminado las preguntas. Puedes reanudar el cuento o leer otro.";
  card.appendChild(p);

  const buttonsWrap = document.createElement("div");
  buttonsWrap.className = "flex flex-col sm:flex-row gap-3 justify-center items-center";

  const btnReanudar = document.createElement("button");
  btnReanudar.type = "button";
  btnReanudar.className = "book-quiz-btn book-quiz-btn-restart";
  btnReanudar.textContent = "Reanudar el cuento";
  btnReanudar.addEventListener("click", function () {
    hideEndPanel();
    restartStory();
  });
  buttonsWrap.appendChild(btnReanudar);

  const btnOtro = document.createElement("button");
  btnOtro.type = "button";
  btnOtro.className = "book-quiz-btn book-quiz-btn-another";
  btnOtro.textContent = "Leer otro cuento";
  btnOtro.addEventListener("click", async function () {
    try {
      const res = await fetch("/api/stories/");
      if (!res.ok) return;
      const stories = await res.json();
      if (!stories || stories.length === 0) {
        window.location.href = "/";
        return;
      }
      const currentId = storyData && storyData.id;
      const otras = currentId ? stories.filter(function (s) { return s.id !== currentId; }) : stories;
      const list = otras.length ? otras : stories;
      const pick = list[Math.floor(Math.random() * list.length)];
      if (pick && pick.id) {
        stopNarrationOnLeave();
        window.location.href = "/cuento/" + pick.id;
      } else {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  });
  buttonsWrap.appendChild(btnOtro);

  card.appendChild(buttonsWrap);
  container.appendChild(card);
}

function showEndPanel() {
  const overlay = document.getElementById("book-quiz-overlay");
  const body = document.getElementById("book-quiz-body");
  if (!overlay || !body) return;

  quizPreguntas = (storyData && storyData.preguntas && Array.isArray(storyData.preguntas)) ? storyData.preguntas : [];
  currentQuestionIndex = 0;

  body.innerHTML = "";
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

  const buttonsWrap = document.createElement("div");
  buttonsWrap.className = "flex flex-col gap-3 mt-1 justify-center items-center";

  if (quizPreguntas.length > 0) {
    const btnQuiz = document.createElement("button");
    btnQuiz.type = "button";
    btnQuiz.className = "book-quiz-btn book-quiz-btn-restart book-quiz-btn-yes";
    btnQuiz.textContent = "SI";
    btnQuiz.addEventListener("click", function () {
      renderOneQuestion(body, quizPreguntas[0], 0, quizPreguntas.length);
    });
    buttonsWrap.appendChild(btnQuiz);
  }

  const btnAnother = document.createElement("a");
  btnAnother.href = "/";
  btnAnother.className = "book-quiz-btn book-quiz-btn-another";
  btnAnother.textContent = "OTRO CUENTO";
  btnAnother.addEventListener("click", function () {
    stopNarrationOnLeave();
  });
  buttonsWrap.appendChild(btnAnother);

  card.appendChild(buttonsWrap);
  body.appendChild(card);

  overlay.classList.remove("hidden");
}

function hideEndPanel() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
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
  speakCurrent();
}

function scrollToCuentoInicio() {
  const el = document.getElementById("cuento-inicio");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handlePlayClick(e) {
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
  if (btn && btn.disabled) return;

  if (isMobileOrTablet()) scrollToCuentoInicio();
  play();
  updatePauseButtonLabels();
}

function handlePauseResumeClick() {
  log("handlePauseResumeClick. isPaused=" + isPaused);
  uiDebug("handlePauseResumeClick isPaused=" + isPaused);
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
    if (wasPlayingBeforeConfig && synth && synth.speaking && !synth.paused) {
      pause();
    }
    cfgPanel.classList.remove("hidden");
  }

  function closeConfigModal() {
    cfgPanel.classList.add("hidden");
    if (wasPlayingBeforeConfig && synth && synth.speaking && synth.paused) {
      synth.resume();
      isPaused = false;
      updateHighlightOnly();
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
    btnSave.addEventListener("click", closeConfigModal);
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
    populateHeader(storyData);
    buildSentencesAndPages(storyData);
    renderCurrentPage(false);
    updateSceneImageForIndex(0);
    log("initPage OK. Frases totales:", sentences.length);
    uiDebug("initPage OK sentences=" + sentences.length);

    if (coverBtn) coverBtn.disabled = false;
    if (startPlayBtn) startPlayBtn.disabled = false;
    if (startBtn) startBtn.disabled = false;
    showStartButtons();
  } catch (e) {
    log("initPage ERROR:", e.message || e);
    uiDebug("initPage ERROR: " + (e && e.message ? e.message : e));
    const container = document.getElementById("karaoke-container");
    if (container) {
      container.textContent = "No se pudo cargar el cuento.";
    }
  }

  initVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = initVoices;
  }
  initRateControl();
  initAmbient();
  initControls();

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

document.addEventListener("DOMContentLoaded", initPage);

