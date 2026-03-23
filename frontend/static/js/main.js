/**
 * Home: carruseles tipo Netflix, filtros, favoritos e historial (localStorage).
 */
const LS_FAV = "cuc_favorites_v1";
const LS_HIST = "cuc_history_v1";

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
  const m = t.match(/\(\s*v2[^)]*narrador\s*(mujer|hombre)\s*\)\s*$/i);
  if (!m) return null;
  return { base: t.replace(m[0], "").trim(), gender: String(m[1]).toLowerCase() };
}

function dedupeV2VoiceStoriesPreferHombre(stories) {
  const out = [];
  const outNonNarrated = [];
  const groupedNarrated = new Map();
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

    const parsed = parseV2VoiceTitle(s && s.titulo ? s.titulo : "");
    const baseTitle = (parsed && parsed.base ? parsed.base : String(s && s.titulo ? s.titulo : "")).trim();
    if (!groupedNarrated.has(baseTitle)) groupedNarrated.set(baseTitle, { hombre: null, mujer: null });
    const g = groupedNarrated.get(baseTitle);
    narratedBaseKeys.add(baseTitle);

    const gender = detectGenderFromAudio(s);
    if (gender === "hombre") g.hombre = s;
    else if (gender === "mujer") g.mujer = s;
    else {
      if (!g.hombre && !g.mujer) g.hombre = s;
    }
  });

  groupedNarrated.forEach((g) => {
    if (g.hombre) out.push(g.hombre);
    else if (g.mujer) out.push(g.mujer);
  });

  const narratedByBase = new Set(out.map((s) => (s && s.titulo ? String(s.titulo).trim() : "")));
  outNonNarrated.forEach((s) => {
    const baseTitle = String(s && s.titulo ? s.titulo : "").trim();
    if (!narratedByBase.has(baseTitle)) out.push(s);
  });

  return out;
}

/** Rango de edad sugerido por categoría (heurística). */
function edadRangoForStory(story) {
  const c = String(story.categoria || "").toLowerCase();
  const t = String(story.titulo || "").toLowerCase();
  if (/bebé|bebe|infantil|nursery/i.test(c + t)) return "3-5";
  if (/princesa|hada|fantasía|fantasia|cuento de hadas/i.test(c)) return "3-5";
  if (/animales|fabula|fábula/i.test(c)) return "3-5";
  if (/clásico|clasico|leyenda|mito/i.test(c)) return "6-8";
  if (/aventura/i.test(c)) return "6-8";
  if (/épico|epico|historia/i.test(c)) return "9+";
  return "6-8";
}

function duracionBucket(story) {
  const n = typeof story.num_escenas === "number" ? story.num_escenas : 0;
  if (n <= 0) return "medio";
  if (n <= 3) return "corto";
  if (n <= 6) return "medio";
  return "largo";
}

function isSleepStory(s) {
  const blob = ((s.titulo || "") + " " + (s.descripcion || "")).toLowerCase();
  return /noche|luna|estrella|sueño|dormir|soñar|tranquilo|calma|dulce sueño|arrull|cantar bajito/i.test(blob);
}

function loadJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch (e) {
    return [];
  }
}

function saveJsonArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 30)));
  } catch (e) {
    /* ignore */
  }
}

function getFavoriteIds() {
  return loadJsonArray(LS_FAV).map(Number).filter((n) => !Number.isNaN(n));
}

function toggleFavorite(id, btn) {
  let ids = getFavoriteIds();
  const idx = ids.indexOf(id);
  if (idx >= 0) {
    ids.splice(idx, 1);
    if (btn) btn.classList.remove("is-fav");
  } else {
    ids.unshift(id);
    if (btn) btn.classList.add("is-fav");
  }
  saveJsonArray(LS_FAV, ids);
}

function isFavorite(id) {
  return getFavoriteIds().indexOf(id) >= 0;
}

function pushHistory(id) {
  let h = loadJsonArray(LS_HIST).map(Number).filter((n) => !Number.isNaN(n));
  h = h.filter((x) => x !== id);
  h.unshift(id);
  saveJsonArray(LS_HIST, h.slice(0, 20));
}

