/**
 * Estrellas y álbum de cuentos leídos (solo en este navegador, sin cuentas).
 *
 * Por cuento se guarda: { leido: true, estrellas: 0..3, aciertos, total, fecha }
 *  - 1 estrella por terminar el cuento
 *  - +1 si responde bien al menos la mitad del quiz
 *  - +1 si acierta todo el quiz
 */
(function () {
  const KEY = "cuc_album_v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // Sin storage (modo privado): las estrellas duran solo esta visita.
    }
  }

  function entry(data, id) {
    const k = String(id);
    if (!data[k]) data[k] = { leido: false, estrellas: 0, aciertos: 0, total: 0, fecha: null };
    return data[k];
  }

  function starsFor(e) {
    let n = e.leido ? 1 : 0;
    if (e.total > 0 && e.aciertos * 2 >= e.total) n += 1;
    if (e.total > 0 && e.aciertos === e.total) n += 1;
    return n;
  }

  /** Marca el cuento como leído. Devuelve cuántas estrellas nuevas ganó (0 o 1). */
  function markRead(id) {
    if (id == null) return 0;
    const data = load();
    const e = entry(data, id);
    const before = e.estrellas || 0;
    e.leido = true;
    e.fecha = new Date().toISOString().slice(0, 10);
    e.estrellas = Math.max(before, starsFor(e));
    save(data);
    return e.estrellas - before;
  }

  /** Guarda el resultado del quiz (se queda con el mejor intento). Devuelve estrellas nuevas. */
  function saveQuiz(id, aciertos, total) {
    if (id == null || !total) return 0;
    const data = load();
    const e = entry(data, id);
    const before = e.estrellas || 0;
    e.leido = true;
    if (aciertos >= (e.aciertos || 0)) {
      e.aciertos = aciertos;
      e.total = total;
    }
    e.estrellas = Math.max(before, starsFor(e));
    save(data);
    return e.estrellas - before;
  }

  function get(id) {
    return load()[String(id)] || null;
  }

  function summary() {
    const data = load();
    const ids = Object.keys(data).filter(function (k) { return data[k] && data[k].leido; });
    const estrellas = ids.reduce(function (acc, k) { return acc + (data[k].estrellas || 0); }, 0);
    return { leidos: ids.map(Number), estrellas: estrellas };
  }

  /** "★★☆" para mostrar en tarjetas. */
  function starString(n, max) {
    const m = max || 3;
    let s = "";
    for (let i = 0; i < m; i++) s += i < n ? "★" : "☆";
    return s;
  }

  window.CUCRewards = {
    markRead: markRead,
    saveQuiz: saveQuiz,
    get: get,
    summary: summary,
    starString: starString,
  };
})();
