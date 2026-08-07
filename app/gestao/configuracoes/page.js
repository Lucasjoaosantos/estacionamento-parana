"use client";

import { useEffect, useState } from "react";
import GestaoLayout from "@/components/GestaoLayout";

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((json) => setConfig(json.config));
  }, []);

  async function salvar() {
    setSalvo(false);
    const resp = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (resp.ok) setSalvo(true);
  }

  if (!config) return <GestaoLayout><p className="text-muted">Carregando...</p></GestaoLayout>;

  return (
    <GestaoLayout>
      <h1 className="text-2xl font-extrabold mb-4">Tarifas do rotativo</h1>

      <div className="flex flex-col gap-4 max-w-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Valor da 1ª hora (R$)</span>
          <input
            type="number"
            value={config.valor_primeira_hora}
            onChange={(e) => setConfig({ ...config, valor_primeira_hora: e.target.value })}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Valor de cada hora adicional (R$)</span>
          <input
            type="number"
            value={config.valor_hora_adicional}
            onChange={(e) => setConfig({ ...config, valor_hora_adicional: e.target.value })}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Tolerância antes de cobrar hora cheia (minutos)</span>
          <input
            type="number"
            value={config.tolerancia_minutos}
            onChange={(e) => setConfig({ ...config, tolerancia_minutos: e.target.value })}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-lg"
          />
        </label>

        <button
          onClick={salvar}
          className="mt-2 bg-accent text-base font-bold rounded-lg py-3"
        >
          Salvar
        </button>
        {salvo && <p className="text-accent2 text-sm font-semibold">Salvo com sucesso!</p>}
      </div>
    </GestaoLayout>
  );
}
