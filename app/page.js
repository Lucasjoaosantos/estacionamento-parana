"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const usuario = localStorage.getItem("usuarioLogado");
    if (!usuario) {
      router.push("/login");
      return;
    }
    const modo = localStorage.getItem("modoTela");
    if (modo === "operacao") router.push("/operacao");
    else if (modo === "gestao") router.push("/gestao");
    else router.push("/escolher-modo");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-2xl text-muted">Carregando...</p>
    </main>
  );
}
