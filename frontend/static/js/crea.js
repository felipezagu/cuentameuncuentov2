/**
 * "Crea tu cuento": asistente de 4 pasos + lector con karaoke (voz del navegador).
 * Los cuentos creados se guardan en este navegador (localStorage, máx. 12).
 */
(function () {
  const SAVED_KEY = "cuc_creados_v1";
  const state = { step: 1, personaje: "", amigo_tipo: "", lugar: "", valor: "" };
  let opciones = null;
  let story = null;
  let page = 0;
  let speaking = false;
  let autoplay = false;
  let wordTimer = null;

  const $ = (id) => document.getElementById(id);
  const form = $("crea-form");

  // --------------------------------------------------------------------------
  // Asistente
  // --------------------------------------------------------------------------
  function showStep(n) {
    state.step = n;
    form.querySelectorAll(".crea-step").forEach((fs) => {
      fs.classList.toggle("is-active", Number(fs.dataset.step) === n);
    });
    form.querySelectorAll(".crea-steps li").forEach((li, i) => {
      li.classList.toggle("is-current", i + 1 === n);
      li.classList.toggle("is-done", i + 1 < n);
    });
    $("crea-back").hidden = n === 1;
    $("crea-next").textContent = n === 4 ? "✨ ¡Crear mi cuento!" : "Siguiente →";
    $("crea-error").textContent = "";
    const first = form.querySelector('.crea-step.is-active .crea-chip');
    if (first && document.activeElement && document.activeElement.closest(".crea-nav")) first.focus();
  }

  function selectChip(field, value) {
    state[field] = value;
    form.querySelectorAll('[data-field="' + field + '"] .crea-chip').forEach((b) => {
      const on = b.dataset.value === value;
      b.classList.toggle("is-selected", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function validate(n) {
    if (n === 1 && !state.personaje) return "Elige quién es el héroe 🙂";
    if (n === 1 && !$("crea-nombre").value.trim()) return "Escribe cómo se llama";
    if (n === 2 && !state.amigo_tipo) return "Elige a su amigo o amiga";
    if (n === 2 && !$("crea-amigo").value.trim()) return "Escribe el nombre del amigo o amiga";
    if (n === 3 && !state.lugar) return "Elige dónde pasa la aventura";
    if (n === 4 && !state.valor) return "Elige qué van a aprender";
    return "";
  }

  function pick(field) {
    const chips = form.querySelectorAll('[data-field="' + field + '"] .crea-chip');
    return chips[Math.floor(Math.random() * chips.length)].dataset.value;
  }

  function surprise() {
    const nombres = ["Sofía", "Mateo", "Emilia", "Tomás", "Agustina", "Benja", "Isidora", "Lucas", "Martina", "Joaquín"];
    const amigos = ["Toby", "Pipo", "Lola", "Chispa", "Coco", "Nube", "Bolita", "Kiwi"];
    ["personaje", "amigo_tipo", "lugar", "valor"].forEach((f) => selectChip(f, pick(f)));
    $("crea-nombre").value = nombres[Math.floor(Math.random() * nombres.length)];
    $("crea-amigo").value = amigos[Math.floor(Math.random() * amigos.length)];
    showStep(4);
  }

  async function create() {
    form.classList.add("hidden");
    $("crea-loading").classList.remove("hidden");
    const body = {
      nombre: $("crea-nombre").value,
      amigo: $("crea-amigo").value,
      personaje: state.personaje,
      amigo_tipo: state.amigo_tipo,
      lugar: state.lugar,
      valor: state.valor,
      idea: $("crea-idea").value,
    };
    try {
      const [res] = await Promise.all([
        fetch("/api/crea-cuento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        new Promise((r) => setTimeout(r, 1200)), // que la varita mágica alcance a verse
      ]);
      if (!res.ok) throw new Error("HTTP " + res.status);
      story = await res.json();
      story.creado = new Date().toISOString().slice(0, 10);
      saveStory(story);
      openStory(story);
    } catch (e) {
      $("crea-loading").classList.add("hidden");
      form.classList.remove("hidden");
      $("crea-error").textContent = "Uy, no pudimos crear el cuento. Revisa tu conexión e inténtalo otra vez.";
    }
  }

  // --------------------------------------------------------------------------
  // Lector
  // --------------------------------------------------------------------------
  function renderScene() {
    const e = story.escena || {};
    const scene = $("crea-scene");
    scene.className = "crea-scene crea-place--" + (e.lugar || "bosque");
    const deco = (e.deco || [])
      .map((d, i) => '<span class="crea-scene__deco crea-scene__deco--' + (i + 1) + '">' + d + "</span>")
      .join("");
    scene.innerHTML =
      deco +
      '<span class="crea-scene__big">' + (e.lugar_emoji || "✨") + "</span>" +
      '<span class="crea-scene__hero">' + (e.protagonista || "🙂") + "</span>" +
      '<span class="crea-scene__friend">' + (e.amigo || "🐶") + "</span>";
    // Cada página mueve un poco a los personajes
    scene.style.setProperty("--crea-shift", (page % 2 ? -1 : 1) * 6 + "%");
  }

  function renderPage() {
    const text = $("crea-text");
    text.innerHTML = "";
    const words = String(story.paginas[page] || "").split(/(\s+)/);
    words.forEach((w) => {
      const span = document.createElement("span");
      if (/^\s+$/.test(w)) {
        span.textContent = w;
      } else {
        span.className = "crea-word";
        span.textContent = w;
      }
      text.appendChild(span);
    });
    text.classList.remove("crea-text--in");
    void text.offsetWidth;
    text.classList.add("crea-text--in");
    renderScene();
    const dots = $("crea-dots");
    dots.innerHTML = "";
    story.paginas.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cuc-page-dot" + (i === page ? " is-current" : i < page ? " is-read" : "");
      b.setAttribute("aria-label", "Página " + (i + 1));
      b.addEventListener("click", () => goTo(i, speaking));
      dots.appendChild(b);
    });
    $("crea-prev").disabled = page === 0;
    $("crea-next-page").textContent = page === story.paginas.length - 1 ? "🏁" : "▶";
  }

  function openStory(s) {
    story = s;
    page = 0;
    $("crea-loading").classList.add("hidden");
    form.classList.add("hidden");
    $("crea-end").classList.add("hidden");
    $("crea-reader").classList.remove("hidden");
    $("crea-story-title").textContent = s.titulo;
    renderPage();
    $("crea-reader").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(i, keepSpeaking) {
    stopSpeech();
    if (i >= story.paginas.length) return showEnd();
    page = Math.max(0, i);
    $("crea-end").classList.add("hidden");
    renderPage();
    if (keepSpeaking) speakPage();
  }

  // Voz del navegador + karaoke
  function pickVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    const prefs = ["es-CL", "es-419", "es-MX", "es-US", "es-AR", "es-ES"];
    for (const p of prefs) {
      const v = voices.find((x) => x.lang && x.lang.replace("_", "-").toLowerCase() === p.toLowerCase());
      if (v) return v;
    }
    return voices.find((x) => /^es/i.test(x.lang)) || null;
  }

  function markWord(idx) {
    $("crea-text").querySelectorAll(".crea-word").forEach((w, i) => {
      w.classList.toggle("kw-read", i < idx);
      w.classList.toggle("kw-on", i === idx);
    });
  }

  function stopSpeech() {
    speaking = false;
    clearInterval(wordTimer);
    wordTimer = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
    $("crea-play").textContent = "🔊 Escuchar";
  }

  function speakPage() {
    if (!window.speechSynthesis) {
      $("crea-play").textContent = "🔇 Tu navegador no puede leer en voz alta";
      return;
    }
    stopSpeech();
    const txt = story.paginas[page];
    const words = txt.split(/\s+/).filter(Boolean);
    const starts = [];
    let pos = 0;
    words.forEach((w) => {
      const i = txt.indexOf(w, pos);
      starts.push(i);
      pos = i + w.length;
    });
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "es-CL";
    u.rate = 0.92;
    const v = pickVoice();
    if (v) u.voice = v;
    let gotBoundary = false;
    u.onboundary = (ev) => {
      if (ev.name && ev.name !== "word") return;
      gotBoundary = true;
      let idx = 0;
      while (idx + 1 < starts.length && starts[idx + 1] <= ev.charIndex) idx++;
      markWord(idx);
    };
    u.onstart = () => {
      // Algunas voces no avisan palabra a palabra: estimamos por el largo del texto.
      const t0 = performance.now();
      const msPerChar = 62 / u.rate;
      wordTimer = setInterval(() => {
        if (gotBoundary) return;
        const ch = (performance.now() - t0) / msPerChar;
        let idx = 0;
        while (idx + 1 < starts.length && starts[idx + 1] <= ch) idx++;
        markWord(idx);
      }, 90);
    };
    u.onend = () => {
      if (!speaking) return;
      clearInterval(wordTimer);
      markWord(words.length);
      if (autoplay) {
        setTimeout(() => {
          if (speaking) goTo(page + 1, true);
        }, 700);
      } else {
        stopSpeech();
      }
    };
    speaking = true;
    $("crea-play").textContent = "⏸ Pausa";
    speechSynthesis.speak(u);
  }

  // Final: preguntas
  function showEnd() {
    stopSpeech();
    const end = $("crea-end");
    end.innerHTML = "";
    end.classList.remove("hidden");
    const h = document.createElement("p");
    h.className = "crea-end__title";
    h.textContent = "🎉 ¡Fin! ¿Respondemos unas preguntas?";
    end.appendChild(h);
    const qs = story.preguntas || [];
    let ok = 0;
    let answered = 0;
    qs.forEach((q) => {
      const box = document.createElement("div");
      box.className = "crea-q-card";
      const p = document.createElement("p");
      p.className = "crea-q-card__q";
      p.textContent = q.p;
      box.appendChild(p);
      const opts = document.createElement("div");
      opts.className = "crea-q-card__opts";
      q.opciones.forEach((op, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "quiz-option-btn";
        b.textContent = op;
        b.addEventListener("click", () => {
          opts.querySelectorAll("button").forEach((x, j) => {
            x.disabled = true;
            x.classList.add(j === q.correcta ? "quiz-option-correct" : "quiz-option-wrong");
          });
          answered++;
          if (i === q.correcta) ok++;
          if (answered === qs.length) {
            const r = document.createElement("p");
            r.className = "crea-end__result";
            r.textContent = ok === qs.length ? "⭐⭐⭐ ¡Perfecto!" : "⭐ ¡Muy bien! Acertaste " + ok + " de " + qs.length;
            end.appendChild(r);
          }
        });
        opts.appendChild(b);
      });
      box.appendChild(opts);
      end.appendChild(box);
    });
    end.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // --------------------------------------------------------------------------
  // Guardados
  // --------------------------------------------------------------------------
  function loadSaved() {
    try {
      const a = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveStory(s) {
    const list = loadSaved().filter((x) => x.titulo !== s.titulo);
    list.unshift(s);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 12)));
    } catch (e) {
      // sin storage: no se guarda
    }
    renderSaved();
  }

  function renderSaved() {
    const list = loadSaved();
    const wrap = $("crea-saved");
    const cont = $("crea-saved-list");
    wrap.classList.toggle("hidden", !list.length);
    cont.innerHTML = "";
    list.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "crea-saved__item crea-place--" + ((s.escena && s.escena.lugar) || "bosque");
      const em = document.createElement("span");
      em.className = "crea-saved__emoji";
      em.textContent = ((s.escena && s.escena.protagonista) || "📖") + ((s.escena && s.escena.amigo) || "");
      const t = document.createElement("span");
      t.className = "crea-saved__name";
      t.textContent = s.titulo;
      b.append(em, t);
      b.addEventListener("click", () => openStory(s));
      cont.appendChild(b);
    });
  }

  // --------------------------------------------------------------------------
  function init() {
    if (!form) return;
    fetch("/api/crea-cuento/opciones")
      .then((r) => r.json())
      .then((o) => {
        opciones = o;
        // La idea libre solo sirve si hay IA; con plantillas no se usaría.
        $("crea-idea-wrap").classList.toggle("hidden", !o.ia);
      })
      .catch(() => {});

    form.querySelectorAll("[data-field]").forEach((group) => {
      group.querySelectorAll(".crea-chip").forEach((b) => {
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          selectChip(group.dataset.field, b.dataset.value);
          $("crea-error").textContent = "";
          // En los pasos sin nombre, avanzar solo tras elegir
          if (state.step === 3) setTimeout(() => showStep(4), 250);
        });
      });
    });

    $("crea-next").addEventListener("click", () => {
      const err = validate(state.step);
      if (err) {
        $("crea-error").textContent = err;
        return;
      }
      if (state.step < 4) showStep(state.step + 1);
      else create();
    });
    $("crea-back").addEventListener("click", () => showStep(Math.max(1, state.step - 1)));
    $("crea-dice").addEventListener("click", surprise);
    form.addEventListener("submit", (e) => e.preventDefault());

    $("crea-play").addEventListener("click", () => {
      if (speaking) {
        autoplay = false;
        stopSpeech();
      } else {
        autoplay = true;
        speakPage();
      }
    });
    $("crea-prev").addEventListener("click", () => goTo(page - 1, speaking));
    $("crea-next-page").addEventListener("click", () => goTo(page + 1, speaking));
    $("crea-again").addEventListener("click", () => {
      stopSpeech();
      $("crea-reader").classList.add("hidden");
      form.classList.remove("hidden");
      showStep(1);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("crea-text").addEventListener("click", (e) => {
      const w = e.target.closest(".crea-word");
      if (!w || speaking || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(w.textContent.replace(/[^\p{L}\p{N}'-]+/gu, ""));
      u.lang = "es-CL";
      u.rate = 0.8;
      const v = pickVoice();
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      w.classList.remove("karaoke-word--tapped");
      void w.offsetWidth;
      w.classList.add("karaoke-word--tapped");
    });
    window.addEventListener("pagehide", stopSpeech);
    renderSaved();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
