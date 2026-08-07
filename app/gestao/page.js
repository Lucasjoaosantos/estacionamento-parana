"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GestaoLayout from "@/components/GestaoLayout";
import { formatarMoeda, formatarDuracao, calcularPermanencia } from "@/lib/pricing";

export default function GestaoPage() {
  const router = useRouter();
  const [carros, setCarros] = useState([]);
  const [resumoCaixa, setResumoCaixa] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("usuarioLogado")) {
      router.push("/login");
      return;
    }
    carregar();
    const intervalo = setInterval(carregar, 20000);
    return () => clearInterval(intervalo);
  }, [router]);

  async function carregar() {
    const [respCarros, respCaixa] = await Promise.all([
      fetch("/api/rotativo?status=ativo"),
      fetch("/api/caixa"),
    ]);
    setCarros((await respCarros.json()).rotativo || []);
    setResumoCaixa((await respCaixa.json()).resumo || null);
  }

  return (
    <GestaoLayout>
      <h1 className="text-2xl font-extrabold mb-4">Visão geral</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl2 bg-surface border border-white/10 p-4">
          <div className="text-3xl font-black text-accent">{carros.length}</div>
          <div className="text-sm text-muted">carros no pátio</div>
        </div>
        <div className="rounded-xl2 bg-surface border border-white/10 p-4">
          <div className="text-3xl font-black text-accent2">
            {formatarMoeda(resumoCaixa?.total || 0)}
          </div>
          <div className="text-sm text-muted">faturado hoje</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">Carros no pátio agora</h2>
      <div className="flex flex-col gap-2">
        {carros.length === 0 && (
          <p className="text-muted text-sm py-4">Nenhum carro no pátio.</p>
        )}
        {carros.map((carro) => {
          const minutos = calcularPermanencia(carro.entrada, new Date());
          return (
            <div
              key={carro.id}
              className="rounded-xl2 bg-surface border border-white/10 p-4 flex flex-wrap gap-2 justify-between items-center"
            >
              <div className="min-w-0">
                <div className="text-xl font-black tracking-widest">{carro.placa}</div>
                <div className="text-xs text-muted">
                  entrada {new Date(carro.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="text-sm font-semibold text-accent shrink-0">
                {formatarDuracao(minutos)}
              </div>
            </div>
          );
        })}
      </div>
    </GestaoLayout>
  );
}
