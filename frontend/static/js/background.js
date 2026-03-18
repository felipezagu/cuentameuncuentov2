(function () {
  var bgLayer = document.getElementById("bg-layer");
  var starsLayer = document.getElementById("stars-layer");
  if (!bgLayer || !starsLayer) return;

  bgLayer.style.background = "#F9FAFB";

  var starCount = 320;
  for (var i = 0; i < starCount; i++) {
    var star = document.createElement("div");
    star.className = "bg-star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.width = (1.2 + Math.random() * 2.2) + "px";
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 4 + "s";
    star.style.animationDuration = (2 + Math.random() * 2) + "s";
    starsLayer.appendChild(star);
  }
})();
