async function fetchStories() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  let res;
  try {
    res = await fetch("/api/stories/", { signal: ctrl.signal });
  } catch (e) {
    return [];
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) return [];
  return await res.json();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeStoryMediaUrl(url) {
  if (url == null || url === "") return "";
  const s = String(url).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  if (s.startsWith("data:")) return s;
  return "/" + s.replace(/^\/+/, "");
}

function parseV2VoiceTitle(titulo) {
  const t = String(titulo || "").trim();
  // Tolerante al tipo de guion raro que puede aparecer en el título.
  // Busca: "(v2 ... narrador <mujer|hombre>)" al final del texto.
  const m = t.match(/\(\s*v2[^)]*narrador\s*(mujer|hombre)\s*\)\s*$/i);
  if (!m) return null;
  return { base: t.replace(m[0], "").trim(), gender: String(m[1]).toLowerCase() };
}

function dedupeV2VoiceStoriesPreferHombre(stories) {
  const out = [];
  const outNonNarrated = [];
  const groupedNarrated = new Map(); // baseTitle -> { hombre: story|null, mujer: story|null }
  const narratedBaseKeys = new Set();

  const detectGenderFromAudio = (s) => {
    const a = (s && s.narracion_audio ? String(s.narracion_audio) : "").toLowerCase();
    if (!a) return null;
    if (a.includes("mujer") || a.endsWith("mujer.mp3")) return "mujer";
    if (a.includes("hombre") || a.endsWith("hombre.mp3")) return "hombre";
    return null;
  };

  (stories || []).forEach((s) => {
    const hasNarration = !!(s && s.narracion_audio && s.narracion_sync);
    if (!hasNarration) {
      outNonNarrated.push(s);
      return;
    }

    // Si todavía existe sufijo v2 en el título, lo quitamos; si ya no existe, devuelve el mismo título.
    const parsed = parseV2VoiceTitle(s && s.titulo ? s.titulo : "");
    const baseTitle = (parsed && parsed.base ? parsed.base : String(s && s.titulo ? s.titulo : "")).trim();
    if (!groupedNarrated.has(baseTitle)) groupedNarrated.set(baseTitle, { hombre: null, mujer: null });
    const g = groupedNarrated.get(baseTitle);
    narratedBaseKeys.add(baseTitle);

    const gender = detectGenderFromAudio(s);
    if (gender === "hombre") g.hombre = s;
    else if (gender === "mujer") g.mujer = s;
    else {
      // Si no se puede detectar, lo dejamos como "default" solo si no hay nada en el grupo.
      if (!g.hombre && !g.mujer) g.hombre = s;
    }
  });

  groupedNarrated.forEach((g) => {
    if (g.hombre) out.push(g.hombre);
    else if (g.mujer) out.push(g.mujer);
  });

  // Si hay versiones narradas, ocultamos las no-narradas del mismo título base.
  const narratedByBase = new Set(out.map((s) => (s && s.titulo ? String(s.titulo).trim() : "")));
  outNonNarrated.forEach((s) => {
    const baseTitle = String(s && s.titulo ? s.titulo : "").trim();
    if (!narratedByBase.has(baseTitle)) out.push(s);
  });

  return out;
}

function createStoryCard(story) {
  const card = document.createElement("div");
  card.className = "story-card";
  card.style.cursor = "pointer";
  card.dataset.categoria = (story.categoria || "").trim();

  const cover = document.createElement("div");
  cover.className = "story-card-cover";
  const portadaUrl = story.portada ? normalizeStoryMediaUrl(story.portada) : "";
  if (portadaUrl) {
    const img = document.createElement("img");
    img.className = "story-card-cover-img";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = portadaUrl;
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.addEventListener("error", function () {
      img.removeAttribute("src");
      cover.style.backgroundColor = "#CBD5E1";
    });
    cover.appendChild(img);
  }

  const info = document.createElement("div");
  info.className = "story-card-info";
  const title = document.createElement("p");
  title.className = "story-card-title";
  title.textContent = story.titulo;
  const label = document.createElement("p");
  label.className = "story-card-label";
  label.textContent = story.categoria || "Cuento";
  info.appendChild(title);
  info.appendChild(label);

  card.appendChild(cover);
  card.appendChild(info);

  card.addEventListener("click", () => {
    const isMobile = window.innerWidth <= 1024 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const url = isMobile ? `/cuento/${story.id}#cuento-inicio` : `/cuento/${story.id}`;
    window.location.href = url;
  });

  return card;
}

