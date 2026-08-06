"use client";

import { useRouter } from "next/navigation";

export default function EscolherModoPage() {
  const router = useRouter();

  function escolher(modo) {
    localStorage.setItem("modoTela", modo);
    router.push(modo === "operacao" ? "/operacao" : "/gestao");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-10">
      <h1 className="text-huge font-extrabold text-center">
        Como este aparelho vai ser usado?
      </h1>
      <p className="text-2xl text-muted text-center max-w-xl">
        Essa escolha fica salva neste aparelho. Pode trocar depois em Configurações.
      </p>

      <div className="grid gap-6 w-full max-w-2xl">
        <button
          onClick={() => escolher("operacao")}
          className="rounded-xl2 bg-accent text-base px-8 py-10 text-4xl font-extrabold text-left"
        >
          Tela grande e simples
          <div className="text-xl font-medium mt-2">
            Para quem opera o estacionamento no dia a dia (letras grandes, teclado na tela)
          </div>
        </button>

        <button
          onClick={() => escolher("gestao")}
          className="rounded-xl2 bg-surface border-2 border-white/10 px-8 py-10 text-4xl font-extrabold text-left"
        >
          Painel de gestão
          <div className="text-xl font-medium mt-2 text-muted">
            Para acompanhar o movimento, o caixa e as configurações pelo celular
          </div>
        </button>
      </div>
    </main>
  );
}
