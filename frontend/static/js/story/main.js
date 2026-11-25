/**
 * Arranque de la página: carga el cuento, ficha editorial, controles y configuración.
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

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

function inferReadingAge(story) {
  const c = String((story && story.categoria) || "").toLowerCase();
  if (/fabula|fábula|animales|princesa|fantasia|fantasía/.test(c)) return "4 a 8 años";
  if (/aventura|clasico|clásico/.test(c)) return "6 a 10 años";
  return "5 a 9 años";
}

function inferReadingTime(story) {
  const escenas = (story && Array.isArray(story.escenas)) ? story.escenas.length : 0;
  if (escenas <= 3) return "3 a 5 minutos";
  if (escenas <= 5) return "5 a 8 minutos";
  return "8 a 12 minutos";
}

function buildStorySummary(story) {
  if (!story || !Array.isArray(story.escenas) || story.escenas.length === 0) {
    return "Este cuento infantil está adaptado para lectura acompañada con narración y texto sincronizado.";
  }
  const first = String(story.escenas[0].texto || "").trim();
  const second = story.escenas[1] ? String(story.escenas[1].texto || "").trim() : "";
  const firstShort = first.split(".").slice(0, 2).join(".").trim();
  const secondShort = second.split(".").slice(0, 1).join(".").trim();
  let out = firstShort;
  if (out && !out.endsWith(".")) out += ".";
  if (secondShort) {
    out += " " + secondShort;
    if (!out.endsWith(".")) out += ".";
  }
  return out || (story.descripcion || "");
}

function inferLessons(story) {
  const text = ((story && story.descripcion) || "") + " " + (story && story.titulo ? story.titulo : "");
  const t = text.toLowerCase();
  const lessons = [
    "Comprensión lectora y seguimiento de secuencias.",
    "Vocabulario y expresión oral.",
  ];
  if (/mentira|honest|verdad/.test(t)) lessons.push("Importancia de la honestidad.");
  else if (/amig|colabor|equipo/.test(t)) lessons.push("Valor de la amistad y la cooperación.");
  else if (/esfuerzo|constancia|trabajo/.test(t)) lessons.push("Constancia y esfuerzo para lograr metas.");
  else lessons.push("Reflexión sobre valores positivos y convivencia.");
  return lessons.slice(0, 3);
}

function populateStoryEditorial(story) {
  const summaryEl = document.getElementById("story-summary");
  const ageEl = document.getElementById("story-age");
  const timeEl = document.getElementById("story-time");
  const originEl = document.getElementById("story-origin");
  const lessonsEl = document.getElementById("story-lessons");
  if (!summaryEl || !ageEl || !timeEl || !originEl || !lessonsEl) return;

  summaryEl.textContent = buildStorySummary(story);
  ageEl.textContent = inferReadingAge(story);
  timeEl.textContent = inferReadingTime(story);
  originEl.textContent = (story && story.autor)
    ? "Adaptación de tradición literaria (" + story.autor + ")"
    : "Cuento tradicional adaptado para lectura infantil";

  lessonsEl.innerHTML = "";
  inferLessons(story).forEach(function (lesson) {
    const li = document.createElement("li");
    li.textContent = lesson;
    lessonsEl.appendChild(li);
  });
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
      const narrVoiceSel = document.getElementById("narration-voice-select");
      const desired = narrVoiceSel && !narrVoiceSel.disabled ? narrVoiceSel.value : null;
      const changeVoice = desired && desired !== currentVoice;
      if (changeVoice) wasPlayingBeforeConfig = false; // switchVoice reanuda por su cuenta
      closeConfigModal();
      if (changeVoice) await switchVoice(desired);
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
    populateStoryEditorial(storyData);

    narracionTimeUpdateAttached = false;
    await loadNarration(getPreferredVoice());
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
    bindVoiceChoiceButtons();
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
