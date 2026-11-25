/**
 * Reproductor: play/pausa/stop, navegación entre páginas y botones de inicio.
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

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
