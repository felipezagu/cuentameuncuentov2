(function () {
  var bubblesLayer = document.getElementById("bubbles-layer");
  var starsLayer = document.getElementById("stars-layer");
  if (!bubblesLayer || !starsLayer) return;

  var colors = ["#FF6B9D", "#FFD93D", "#6EC6F5", "#72D47E", "#C084FC", "#FF9F43", "#5CE0C6"];

  for (var i = 0; i < 14; i++) {
    var b = document.createElement("div");
    b.className = "bubble";
    var size = 40 + Math.random() * 100;
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.background = colors[i % colors.length];
    b.style.left = Math.random() * 100 + "vw";
    b.style.animationDuration = 12 + Math.random() * 18 + "s";
    b.style.animationDelay = -Math.random() * 20 + "s";
    bubblesLayer.appendChild(b);
  }

  var emojis = ["⭐", "✨", "💫", "🌟", "⚡"];
  for (var j = 0; j < 30; j++) {
    var s = document.createElement("span");
    s.className = "star";
    s.textContent = emojis[j % emojis.length];
    s.style.left = Math.random() * 95 + "vw";
    s.style.top = Math.random() * 90 + "vh";
    s.style.animationDelay = Math.random() * 3 + "s";
    s.style.fontSize = 0.9 + Math.random() * 1.2 + "rem";
    starsLayer.appendChild(s);
  }
})();

