import "./globals.css";

export const metadata = {
  title: "Estacionamento Paraná",
  description: "Controle de rotativo e caixa",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-base text-ink">{children}</body>
    </html>
  );
}
