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

function createStoryCard(story) {
  const card = document.createElement("div");
  card.className = "story-card";
  card.style.cursor = "pointer";
  card.dataset.categoria = (story.categoria || "").trim();

  const cover = document.createElement("div");
  cover.className = "story-card-cover";
  if (story.portada) {
    cover.style.backgroundImage = `url('${story.portada}')`;
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

