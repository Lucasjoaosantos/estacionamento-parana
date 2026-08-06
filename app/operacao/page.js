"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TecladoVirtual from "@/components/TecladoVirtual";
import { formatarDuracao, formatarMoeda } from "@/lib/pricing";

// Telas possíveis dentro da operação: lista de carros, digitar placa nova,
// e tela de pagamento/saída.
export default function OperacaoPage() {
  const router = useRouter();
  const [tela, setTela] = useState("lista");
  const [carros, setCarros] = useState([]);
  const [placaDigitada, setPlacaDigitada] = useState("");
  const [carroSelecionado, setCarroSelecionado] = useState(null);
  const [valorSugerido, setValorSugerido] = useState(null);
  const [desconto, setDesconto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [agora, setAgora] = useState(new Date());
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");
    if (!dados) {
      router.push("/login");
      return;
    }
    setUsuario(JSON.parse(dados));
  }, [router]);

  const carregarCarros = useCallback(async () => {
    const resp = await fetch("/api/rotativo?status=ativo");
    const json = await resp.json();
    setCarros(json.rotativo || []);
  }, []);

  useEffect(() => {
    carregarCarros();
    const intervalo = setInterval(() => {
      carregarCarros();
      setAgora(new Date());
    }, 15000);
    return () => clearInterval(intervalo);
  }, [carregarCarros]);

  async function confirmarEntrada() {
    if (placaDigitada.length < 6) {
      setMensagem("Digite a placa completa.");
      return;
    }
    setMensagem("");
    const resp = await fetch("/api/rotativo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa: placaDigitada, usuario_id: usuario?.id }),
    });
    if (resp.ok) {
      setPlacaDigitada("");
      setTela("lista");
      carregarCarros();
    } else {
      const json = await resp.json();
      setMensagem(json.erro || "Erro ao registrar entrada.");
    }
  }

  async function abrirPagamento(carro) {
    setCarroSelecionado(carro);
    setDesconto("");
    const resp = await fetch(`/api/rotativo/${carro.id}`);
    const json = await resp.json();
    setValorSugerido(json);
    setTela("pagamento");
  }

  async function confirmarPagamento(forma) {
    const resp = await fetch("/api/rotativo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: carroSelecionado.id,
        forma_pagamento: forma,
        desconto: Number(desconto) || 0,
        usuario_id: usuario?.id,
      }),
    });
    if (resp.ok) {
      setTela("lista");
      setCarroSelecionado(null);
      carregarCarros();
    } else {
      const json = await resp.json();
      setMensagem(json.erro || "Erro ao registrar pagamento.");
    }
  }

  function sair() {
    localStorage.removeItem("usuarioLogado");
    router.push("/login");
  }

  // ---------------------- TELA: NOVO CARRO ----------------------
  if (tela === "novo") {
    return (
      <main className="min-h-screen flex flex-col items-center px-6 py-8 gap-6">
        <h1 className="text-huge font-extrabold">Digite a placa</h1>
        <div className="text-giant font-black text-accent tracking-widest">
          {placaDigitada || "______"}
        </div>
        {mensagem && <p className="text-danger text-2xl font-bold">{mensagem}</p>}
        <div className="w-full max-w-2xl">
          <TecladoVirtual
            valor={placaDigitada}
            onChange={setPlacaDigitada}
            maxLength={7}
            onConfirmar={confirmarEntrada}
            labelConfirmar="REGISTRAR ENTRADA"
          />
        </div>
        <button
          onClick={() => { setTela("lista"); setPlacaDigitada(""); setMensagem(""); }}
          className="mt-2 text-2xl font-bold text-muted underline"
        >
          Cancelar
        </button>
      </main>
    );
  }

  // ---------------------- TELA: PAGAMENTO / SAÍDA ----------------------
  if (tela === "pagamento" && carroSelecionado) {
    const valor = valorSugerido?.valorSugerido || 0;
    const valorComDesconto = Math.max(0, valor - (Number(desconto) || 0));
    return (
      <main className="min-h-screen flex flex-col items-center px-6 py-8 gap-6">
        <h1 className="text-huge font-extrabold">Placa {carroSelecionado.placa}</h1>
        <p className="text-3xl text-muted">
          Tempo: {formatarDuracao(valorSugerido?.minutosTotais || 0)}
        </p>
        <p className="text-giant font-black text-accent">
          {formatarMoeda(valorComDesconto)}
        </p>

        <div className="w-full max-w-xl flex flex-col gap-3">
          <p className="text-2xl font-semibold text-center">Desconto (se houver):</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {[0, 2, 5, 10].map((v) => (
              <button
                key={v}
                onClick={() => setDesconto(String(v))}
                className={`px-6 py-4 rounded-xl2 text-2xl font-bold border-2
                  ${Number(desconto) === v ? "bg-accent text-base border-accent" : "bg-surface border-white/10"}`}
              >
                {v === 0 ? "Sem desconto" : formatarMoeda(v)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-3xl font-bold mt-4">Forma de pagamento:</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xl">
          <button
            onClick={() => confirmarPagamento("dinheiro")}
            className="h-24 rounded-xl2 bg-accent2 text-white text-3xl font-extrabold"
          >
            💵 DINHEIRO
          </button>
          <button
            onClick={() => confirmarPagamento("cartao")}
            className="h-24 rounded-xl2 bg-accent2 text-white text-3xl font-extrabold"
          >
            💳 CARTÃO
          </button>
          <button
            onClick={() => confirmarPagamento("pix")}
            className="h-24 rounded-xl2 bg-accent2 text-white text-3xl font-extrabold"
          >
            📱 PIX
          </button>
        </div>

        {mensagem && <p className="text-danger text-2xl font-bold">{mensagem}</p>}

        <button
          onClick={() => { setTela("lista"); setCarroSelecionado(null); }}
          className="mt-2 text-2xl font-bold text-muted underline"
        >
          Cancelar
        </button>
      </main>
    );
  }

  // ---------------------- TELA: LISTA (padrão) ----------------------
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8 gap-6">
      <div className="w-full flex justify-between items-center max-w-3xl">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Estacionamento Paraná" className="w-14 h-14 rounded-xl" />
          <h1 className="text-4xl font-extrabold">Estacionamento Paraná</h1>
        </div>
        <button onClick={sair} className="text-xl font-bold text-muted underline">
          Sair
        </button>
      </div>

      <button
        onClick={() => setTela("novo")}
        className="w-full max-w-3xl h-28 rounded-xl2 bg-accent text-base text-4xl font-extrabold"
      >
        + NOVO CARRO
      </button>

      <div className="w-full max-w-3xl flex flex-col gap-4">
        {carros.length === 0 && (
          <p className="text-3xl text-muted text-center py-10">
            Nenhum carro no pátio agora.
          </p>
        )}
        {carros.map((carro) => (
          <button
            key={carro.id}
            onClick={() => abrirPagamento(carro)}
            className="w-full text-left rounded-xl2 bg-surface border-2 border-white/10 px-6 py-5 flex justify-between items-center"
          >
            <div>
              <div className="text-4xl font-black tracking-widest">{carro.placa}</div>
              <div className="text-xl text-muted">
                entrou {new Date(carro.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="text-2xl font-bold text-accent">REGISTRAR SAÍDA →</div>
          </button>
        ))}
      </div>
    </main>
  );
}
