(() => {
  const btn = document.getElementById("toggle-theme");
  if (!btn) return;

  const apply = (mode) => {
    if (mode === "dark") {
      document.body.classList.add("dark-mode");
      btn.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-mode");
      btn.textContent = "🌙";
    }
    window.localStorage.setItem("cuc_theme", mode);
  };

  const stored = window.localStorage.getItem("cuc_theme");
  if (stored === "dark" || stored === "light") {
    apply(stored);
  } else {
    apply("dark");
  }

  btn.addEventListener("click", () => {
    const nextMode = document.body.classList.contains("dark-mode") ? "light" : "dark";
    apply(nextMode);
  });
})();