function renderFiltroCategorias(categorias) {
  const cont = document.getElementById("filtro-categorias");
  if (!cont) return;
  cont.innerHTML = "";
  const btnTodos = document.createElement("button");
  btnTodos.type = "button";
  btnTodos.className = "categoria-btn active";
  btnTodos.dataset.categoria = "";
  btnTodos.textContent = "Todos";
  cont.appendChild(btnTodos);
  categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "categoria-btn";
    btn.dataset.categoria = cat;
    btn.textContent = cat;
    cont.appendChild(btn);
  });
  cont.querySelectorAll(".categoria-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      cont.querySelectorAll(".categoria-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.categoria || "";
      document.querySelectorAll(".story-category-block").forEach((block) => {
        const show = !cat || block.dataset.categoria === cat;
        block.style.display = show ? "block" : "none";
      });
    });
  });
}

function renderPorCategoria(stories) {
  const cont = document.getElementById("contenedor-por-categoria");
  if (!cont) return;
  cont.innerHTML = "";

  const categoriasRaw = stories.map(function(s) {
    return (s.categoria || "Otros").trim();
  });
  const categoriasUnicas = [...new Set(categoriasRaw)].filter(Boolean).sort();
  if (categoriasUnicas.length === 0) categoriasUnicas.push("Otros");
  const categoriasParaFiltro = [...categoriasUnicas];
  shuffleInPlace(categoriasParaFiltro);
  renderFiltroCategorias(categoriasParaFiltro);

  const porCategoria = {};
  stories.forEach((s) => {
    const cat = (s.categoria || "Otros").trim();
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(s);
  });

  let ordenCats = categoriasUnicas.includes("Otros")
    ? ["Otros", ...categoriasUnicas.filter((c) => c !== "Otros")]
    : [...categoriasUnicas];
  shuffleInPlace(ordenCats);
  ordenCats.forEach((cat) => {
    const list = (porCategoria[cat] || []).slice();
    if (list.length === 0) return;
    shuffleInPlace(list);
    const block = document.createElement("div");
    block.className = "story-category-block";
    block.dataset.categoria = cat;
    const h3 = document.createElement("h3");
    h3.textContent = cat;
    const listEl = document.createElement("div");
    listEl.className = "story-list";
    list.forEach((story) => listEl.appendChild(createStoryCard(story)));
    block.appendChild(h3);
    block.appendChild(listEl);
    cont.appendChild(block);
  });
}

async function init() {
  let stories = await fetchStories();
  // Si existen dos versiones (mujer/hombre) del mismo cuento v2,
  // en portada mostramos solo una: por defecto la voz "Hombre".
  stories = dedupeV2VoiceStoriesPreferHombre(stories);
  shuffleInPlace(stories);
  const btnRandom = document.getElementById("btn-random-story");
  const contenedor = document.getElementById("contenedor-por-categoria");

  if (!stories.length) {
    if (contenedor) {
      contenedor.innerHTML = "<p class=\"text-purple-700 dark:text-purple-300\">Aún no hay cuentos. Entra al panel admin para crear algunos.</p>";
    }
    return;
  }

  if (btnRandom) {
    btnRandom.addEventListener("click", () => {
      const pick = stories[Math.floor(Math.random() * stories.length)];
      if (pick && pick.id) window.location.href = `/cuento/${pick.id}`;
    });
  }

  renderPorCategoria(stories);
}

document.addEventListener("DOMContentLoaded", init);

