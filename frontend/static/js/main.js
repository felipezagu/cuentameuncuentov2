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

/** Miniatura (400px) de la portada para tarjetas; si no existe se usa la original. */
function thumbUrl(portada) {
  const url = normalizeStoryMediaUrl(portada);
  const m = url.match(/^\/imagenes\/portadas\/([^/]+\.webp)$/i);
  return m ? "/imagenes/portadas/sm/" + m[1] : url;
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
    img.src = thumbUrl(story.portada);
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.addEventListener("load", function () {
      cover.classList.add("is-loaded");
    });
    img.addEventListener("error", function () {
      if (img.src.indexOf("/portadas/sm/") !== -1) {
        img.src = portadaUrl; // sin miniatura: probar la imagen original
        return;
      }
      img.removeAttribute("src");
      cover.classList.add("story-card-v2__cover--empty");
    });
    if (img.complete && img.naturalWidth) cover.classList.add("is-loaded");
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
  const voces = Array.isArray(story.narraciones) ? story.narraciones.length : 0;
  meta.textContent =
    (story.categoria || "Cuento") + " · " + n + " partes" + (voces ? " · 🎧" + (voces > 1 ? " " + voces + " voces" : "") : "");
  info.appendChild(title);
  info.appendChild(meta);

  cover.appendChild(badges);
  cover.appendChild(favBtn);

  // Estrellas ganadas en este navegador (rewards.js)
  const progreso = window.CUCRewards ? window.CUCRewards.get(story.id) : null;
  if (progreso && progreso.leido) {
    const stars = document.createElement("span");
    stars.className = "story-card-v2__stars";
    stars.textContent = window.CUCRewards.starString(progreso.estrellas || 0);
    stars.setAttribute("aria-label", (progreso.estrellas || 0) + " de 3 estrellas");
    cover.appendChild(stars);
  }
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

function createAlbumSummary(allStories) {
  if (!window.CUCRewards) return null;
  const ids = new Set(allStories.map((s) => s.id));
  const sum = window.CUCRewards.summary();
  const leidos = sum.leidos.filter((id) => ids.has(id)).length;
  if (!leidos) return null;
  const total = allStories.length;
  const el = document.createElement("section");
  el.className = "home-album";
  el.setAttribute("aria-label", "Tu álbum de cuentos");
  const star = document.createElement("span");
  star.className = "home-album__star";
  star.setAttribute("aria-hidden", "true");
  star.textContent = "⭐";
  const text = document.createElement("span");
  text.textContent = sum.estrellas + " estrellas · " + leidos + " de " + total + " cuentos leídos";
  const bar = document.createElement("div");
  bar.className = "home-album__bar";
  const fill = document.createElement("div");
  fill.className = "home-album__fill";
  fill.style.width = Math.round((leidos / Math.max(total, 1)) * 100) + "%";
  bar.appendChild(fill);
  el.append(star, text, bar);
  return el;
}

function renderNetflixRows(container, allStories) {
  if (!container) return;
  container.innerHTML = "";

  const album = createAlbumSummary(allStories);
  if (album) container.appendChild(album);

  const histIds = loadJsonArray(LS_HIST).map(Number).filter((n) => !Number.isNaN(n));
  const favIds = getFavoriteIds();

  const favorites = storiesByIds(allStories, favIds);
  const history = storiesByIds(allStories, histIds).filter((s) => favIds.indexOf(s.id) === -1);
  const recommended = recommendedFrom(allStories, histIds);
  const leidos = new Set(window.CUCRewards ? window.CUCRewards.summary().leidos : []);
  const porDescubrir = shuffleInPlace(allStories.filter((s) => !leidos.has(s.id))).slice(0, 14);

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
  if (leidos.size && porDescubrir.length) {
    container.appendChild(createCarouselRow("🗺️ Aún no los has leído", porDescubrir, ""));
  }
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

/** Mismo cuento para todos durante el día (cambia a medianoche). */
function storyOfTheDay(stories) {
  const sorted = stories.slice().sort((a, b) => a.id - b.id);
  const d = new Date();
  const seed = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return sorted[seed % sorted.length];
}

function renderStoryOfTheDay(stories) {
  const art = document.querySelector(".home-hero__art");
  if (!art || !stories.length) return;
  const story = storyOfTheDay(stories);
  const card = document.createElement("article");
  card.className = "story-of-day";
  card.setAttribute("aria-label", "Cuento del día: " + story.titulo);

  const img = document.createElement("img");
  img.className = "story-of-day__img";
  img.alt = "";
  img.decoding = "async";
  img.src = normalizeStoryMediaUrl(story.portada);

  const body = document.createElement("div");
  body.className = "story-of-day__body";
  const badge = document.createElement("span");
  badge.className = "story-of-day__badge";
  badge.textContent = "📅 Cuento del día";
  const h = document.createElement("h2");
  h.className = "story-of-day__title";
  h.textContent = story.titulo;
  const desc = document.createElement("p");
  desc.className = "story-of-day__desc";
  desc.textContent = story.descripcion || "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "story-of-day__btn";
  btn.innerHTML = '<span aria-hidden="true">▶</span> Leer ahora';
  btn.addEventListener("click", () => navigateToStory(story));
  const progreso = window.CUCRewards ? window.CUCRewards.get(story.id) : null;
  if (progreso && progreso.leido) {
    const st = document.createElement("span");
    st.className = "story-of-day__stars";
    st.textContent = window.CUCRewards.starString(progreso.estrellas || 0);
    body.append(badge, h, desc, st, btn);
  } else {
    body.append(badge, h, desc, btn);
  }
  card.append(img, body);
  card.addEventListener("click", (e) => {
    if (e.target !== btn) navigateToStory(story);
  });
  art.appendChild(card);
  art.classList.add("has-story-of-day");
}

function renderSkeleton(container) {
  if (!container) return;
  const row = document.createElement("section");
  row.className = "home-row home-row--skeleton";
  row.setAttribute("aria-hidden", "true");
  row.innerHTML =
    '<div class="skeleton skeleton--title"></div><div class="home-carousel__track">' +
    '<div class="skeleton skeleton--card"></div>'.repeat(6) +
    "</div>";
  container.appendChild(row);
}

async function init() {
  renderSkeleton(document.getElementById("home-rows"));
  const stories = await fetchStories();
  shuffleInPlace(stories);
  window.__CUC_STORIES__ = stories;

  const btnRandom = document.getElementById("btn-random-story");
  const contenedor = document.getElementById("contenedor-por-categoria");
  const rowsEl = document.getElementById("home-rows");

  if (!stories.length) {
    if (rowsEl) rowsEl.innerHTML = "";
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

  renderStoryOfTheDay(stories);
  renderNetflixRows(rowsEl, stories);
  renderCatalogGrid(stories);
  wireFilters();
}

document.addEventListener("DOMContentLoaded", init);
