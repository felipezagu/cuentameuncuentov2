/**
 * Voces del narrador: elegir hombre/mujer y cargar su MP3 + sync.json.
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

// --- Voz del narrador (un cuento puede tener varias narraciones MP3: hombre / mujer) ---
const VOICE_STORAGE_KEY = "cuc_voz";
let currentVoice = null;

function jsSafeSlug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getStoryNarrations(story) {
  return story && Array.isArray(story.narraciones)
    ? story.narraciones.filter(function (n) { return n && n.audio && n.sync && n.voz; })
    : [];
}

function getPreferredVoice() {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) || "hombre";
  } catch (e) {
    return "hombre";
  }
}

function savePreferredVoice(voz) {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, voz);
  } catch (e) {
    // Modo privado / sin storage: no pasa nada
  }
}

/** Narración a usar: la preferida si existe; si no, la primera disponible. */
function pickNarration(story, voz) {
  const list = getStoryNarrations(story);
  return list.find(function (n) { return n.voz === voz; }) || list[0] || null;
}

/**
 * Carga MP3 + sync.json de la voz indicada y reconstruye frases/páginas.
 * Si falla, queda la lectura con voz del navegador (speechSynthesis).
 */
async function loadNarration(voz) {
  useRecordedNarration = false;
  narracionSyncData = null;
  currentVoice = null;
  narracionAudioEl = document.getElementById("story-narration");
  const narr = pickNarration(storyData, voz);
  if (narr && narracionAudioEl) {
    try {
      const syncUrl = normalizeMediaUrl(narr.sync);
      const syncRes = await fetch(syncUrl);
      if (!syncRes.ok) {
        uiDebug("narracion sync no cargó (" + syncRes.status + "): " + syncUrl);
      } else {
        const syncJson = await syncRes.json();
        const nEscenas = (storyData.escenas && storyData.escenas.length) || 0;
        const segments = syncJson && syncJson.segments;
        const paras = syncJson && syncJson.paragraphs;
        let ok = false;
        if (Array.isArray(segments) && segments.length > 0 && nEscenas > 0) {
          const maxScene = segments.reduce(function (m, sg) {
            return Math.max(m, segmentSceneIndex(sg));
          }, 0);
          // El sync puede usar menos escenas que el cuento (p. ej. una voz agrupa 2 escenas en 1).
          ok = maxScene <= nEscenas - 1;
          if (!ok) uiDebug("MP3 desactivado: sync usa escena " + maxScene + " y el cuento tiene " + nEscenas);
        } else if (Array.isArray(paras) && paras.length === nEscenas && nEscenas > 0) {
          ok = true;
        }
        if (ok) {
          narracionSyncData = syncJson;
          narracionAudioEl.src = normalizeMediaUrl(narr.audio);
          narracionAudioEl.preload = "auto";
          useRecordedNarration = true;
          currentVoice = narr.voz;
          ensureNarracionListeners();
          log("Narración grabada activa:", narr.voz, narr.audio);
        }
      }
    } catch (err) {
      log("Error cargando narración:", err);
    }
  }
  buildSentencesAndPages(storyData, useRecordedNarration);
  renderCurrentPage(false);
  updateSceneImageForIndex(0);
  updateVoiceControls();
}

/** Cambia de voz sin salir de la página (antes había que abrir otro cuento duplicado). */
async function switchVoice(voz) {
  if (!voz || voz === currentVoice) return;
  savePreferredVoice(voz);
  const wasStarted = narrationStarted;
  const page = wasStarted ? getCurrentPageIndex() : 0;
  stop();
  currentIndex = 0;
  lastRenderedPageIndex = -1;
  await loadNarration(voz);
  // Seguimos en la misma página con la nueva voz.
  currentIndex = getFirstSentenceIndexForPage(page);
  if (page > 0) renderCurrentPage(false);
  if (wasStarted) {
    narrationStarted = false;
    play();
  }
}

function updateVoiceControls() {
  const voces = getStoryNarrations(storyData).map(function (n) { return n.voz; });
  const wrap = document.getElementById("voice-choice-overlay");
  const btnMale = document.getElementById("btn-voice-male");
  const btnFemale = document.getElementById("btn-voice-female");
  const showChoice = useRecordedNarration && voces.length > 1;
  if (wrap) wrap.classList.toggle("hidden", !showChoice);
  [[btnMale, "hombre"], [btnFemale, "mujer"]].forEach(function (pair) {
    const btn = pair[0];
    if (!btn) return;
    btn.disabled = voces.indexOf(pair[1]) === -1;
    btn.classList.toggle("active", currentVoice === pair[1]);
    btn.setAttribute("aria-pressed", currentVoice === pair[1] ? "true" : "false");
  });

  const sel = document.getElementById("narration-voice-select");
  if (sel) {
    sel.disabled = !useRecordedNarration || voces.length < 2;
    Array.prototype.forEach.call(sel.options, function (opt) {
      opt.disabled = voces.indexOf(opt.value) === -1;
    });
    if (currentVoice) sel.value = currentVoice;
  }
}

function bindVoiceChoiceButtons() {
  [["btn-voice-male", "hombre"], ["btn-voice-female", "mujer"]].forEach(function (pair) {
    const btn = document.getElementById(pair[0]);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      // Evita que el overlay arranque la lectura mientras se elige la voz.
      e.preventDefault();
      e.stopPropagation();
      switchVoice(pair[1]);
    });
    // El overlay escucha pointerup/touchend para arrancar: no dejar que el toque en la voz lo dispare.
    ["pointerup", "touchend"].forEach(function (ev) {
      btn.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
  });
}
