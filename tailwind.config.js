/**
 * Tailwind compilado localmente (antes se usaba cdn.tailwindcss.com, que no es para producción).
 * Tras cambiar clases en plantillas o JS ejecuta:  npm run build:css
 * y sube el archivo generado frontend/static/css/tailwind.css.
 */
module.exports = {
  content: ["./frontend/templates/**/*.html", "./frontend/static/js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ["Fredoka", "Nunito", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