function storiesByIds(all, ids) {
  const map = new Map((all || []).map((s) => [s.id, s]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

function recommendedFrom(all, historyIds) {
  if (!all.length) return [];
  const recent = storiesByIds(all, historyIds.slice(0, 3));
  const cats = new Set(recent.map((s) => (s.categoria || "").trim()).filter(Boolean));
  let pool = all.filter((s) => cats.has((s.categoria || "").trim()));
  if (pool.length < 6) pool = all.slice();
  shuffleInPlace(pool);
  return pool.slice(0, 12);
}

let filterState = {
  q: "",
  categoria: "",
};

function storyMatchesFilters(story) {
  const q = filterState.q.trim().toLowerCase();
  if (q) {
    const tit = String(story.titulo || "").toLowerCase();
    const desc = String(story.descripcion || "").toLowerCase();
    if (tit.indexOf(q) === -1 && desc.indexOf(q) === -1) return false;
  }
  if (filterState.categoria) {
    if ((story.categoria || "").trim() !== filterState.categoria) return false;
  }
  return true;
}

function navigateToStory(story) {
  if (!story || !story.id) return;
  pushHistory(story.id);
  const isMobile = window.innerWidth <= 1024 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const url = isMobile ? `/cuento/${story.id}#cuento-inicio` : `/cuento/${story.id}`;
  window.location.href = url;
}

function createStoryCard(story, opts) {
  const opt = opts || {};
  const card = document.createElement("article");
  card.className = "story-card-v2";
  card.dataset.categoria = (story.categoria || "").trim();
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  card.setAttribute("aria-label", "Abrir cuento " + (story.titulo || ""));

  const cover = document.createElement("div");
  cover.className = "story-card-v2__cover";
  const portadaUrl = story.portada ? normalizeStoryMediaUrl(story.portada) : "";
  if (portadaUrl) {
    const img = document.createElement("img");
    img.className = "story-card-v2__img";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = portadaUrl;
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.addEventListener("error", function () {
      img.removeAttribute("src");
      cover.classList.add("story-card-v2__cover--empty");
    });
    cover.appendChild(img);
  } else {
    cover.classList.add("story-card-v2__cover--empty");
  }

  const badges = document.createElement("div");
  badges.className = "story-card-v2__badges";
  if (story.destacado) {
    const b = document.createElement("span");
    b.className = "story-badge story-badge--popular";
    b.textContent = "Popular";
    badges.appendChild(b);
  }
  const edad = edadRangoForStory(story);
  const e = document.createElement("span");
  e.className = "story-badge story-badge--edad";
  e.textContent = edad + " años";
  badges.appendChild(e);

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "story-card-v2__fav" + (isFavorite(story.id) ? " is-fav" : "");
  favBtn.setAttribute("aria-label", "Favorito");
  favBtn.innerHTML = '<span aria-hidden="true">♥</span>';
  favBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    toggleFavorite(story.id, favBtn);
  });

  const info = document.createElement("div");
  info.className = "story-card-v2__info";
  const title = document.createElement("h3");
  title.className = "story-card-v2__title";
  title.textContent = story.titulo;
  const meta = document.createElement("p");
  meta.className = "story-card-v2__meta";
  const n = typeof story.num_escenas === "number" ? story.num_escenas : "?";
  meta.textContent = (story.categoria || "Cuento") + " · " + n + " partes";
  info.appendChild(title);
  info.appendChild(meta);

  cover.appendChild(badges);
  cover.appendChild(favBtn);
  card.appendChild(cover);
  card.appendChild(info);

  const open = () => navigateToStory(story);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });

  return card;
}

function createCarouselRow(title, stories, emptyHint) {
  const section = document.createElement("section");
  section.className = "home-row";
  const h = document.createElement("h2");
  h.className = "home-row__title";
  h.textContent = title;
  const trackWrap = document.createElement("div");
  trackWrap.className = "home-carousel";
  const track = document.createElement("div");
  track.className = "home-carousel__track";
  track.setAttribute("role", "list");

  if (!stories || stories.length === 0) {
    const p = document.createElement("p");
    p.className = "home-row__empty";
    p.textContent = emptyHint || "Pronto habrá más cuentos aquí.";
    section.appendChild(h);
    section.appendChild(p);
    return section;
  }

  stories.forEach((s) => {
    const wrap = document.createElement("div");
    wrap.className = "home-carousel__item";
    wrap.setAttribute("role", "listitem");
    wrap.appendChild(createStoryCard(s));
    track.appendChild(wrap);
  });

  trackWrap.appendChild(track);
  section.appendChild(h);
  section.appendChild(trackWrap);
  return section;
}

