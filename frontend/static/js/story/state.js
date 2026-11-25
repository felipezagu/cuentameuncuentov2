/**
 * Estado compartido, logs de depuración (activar con ?debug=1).
 *
 * Página del cuento: los archivos de js/story/ se cargan en orden (ver story.html)
 * y comparten estado global (declarado en state.js).
 */

const synth = window.speechSynthesis;
const LOG = /[?&]debug=1\b/.test(window.location.search);
function log() {
  if (LOG && window.console) console.log("[CUC]", ...arguments);
}
log("cuento: scripts cargados");

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
