"use client";

import { useEffect, useState } from "react";
import GestaoLayout from "@/components/GestaoLayout";
import { formatarMoeda } from "@/lib/pricing";

export default function CaixaPage() {
  const [dados, setDados] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [novoValor, setNovoValor] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaForma, setNovaForma] = useState("dinheiro");
  const [fechando, setFechando] = useState(false);
  const [mensagemFechamento, setMensagemFechamento] = useState("");
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const [respCaixa, respHistorico] = await Promise.all([
      fetch("/api/caixa"),
      fetch("/api/fechamento"),
    ]);
    setDados(await respCaixa.json());
    setHistorico((await respHistorico.json()).historico || []);
  }

  async function lancarSaida() {
    if (!novoValor) return;
    await fetch("/api/caixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "saida",
        valor: Number(novoValor),
        forma_pagamento: novaForma,
        descricao: novaDescricao || "Saída manual",
      }),
    });
    setNovoValor("");
    setNovaDescricao("");
    carregar();
  }

  async function fecharDiaAgora() {
    setFechando(true);
    setMensagemFechamento("");
    const resp = await fetch("/api/fechamento", { method: "POST" });
    const json = await resp.json();
    setFechando(false);
    setConfirmandoFechamento(false);

    if (resp.ok) {
      setMensagemFechamento("Dia fechado com sucesso. Placas e detalhes de hoje foram apagados.");
      carregar();
    } else {
      setMensagemFechamento(json.erro || "Erro ao fechar o dia.");
    }
  }

  if (!dados) return <GestaoLayout><p className="text-muted">Carregando...</p></GestaoLayout>;

  return (
    <GestaoLayout>
      <h1 className="text-2xl font-extrabold mb-4">Caixa de hoje</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <ResumoCard label="Dinheiro" valor={dados.resumo.dinheiro} />
        <ResumoCard label="Cartão" valor={dados.resumo.cartao} />
        <ResumoCard label="Pix" valor={dados.resumo.pix} />
        <ResumoCard label="Total" valor={dados.resumo.total} destaque />
      </div>

      <details className="mb-6 rounded-xl2 bg-surface border border-white/10 p-4">
        <summary className="font-bold cursor-pointer">Lançar saída de caixa (troco, despesa...)</summary>
        <div className="flex flex-col gap-3 mt-3">
          <input
            type="number"
            placeholder="Valor"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            className="bg-base border border-white/10 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={novaDescricao}
            onChange={(e) => setNovaDescricao(e.target.value)}
            className="bg-base border border-white/10 rounded-lg px-3 py-2"
          />
          <select
            value={novaForma}
            onChange={(e) => setNovaForma(e.target.value)}
            className="bg-base border border-white/10 rounded-lg px-3 py-2"
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="pix">Pix</option>
          </select>
          <button onClick={lancarSaida} className="bg-danger text-white font-bold rounded-lg py-2">
            Lançar saída
          </button>
        </div>
      </details>

      <h2 className="text-lg font-bold mb-2">Movimentos de hoje</h2>
      <div className="flex flex-col gap-2 mb-6">
        {dados.movimentos.length === 0 && (
          <p className="text-muted text-sm py-4">Nenhum movimento ainda hoje.</p>
        )}
        {dados.movimentos.map((mov) => (
          <div
            key={mov.id}
            className="rounded-xl2 bg-surface border border-white/10 p-3 flex justify-between items-center"
          >
            <div>
              <div className="text-sm font-semibold">{mov.descricao}</div>
              <div className="text-xs text-muted">
                {new Date(mov.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" · "}{mov.forma_pagamento}
              </div>
            </div>
            <div className={`font-bold ${mov.tipo === "saida" ? "text-danger" : "text-accent2"}`}>
              {mov.tipo === "saida" ? "-" : "+"}{formatarMoeda(mov.valor)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl2 border-2 border-danger/50 bg-surface p-4 mb-6">
        <h2 className="text-lg font-bold mb-1">Fechar o dia</h2>
        <p className="text-xs text-muted mb-3">
          Soma o caixa de hoje, guarda o resumo financeiro para sempre, e apaga as
          placas e detalhes dos carros de hoje. Não afeta carros que ainda estão no pátio.
          Isso também acontece automaticamente todo dia à meia-noite.
        </p>

        {!confirmandoFechamento ? (
          <button
            onClick={() => setConfirmandoFechamento(true)}
            className="bg-danger text-white font-bold rounded-lg py-2 px-4 w-full"
          >
            Fechar o dia agora
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-danger">
              Isso vai apagar as placas e detalhes dos carros de hoje para sempre
              (sem volta). Tem certeza?
            </p>
            <button
              onClick={fecharDiaAgora}
              disabled={fechando}
              className="bg-danger text-white font-bold rounded-lg py-2 px-4 w-full"
            >
              {fechando ? "Fechando..." : "Sim, apagar as placas e fechar o dia"}
            </button>
            <button
              onClick={() => setConfirmandoFechamento(false)}
              disabled={fechando}
              className="bg-surface border border-white/10 text-ink font-bold rounded-lg py-2 px-4 w-full"
            >
              Cancelar
            </button>
          </div>
        )}

        {mensagemFechamento && (
          <p className="text-xs mt-2 text-accent2 font-semibold">{mensagemFechamento}</p>
        )}
      </div>

      <h2 className="text-lg font-bold mb-2">Histórico financeiro (sem placas)</h2>
      <div className="flex flex-col gap-2">
        {historico.length === 0 && (
          <p className="text-muted text-sm py-4">Nenhum dia fechado ainda.</p>
        )}
        {historico.map((dia) => (
          <div
            key={dia.id}
            className="rounded-xl2 bg-surface border border-white/10 p-3 flex justify-between items-center"
          >
            <div>
              <div className="text-sm font-semibold">
                {new Date(dia.data + "T00:00:00").toLocaleDateString("pt-BR")}
              </div>
              <div className="text-xs text-muted">{dia.qtd_veiculos} carros atendidos</div>
            </div>
            <div className="font-bold text-accent">{formatarMoeda(dia.total_geral)}</div>
          </div>
        ))}
      </div>
    </GestaoLayout>
  );
}

function ResumoCard({ label, valor, destaque }) {
  return (
    <div className={`rounded-xl2 border border-white/10 p-4 ${destaque ? "bg-accent text-base" : "bg-surface"}`}>
      <div className="text-2xl font-black">{formatarMoeda(valor)}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
