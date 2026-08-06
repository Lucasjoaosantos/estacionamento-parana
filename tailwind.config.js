/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0A",        // preto - fundo (igual a logo)
        surface: "#1B1B1B",      // cinza bem escuro - cartões
        accent: "#F2C230",       // dourado/amarelo - ações principais (igual a logo)
        accent2: "#3FA860",      // verde - pagamento/confirmar
        danger: "#E5484D",       // vermelho - sair/cancelar
        ink: "#F5F5F5",          // branco - texto (igual a logo)
        muted: "#9A9A9A",
      },
      fontSize: {
        giant: ["4.5rem", { lineHeight: "1.05" }],
        huge: ["3rem", { lineHeight: "1.1" }],
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};
