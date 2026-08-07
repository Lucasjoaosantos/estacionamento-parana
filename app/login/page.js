"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TecladoVirtual from "@/components/TecladoVirtual";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [campoAtivo, setCampoAtivo] = useState("usuario"); // "usuario" | "senha"
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const valorCampoAtivo = campoAtivo === "usuario" ? usuario : senha;
  const setValorCampoAtivo = campoAtivo === "usuario" ? setUsuario : setSenha;

  async function entrar() {
    setErro("");
    setCarregando(true);
    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Não foi possível entrar.");
        setCarregando(false);
        return;
      }
      localStorage.setItem("usuarioLogado", JSON.stringify(json.usuario));
      router.push("/gestao");
    } catch (e) {
      setErro("Erro de conexão. Verifique a internet.");
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 gap-5 sm:gap-8">
      <img src="/logo.jpg" alt="Estacionamento Paraná" className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl" />
      <h1 className="text-2xl sm:text-huge font-extrabold text-center">Entrar no sistema</h1>

      <div className="w-full max-w-xl flex flex-col gap-3 sm:gap-4">
        <button
          onClick={() => setCampoAtivo("usuario")}
          className={`text-left px-4 sm:px-6 py-4 sm:py-5 rounded-xl2 border-2 text-xl sm:text-3xl font-semibold break-all
            ${campoAtivo === "usuario" ? "border-accent" : "border-white/10"} bg-surface`}
        >
          Usuário: <span className="text-accent">{usuario || "____"}</span>
        </button>

        <button
          onClick={() => setCampoAtivo("senha")}
          className={`text-left px-4 sm:px-6 py-4 sm:py-5 rounded-xl2 border-2 text-xl sm:text-3xl font-semibold break-all
            ${campoAtivo === "senha" ? "border-accent" : "border-white/10"} bg-surface`}
        >
          Senha: <span className="text-accent">{"•".repeat(senha.length) || "____"}</span>
        </button>

        {erro && (
          <p className="text-danger text-lg sm:text-2xl font-bold text-center">{erro}</p>
        )}
      </div>

      <div className="w-full max-w-xl">
        <TecladoVirtual
          valor={valorCampoAtivo}
          onChange={setValorCampoAtivo}
          maxLength={20}
          onConfirmar={entrar}
          labelConfirmar={carregando ? "ENTRANDO..." : "ENTRAR"}
        />
      </div>
    </main>
  );
}
