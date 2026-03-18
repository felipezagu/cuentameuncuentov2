async function loadStories() {
  const res = await fetch("/api/stories/");
  if (!res.ok) return [];
  return await res.json();
}

function renderStoriesList(stories) {
  const list = document.getElementById("stories-list");
  list.innerHTML = "";
  if (!stories.length) {
    list.textContent = "No hay cuentos todavía. Crea uno nuevo.";
    return;
  }
  stories.forEach((s) => {
    const row = document.createElement("button");
    row.className =
      "w-full text-left px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 flex items-center justify-between gap-2";
    row.textContent = s.titulo;
    row.onclick = () => loadStoryIntoForm(s.id);
    list.appendChild(row);
  });
}

async function loadAdminStoriesTable() {
  const tbody = document.getElementById("admin-stories-table-body");
  if (!tbody) return;
  try {
    const res = await fetch("/api/admin/stories");
    if (!res.ok) {
      tbody.innerHTML = "<tr><td colspan='5' class='px-2 py-2 text-slate-500'>No se pudo cargar la tabla.</td></tr>";
      return;
    }
    const rows = await res.json();
    tbody.innerHTML = "";
    if (!rows.length) {
      tbody.innerHTML = "<tr><td colspan='5' class='px-2 py-2 text-slate-500'>No hay cuentos.</td></tr>";
      return;
    }
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-purple-100 hover:bg-purple-50/80";
      let estado = "No";
      if (r.escenas_total === 0) estado = "—";
      else if (r.luma_completo) estado = "Sí";
      else estado = `${r.escenas_con_imagen}/${r.escenas_total}`;
      const estadoClass = r.luma_completo ? "text-emerald-600 font-medium" : (r.escenas_con_imagen > 0 ? "text-amber-600" : "text-slate-500");
      const revisado = !!r.luma_revisado;
      tr.innerHTML = `
        <td class="px-2 py-1.5 text-slate-600">${r.id}</td>
        <td class="px-2 py-1.5 font-medium text-purple-900">${escapeHtml(r.titulo)}</td>
        <td class="px-2 py-1.5 ${estadoClass}">${estado}</td>
        <td class="px-2 py-1.5"><input type="checkbox" class="luma-revisado-cb rounded border-purple-300 text-emerald-500 focus:ring-emerald-400" data-id="${r.id}" ${revisado ? "checked" : ""} title="Marcar como hecho"></td>
        <td class="px-2 py-1.5"><button type="button" class="text-sky-600 hover:underline edit-row-btn" data-id="${r.id}">Editar</button></td>
      `;
      tr.querySelector(".edit-row-btn").addEventListener("click", () => loadStoryIntoForm(r.id));
      tr.querySelector(".luma-revisado-cb").addEventListener("change", (e) => setLumaRevisado(r.id, e.target.checked));
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = "<tr><td colspan='5' class='px-2 py-2 text-slate-500'>Error al cargar.</td></tr>";
  }
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

async function setLumaRevisado(storyId, revisado) {
  try {
    const res = await fetch(`/api/admin/stories/${storyId}/luma-revisado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisado }),
    });
    if (!res.ok) throw new Error();
  } catch {
    const tbody = document.getElementById("admin-stories-table-body");
    if (tbody) tbody.innerHTML = "<tr><td colspan='5' class='px-2 py-2 text-rose-500'>Error al guardar. Recarga la página.</td></tr>";
  }
}

function updateGoogleImagesLink() {
  const link = document.getElementById("btn-search-cover");
  const titleInput = document.getElementById("story-title-input");
  if (!link || !titleInput) return;
  const query = (titleInput.value || "cuento infantil").trim() + " cuento ilustración portada";
  link.href = "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(query);
}

async function loadStoryIntoForm(id) {
  const res = await fetch(`/api/stories/${id}`);
  if (!res.ok) return;
  const story = await res.json();
  document.getElementById("story-id").value = story.id;
  document.getElementById("story-title-input").value = story.titulo;
  document.getElementById("story-description-input").value = story.descripcion || "";
  document.getElementById("story-cover-input").value = story.portada || "";
  document.getElementById("story-category-input").value = story.categoria || "";
  document.getElementById("story-featured-input").checked = !!story.destacado;
  updateGoogleImagesLink();

  const scenesContainer = document.getElementById("scenes-container");
  scenesContainer.innerHTML = "";
  story.escenas.forEach((esc, idx) => {
    addSceneRow(esc.texto, esc.imagen || "", esc.orden || idx + 1);
  });
}

function addSceneRow(text = "", image = "", order = 1) {
  const container = document.getElementById("scenes-container");
  const row = document.createElement("div");
  row.className =
    "flex items-start gap-2 bg-purple-50 rounded-2xl px-2 py-2 border border-purple-100";
  row.innerHTML = `
    <input type="number" min="1" value="${order}" class="w-14 px-2 py-1 rounded-xl border border-purple-100 text-xs scene-order">
    <textarea rows="2" class="flex-1 px-2 py-1 rounded-xl border border-purple-100 text-xs scene-text" placeholder="Texto de la escena">${text}</textarea>
    <div class="flex flex-col gap-1">
      <input type="text" value="${image}" placeholder="img ruta" class="w-28 px-2 py-1 rounded-xl border border-purple-100 text-[11px] scene-image">
      <button type="button" class="text-[11px] text-rose-500 hover:underline self-end remove-scene">Quitar</button>
    </div>
  `;
  row.querySelector(".remove-scene").addEventListener("click", () => {
    row.remove();
  });
  container.appendChild(row);
}

async function saveStory(e) {
  e.preventDefault();
  const id = document.getElementById("story-id").value;
  const payload = {
    titulo: document.getElementById("story-title-input").value,
    descripcion: document.getElementById("story-description-input").value,
    portada: document.getElementById("story-cover-input").value || null,
    categoria: document.getElementById("story-category-input").value || null,
    ambiente: null,
    destacado: document.getElementById("story-featured-input").checked,
    escenas: [],
  };

  const sceneRows = document.querySelectorAll("#scenes-container > div");
  sceneRows.forEach((row, idx) => {
    const orden =
      parseInt(row.querySelector(".scene-order").value || String(idx + 1), 10) ||
      idx + 1;
    const texto = row.querySelector(".scene-text").value;
    const imagen = row.querySelector(".scene-image").value || null;
    if (texto.trim()) {
      payload.escenas.push({ orden, texto, imagen });
    }
  });

  const statusEl = document.getElementById("admin-status");
  try {
    const url = id ? `/api/admin/stories/${id}` : "/api/admin/stories";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    statusEl.textContent = "Cuento guardado correctamente.";
    const stories = await loadStories();
    renderStoriesList(stories);
    await loadAdminStoriesTable();
  } catch {
    statusEl.textContent = "Error al guardar el cuento.";
  }
}

async function deleteStory() {
  const id = document.getElementById("story-id").value;
  if (!id) return;
  if (!confirm("¿Eliminar este cuento y todas sus escenas?")) return;
  try {
    const res = await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    document.getElementById("story-form").reset();
    document.getElementById("scenes-container").innerHTML = "";
    document.getElementById("story-id").value = "";
    document.getElementById("admin-status").textContent = "Cuento eliminado.";
    const stories = await loadStories();
    renderStoriesList(stories);
    await loadAdminStoriesTable();
  } catch {
    document.getElementById("admin-status").textContent = "No se pudo eliminar.";
  }
}

async function initAdmin() {
  const stories = await loadStories();
  renderStoriesList(stories);
  await loadAdminStoriesTable();
  updateGoogleImagesLink();

  const titleInput = document.getElementById("story-title-input");
  if (titleInput) titleInput.addEventListener("input", updateGoogleImagesLink);

  const btnAddScene = document.getElementById("btn-add-scene");
  if (btnAddScene) btnAddScene.addEventListener("click", () => addSceneRow());

  const form = document.getElementById("story-form");
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); saveStory(e); });

  const btnDelete = document.getElementById("btn-delete-story");
  if (btnDelete) btnDelete.addEventListener("click", deleteStory);

  const btnNew = document.getElementById("btn-new-story");
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      document.getElementById("story-form").reset();
      document.getElementById("scenes-container").innerHTML = "";
      document.getElementById("story-id").value = "";
      updateGoogleImagesLink();
    });
  }

  const btnGemini = document.getElementById("btn-gemini-prompts");
  if (btnGemini) {
    btnGemini.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      showGeminiPrompts();
    });
  }

  const btnLuma = document.getElementById("btn-luma-generate");
  if (btnLuma) {
    btnLuma.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      generateWithLuma();
    });
  }

  const lumaClose = document.getElementById("luma-modal-close");
  if (lumaClose) {
    lumaClose.addEventListener("click", () => {
      const modal = document.getElementById("luma-modal");
      if (modal) modal.classList.add("hidden");
    });
  }

  const btnExport = document.getElementById("btn-export-cuentos");
  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/admin/export-cuentos");
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cuentos.json";
        a.click();
        URL.revokeObjectURL(url);
        document.getElementById("admin-status").textContent = "Descarga iniciada.";
      } catch {
        document.getElementById("admin-status").textContent = "Error al descargar.";
      }
    });
  }

  const inputImport = document.getElementById("input-import-cuentos");
  if (inputImport) {
    inputImport.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const statusEl = document.getElementById("admin-status");
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const res = await fetch("/api/admin/import-cuentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          statusEl.textContent = result.detail || "Error al importar.";
          return;
        }
        statusEl.textContent = "Importados " + (result.importados ?? 0) + " cuentos.";
        const stories = await loadStories();
        renderStoriesList(stories);
      } catch (err) {
        document.getElementById("admin-status").textContent = "Archivo JSON inválido o error al cargar.";
      }
      inputImport.value = "";
    });
  }
}

async function showGeminiPrompts() {
  const id = document.getElementById("story-id").value;
  const statusEl = document.getElementById("admin-status");
  if (!id) {
    statusEl.textContent = "Selecciona un cuento primero.";
    return;
  }
  try {
    const res = await fetch(`/api/admin/stories/${id}/gemini-prompts`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      statusEl.textContent = data.detail || "No se pudieron obtener los prompts.";
      return;
    }
    const lines = [];
    data.prompts.forEach((p) => {
      lines.push(`# Escena ${p.orden}`);
      lines.push(p.prompt_gemini);
      lines.push("");
    });
    const text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = "Prompts copiados al portapapeles. Pégalos en gemini.google.com.";
    } else {
      statusEl.textContent = "Prompts generados. Se abrirá una ventana nueva.";
      const w = window.open("", "_blank");
      if (w) {
        w.document.write("<pre style='white-space: pre-wrap; font-family: system-ui, sans-serif; font-size: 13px;'>" +
          text.replace(/</g, "&lt;") +
          "</pre>");
        w.document.close();
      }
    }
  } catch (e) {
    statusEl.textContent = "Error al obtener los prompts para Gemini.";
  }
}

