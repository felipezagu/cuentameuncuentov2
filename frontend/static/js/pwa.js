/**
 * App instalable: registra el service worker y muestra "Instalar app" cuando el navegador lo permite.
 */
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  let deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    const btn = document.getElementById("btn-install-app");
    if (btn) btn.classList.remove("hidden");
  });

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("btn-install-app");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () {
        deferred = null;
        btn.classList.add("hidden");
      });
    });
  });

  window.addEventListener("appinstalled", function () {
    const btn = document.getElementById("btn-install-app");
    if (btn) btn.classList.add("hidden");
  });
})();