function renderNetflixRows(container, allStories) {
  if (!container) return;
  container.innerHTML = "";

  const histIds = loadJsonArray(LS_HIST).map(Number).filter((n) => !Number.isNaN(n));
  const favIds = getFavoriteIds();

  const favorites = storiesByIds(allStories, favIds);
  const history = storiesByIds(allStories, histIds).filter((s) => favIds.indexOf(s.id) === -1);
  const recommended = recommendedFrom(allStories, histIds);

  const popular = shuffleInPlace(allStories.filter((s) => s.destacado)).slice(0, 14);
  let sleep = allStories.filter(isSleepStory);
  if (sleep.length < 6) {
    sleep = shuffleInPlace(
      allStories.filter((s) => /clásico|clasico|princesa|fantasía|fantasia/i.test(s.categoria || ""))
    ).slice(0, 10);
  } else {
    sleep = shuffleInPlace(sleep).slice(0, 14);
  }

  const cortos = shuffleInPlace(allStories.filter((s) => duracionBucket(s) === "corto")).slice(0, 14);

  if (favorites.length) container.appendChild(createCarouselRow("♥ Tus favoritos", favorites, ""));
  if (history.length) container.appendChild(createCarouselRow("🕐 Vistos recientemente", history, ""));
  if (recommended.length) container.appendChild(createCarouselRow("✨ Recomendados para ti", recommended, ""));
  container.appendChild(createCarouselRow("🔥 Cuentos populares", popular, "Marca cuentos como destacados en el admin."));
  container.appendChild(createCarouselRow("🌙 Para dormir", sleep, ""));
  container.appendChild(createCarouselRow("⚡ Cuentos cortos", cortos, ""));
}

function renderFiltroCategorias(categorias) {
  const cont = document.getElementById("filtro-categorias");
  if (!cont) return;
  cont.innerHTML = "";
  const btnTodos = document.createElement("button");
  btnTodos.type = "button";
  btnTodos.className = "home-chip active";
  btnTodos.dataset.categoria = "";
  btnTodos.textContent = "Todas";
  cont.appendChild(btnTodos);
  categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "home-chip";
    btn.dataset.categoria = cat;
    btn.textContent = cat;
    cont.appendChild(btn);
  });
  cont.querySelectorAll(".home-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      cont.querySelectorAll(".home-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterState.categoria = btn.dataset.categoria || "";
      applyFiltersAndRender();
    });
  });
}

function renderCatalogGrid(stories) {
  const cont = document.getElementById("contenedor-por-categoria");
  const emptyEl = document.getElementById("home-empty");
  if (!cont) return;

  const filtered = (stories || []).filter(storyMatchesFilters);
  cont.innerHTML = "";

  if (emptyEl) emptyEl.classList.toggle("hidden", filtered.length > 0);

  if (filtered.length === 0) {
    cont.innerHTML = "";
    return;
  }

  const categoriasUnicas = [...new Set(filtered.map((s) => (s.categoria || "Otros").trim()))].sort();
  const byCat = {};
  filtered.forEach((s) => {
    const cat = (s.categoria || "Otros").trim();
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(s);
  });

  categoriasUnicas.forEach((cat) => {
    const list = byCat[cat] || [];
    if (!list.length) return;
    const block = document.createElement("div");
    block.className = "home-cat-block";
    block.dataset.categoria = cat;
    const h3 = document.createElement("h3");
    h3.className = "home-cat-block__title";
    h3.textContent = cat;
    const gridInner = document.createElement("div");
    gridInner.className = "home-grid";
    shuffleInPlace(list);
    list.forEach((story) => {
      gridInner.appendChild(createStoryCard(story));
    });
    block.appendChild(h3);
    block.appendChild(gridInner);
    cont.appendChild(block);
  });
}

function applyFiltersAndRender() {
  renderCatalogGrid(window.__CUC_STORIES__ || []);
}

function wireFilters() {
  const search = document.getElementById("home-search-input");
  if (search) {
    let t;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        filterState.q = search.value;
        applyFiltersAndRender();
      }, 200);
    });
  }

}

async function init() {
  let stories = await fetchStories();
  stories = dedupeV2VoiceStoriesPreferHombre(stories);
  shuffleInPlace(stories);
  window.__CUC_STORIES__ = stories;

  const btnRandom = document.getElementById("btn-random-story");
  const contenedor = document.getElementById("contenedor-por-categoria");
  const rowsEl = document.getElementById("home-rows");

  if (!stories.length) {
    if (contenedor) {
      contenedor.innerHTML =
        '<p class="home-empty">Aún no hay cuentos. Carga cuentos desde el panel admin.</p>';
    }
    return;
  }

  if (btnRandom) {
    btnRandom.addEventListener("click", () => {
      const pick = stories[Math.floor(Math.random() * stories.length)];
      if (pick && pick.id) navigateToStory(pick);
    });
  }

  const categoriasRaw = stories.map((s) => (s.categoria || "Otros").trim());
  const categoriasUnicas = [...new Set(categoriasRaw)].filter(Boolean).sort();
  const categoriasParaFiltro = shuffleInPlace([...categoriasUnicas]);
  renderFiltroCategorias(categoriasParaFiltro);

  renderNetflixRows(rowsEl, stories);
  renderCatalogGrid(stories);
  wireFilters();
}

document.addEventListener("DOMContentLoaded", init);
