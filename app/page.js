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
    router.push("/gestao");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-2xl text-muted">Carregando...</p>
    </main>
  );
}
