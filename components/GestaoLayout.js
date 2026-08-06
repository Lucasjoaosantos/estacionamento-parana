"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ABAS = [
  { href: "/gestao", label: "Visão geral" },
  { href: "/caixa", label: "Caixa" },
  { href: "/gestao/configuracoes", label: "Tarifas" },
];

export default function GestaoLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  function sair() {
    localStorage.removeItem("usuarioLogado");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 bg-base z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Estacionamento Paraná" className="w-8 h-8 rounded-md" />
          <span className="font-extrabold text-lg">Estacionamento Paraná</span>
        </div>
        <button onClick={sair} className="text-sm font-semibold text-muted underline">
          Sair
        </button>
      </header>

      <nav className="flex border-b border-white/10 overflow-x-auto">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
              pathname === aba.href
                ? "text-accent border-b-2 border-accent"
                : "text-muted"
            }`}
          >
            {aba.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 px-4 py-5 max-w-3xl w-full mx-auto">{children}</main>
    </div>
  );
}