async function generateWithLuma() {
  const id = document.getElementById("story-id").value;
  const statusEl = document.getElementById("admin-status");
  if (!id) {
    statusEl.textContent = "Selecciona un cuento primero.";
    return;
  }
  statusEl.textContent = "Generando imágenes con Luma. Esto puede tardar unos minutos...";
  const modal = document.getElementById("luma-modal");
  const modalText = document.getElementById("luma-modal-text");
  const modalPreview = document.getElementById("luma-modal-preview");
  if (modal) modal.classList.remove("hidden");
  if (modalText) modalText.textContent = "Generando imágenes con Luma. Esto puede tardar unos minutos...";
  if (modalPreview) modalPreview.innerHTML = "";
  try {
    const res = await fetch(`/api/admin/stories/${id}/luma-generate`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      statusEl.textContent = data.detail || "No se pudieron generar las imágenes con Luma.";
      if (modalText) modalText.textContent = statusEl.textContent;
      return;
    }
    statusEl.textContent = `Generadas ${data.total_generadas} imágenes con Luma.`;
    if (modalText) modalText.textContent = statusEl.textContent;
    if (modalPreview && Array.isArray(data.escenas)) {
      data.escenas.forEach((e) => {
        if (!e.imagen) return;
        const a = document.createElement("a");
        a.href = e.imagen;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200";
        const span = document.createElement("span");
        span.textContent = `Escena ${e.orden}`;
        a.appendChild(span);
        modalPreview.appendChild(a);
      });
      if (data.escenas.length > 0 && data.escenas[0].imagen) {
        window.open(data.escenas[0].imagen, "_blank");
      }
    }
    // Recargar el cuento en el formulario y la tabla de seguimiento
    await loadStoryIntoForm(id);
    await loadAdminStoriesTable();
  } catch (e) {
    statusEl.textContent = "Error al generar imágenes con Luma.";
    const modalText = document.getElementById("luma-modal-text");
    if (modalText) modalText.textContent = statusEl.textContent;
  }
}

document.addEventListener("DOMContentLoaded", initAdmin);

