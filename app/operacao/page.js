"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const [temDesconto, setTemDesconto] = useState(null); // null | true | false
  const [valorCobradoDigitos, setValorCobradoDigitos] = useState(""); // dígitos em centavos

  async function abrirPagamento(carro) {
    setCarroSelecionado(carro);
    setDesconto("");
    setTemDesconto(null);
    setValorCobradoDigitos("");
    const resp = await fetch(`/api/rotativo/${carro.id}`);
    const json = await resp.json();
    setValorSugerido(json);
    setTela("pagamento");
  }

  // Sempre que o operador terminar de digitar o valor cobrado, recalcula
  // o desconto (diferença entre o valor da tabela e o valor informado) —
  // é esse desconto que fica salvo no registro, mas quem digita é o valor final.
  useEffect(() => {
    if (temDesconto !== true) return;
    const valorTabela = valorSugerido?.valorSugerido || 0;
    const valorCobrado = Number(valorCobradoDigitos || 0) / 100;
    setDesconto(String(Math.max(0, valorTabela - valorCobrado)));
  }, [temDesconto, valorCobradoDigitos, valorSugerido]);

  const [enviandoPagamento, setEnviandoPagamento] = useState(false);

  async function confirmarPagamento(forma) {
    if (enviandoPagamento) return; // evita clique duplo lançar o pagamento duas vezes
    setEnviandoPagamento(true);
    try {
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
    } finally {
      setEnviandoPagamento(false);
    }
  }

  function sair() {
    localStorage.removeItem("usuarioLogado");
    router.push("/login");
  }

  // ---------------------- TELA: NOVO CARRO ----------------------
  if (tela === "novo") {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-huge font-extrabold text-center">Digite a placa</h1>
        <div className="text-4xl sm:text-giant font-black text-accent tracking-widest">
          {placaDigitada || "______"}
        </div>
        {mensagem && <p className="text-danger text-lg sm:text-2xl font-bold text-center">{mensagem}</p>}
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
          className="mt-2 text-lg sm:text-2xl font-bold text-muted underline"
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
      <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-huge font-extrabold text-center">Placa {carroSelecionado.placa}</h1>
        <p className="text-lg sm:text-3xl text-muted text-center">
          Tempo: {formatarDuracao(valorSugerido?.minutosTotais || 0)}
        </p>
        <p className="text-4xl sm:text-giant font-black text-accent">
          {formatarMoeda(valorComDesconto)}
        </p>

        <div className="w-full max-w-xl flex flex-col gap-3">
          <p className="text-lg sm:text-2xl font-semibold text-center">Houve desconto?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setTemDesconto(false); setDesconto("0"); setValorCobradoDigitos(""); }}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl2 text-lg sm:text-2xl font-bold border-2
                ${temDesconto === false ? "bg-accent text-base border-accent" : "bg-surface border-white/10"}`}
            >
              NÃO
            </button>
            <button
              onClick={() => setTemDesconto(true)}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl2 text-lg sm:text-2xl font-bold border-2
                ${temDesconto === true ? "bg-accent text-base border-accent" : "bg-surface border-white/10"}`}
            >
              SIM
            </button>
          </div>

          {temDesconto === true && (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-lg sm:text-2xl font-semibold text-center">Qual o valor cobrado?</p>
              <p className="text-4xl sm:text-giant font-black text-accent text-center">
                {formatarMoeda(Number(valorCobradoDigitos || 0) / 100)}
              </p>
              <TecladoVirtual
                valor={valorCobradoDigitos}
                onChange={setValorCobradoDigitos}
                somenteNumeros
                maxLength={7}
              />
            </div>
          )}
        </div>

        {(temDesconto === false || (temDesconto === true && valorCobradoDigitos)) && (
          <>
            <p className="text-xl sm:text-3xl font-bold mt-4">Forma de pagamento:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
          <button
            onClick={() => confirmarPagamento("dinheiro")}
            disabled={enviandoPagamento}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            💵 DINHEIRO
          </button>
          <button
            onClick={() => confirmarPagamento("cartao")}
            disabled={enviandoPagamento}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            💳 CARTÃO
          </button>
          <button
            onClick={() => confirmarPagamento("pix")}
            disabled={enviandoPagamento}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            📱 PIX
          </button>
            </div>
            {enviandoPagamento && (
              <p className="text-lg sm:text-xl text-muted font-semibold">Registrando saída...</p>
            )}
          </>
        )}

        {mensagem && <p className="text-danger text-lg sm:text-2xl font-bold text-center">{mensagem}</p>}

        <button
          onClick={() => { setTela("lista"); setCarroSelecionado(null); }}
          className="mt-2 text-lg sm:text-2xl font-bold text-muted underline"
        >
          Cancelar
        </button>
      </main>
    );
  }

  // ---------------------- TELA: LISTA (padrão) ----------------------
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8 gap-6">
      <div className="w-full flex flex-wrap gap-3 justify-between items-center max-w-3xl">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Estacionamento Paraná" className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl" />
          <h1 className="text-xl sm:text-4xl font-extrabold">Estacionamento Paraná</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/gestao" className="text-sm sm:text-xl font-bold text-accent underline whitespace-nowrap">
            Ver caixa/gestão
          </Link>
          <button onClick={sair} className="text-sm sm:text-xl font-bold text-muted underline">
            Sair
          </button>
        </div>
      </div>

      <button
        onClick={() => setTela("novo")}
        className="w-full max-w-3xl h-20 sm:h-28 rounded-xl2 bg-accent text-base text-2xl sm:text-4xl font-extrabold"
      >
        + NOVO CARRO
      </button>

      <div className="w-full max-w-3xl flex flex-col gap-4">
        {carros.length === 0 && (
          <p className="text-xl sm:text-3xl text-muted text-center py-10">
            Nenhum carro no pátio agora.
          </p>
        )}
        {carros.map((carro) => (
          <button
            key={carro.id}
            onClick={() => abrirPagamento(carro)}
            className="w-full text-left rounded-xl2 bg-surface border-2 border-white/10 px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap gap-2 justify-between items-center"
          >
            <div>
              <div className="text-2xl sm:text-4xl font-black tracking-widest">{carro.placa}</div>
              <div className="text-base sm:text-xl text-muted">
                entrou {new Date(carro.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-accent">REGISTRAR SAÍDA →</div>
          </button>
        ))}
      </div>
    </main>
  );
}
