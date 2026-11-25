/**
 * Final del cuento: panel de cierre, preguntas (quiz) y volver a leer.
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

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
    return currentVoice || getPreferredVoice();
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
  const baseSlug = jsSafeSlug(storyData && storyData.titulo ? storyData.titulo : "");
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
    btn.textContent = op;
    btn.dataset.index = String(i);
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      stopAllQuizPanelAudio();
      optionButtons.forEach(function (b, idx) {
        b.disabled = true;
        if (idx === correcta) b.classList.add("quiz-option-correct");
        else b.classList.add("quiz-option-wrong");
      });
      const isCorrect = i === correcta;
      if (window.CUCInteract) window.CUCInteract.onQuizAnswer(isCorrect);
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
  if (window.CUCInteract) window.CUCInteract.onQuizDone(card, quizPreguntas.length);

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
  if (window.CUCInteract) window.CUCInteract.onStoryFinished(card);

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
    const cuentoNombre = (storyData && storyData.titulo ? storyData.titulo : storyTitle) || "";
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
  // En modo "Lo leo yo" volver a empezar no enciende el narrador.
  if (window.CUCInteract && window.CUCInteract.isSelfRead()) return;
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
