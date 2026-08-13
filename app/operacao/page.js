"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TecladoVirtual from "@/components/TecladoVirtual";
import { formatarDuracao, formatarMoeda } from "@/lib/pricing";

// Telas possíveis dentro da operação: lista de carros (em cards), digitar
// placa nova, e tela de confirmação de saída (só tempo, sem pagamento).
export default function OperacaoPage() {
  const router = useRouter();
  const [tela, setTela] = useState("lista");
  const [carros, setCarros] = useState([]);
  const [placaDigitada, setPlacaDigitada] = useState("");
  const [veiculoDescricao, setVeiculoDescricao] = useState("");
  const [pernoite, setPernoite] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState("placa"); // "placa" | "descricao" — qual campo o teclado na tela edita agora
  const [carroSelecionado, setCarroSelecionado] = useState(null);
  const [minutosDecorridos, setMinutosDecorridos] = useState(0);
  const [valorDigitos, setValorDigitos] = useState(""); // dígitos em centavos, digitados na saída
  const [mensagem, setMensagem] = useState("");
  const [agora, setAgora] = useState(new Date());
  const [usuario, setUsuario] = useState(null);
  const [enviando, setEnviando] = useState(false);

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
    if (placaDigitada.trim().length < 3) {
      setMensagem("Digite ao menos 3 caracteres da placa.");
      return;
    }
    if (!veiculoDescricao.trim()) {
      setMensagem("Informe uma descrição do veículo (cor, modelo, etc).");
      return;
    }
    setMensagem("");
    const resp = await fetch("/api/rotativo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placa: placaDigitada,
        veiculo_descricao: veiculoDescricao,
        pernoite,
        usuario_id: usuario?.id,
      }),
    });
    if (resp.ok) {
      setPlacaDigitada("");
      setVeiculoDescricao("");
      setPernoite(false);
      setTela("lista");
      carregarCarros();
    } else {
      const json = await resp.json();
      setMensagem(json.erro || "Erro ao registrar entrada.");
    }
  }

  async function abrirSaida(carro) {
    setCarroSelecionado(carro);
    setValorDigitos("");
    setMensagem("");
    const resp = await fetch(`/api/rotativo/${carro.id}`);
    const json = await resp.json();
    setMinutosDecorridos(json.minutosTotais || 0);
    setTela("saida");
  }

  async function confirmarSaida(forma) {
    if (enviando) return; // evita clique duplo registrar a saída duas vezes
    if (!valorDigitos) {
      setMensagem("Informe o valor cobrado.");
      return;
    }
    setEnviando(true);
    try {
      const resp = await fetch("/api/rotativo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: carroSelecionado.id,
          valor: Number(valorDigitos) / 100,
          forma_pagamento: forma,
          usuario_id: usuario?.id,
        }),
      });
      if (resp.ok) {
        setTela("lista");
        setCarroSelecionado(null);
        carregarCarros();
      } else {
        const json = await resp.json();
        setMensagem(json.erro || "Erro ao registrar saída.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function sair() {
    localStorage.removeItem("usuarioLogado");
    router.push("/login");
  }

  // O teclado na tela edita "placa" ou "descricao", dependendo de qual
  // campo o operador tocou por último. Digitar no teclado físico também
  // funciona, porque os campos abaixo são <input> de verdade.
  const valorCampoAtivo = campoAtivo === "placa" ? placaDigitada : veiculoDescricao;
  const setValorCampoAtivo = campoAtivo === "placa" ? setPlacaDigitada : setVeiculoDescricao;

  // ---------------------- TELA: NOVO CARRO ----------------------
  if (tela === "novo") {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-huge font-extrabold text-center">Novo carro</h1>

        <div className="w-full max-w-2xl flex flex-col gap-3">
          <label className="text-sm sm:text-lg font-semibold text-muted">
            Placa (completa ou só alguns caracteres)
          </label>
          <input
            type="text"
            value={placaDigitada}
            onChange={(e) => setPlacaDigitada(e.target.value.toUpperCase().slice(0, 7))}
            onFocus={() => setCampoAtivo("placa")}
            placeholder="Ex: ABC1234 ou ABC1"
            className={`w-full px-4 py-3 sm:py-4 rounded-xl2 border-2 bg-surface text-2xl sm:text-4xl font-black tracking-widest text-center
              ${campoAtivo === "placa" ? "border-accent" : "border-white/10"}`}
          />

          <label className="text-sm sm:text-lg font-semibold text-muted mt-2">
            Descrição do veículo (cor, modelo, algo que ajude a identificar)
          </label>
          <input
            type="text"
            value={veiculoDescricao}
            onChange={(e) => setVeiculoDescricao(e.target.value.slice(0, 60))}
            onFocus={() => setCampoAtivo("descricao")}
            placeholder="Ex: Gol prata, HB20 branco..."
            className={`w-full px-4 py-3 sm:py-4 rounded-xl2 border-2 bg-surface text-lg sm:text-2xl font-semibold
              ${campoAtivo === "descricao" ? "border-accent" : "border-white/10"}`}
          />

          <button
            type="button"
            onClick={() => setPernoite((v) => !v)}
            className={`mt-2 flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl2 border-2 text-lg sm:text-2xl font-bold
              ${pernoite ? "bg-accent text-base border-accent" : "bg-surface border-white/10"}`}
          >
            <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center
              ${pernoite ? "bg-base border-base" : "border-muted"}`}>
              {pernoite && <span className="text-accent text-sm font-black">✓</span>}
            </span>
            🌙 Esse carro vai pernoitar (ficar durante a noite)
          </button>
        </div>

        {mensagem && <p className="text-danger text-lg sm:text-2xl font-bold text-center">{mensagem}</p>}

        <div className="w-full max-w-2xl">
          <TecladoVirtual
            valor={valorCampoAtivo}
            onChange={setValorCampoAtivo}
            maxLength={campoAtivo === "placa" ? 7 : 60}
            somenteNumeros={false}
            onConfirmar={confirmarEntrada}
            labelConfirmar="REGISTRAR ENTRADA"
          />
        </div>

        <button
          onClick={() => {
            setTela("lista");
            setPlacaDigitada("");
            setVeiculoDescricao("");
            setPernoite(false);
            setMensagem("");
          }}
          className="mt-2 text-lg sm:text-2xl font-bold text-muted underline"
        >
          Cancelar
        </button>
      </main>
    );
  }

  // ---------------------- TELA: CONFIRMAR SAÍDA ----------------------
  if (tela === "saida" && carroSelecionado) {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-huge font-extrabold text-center">
          Placa {carroSelecionado.placa}
        </h1>
        {carroSelecionado.veiculo_descricao && (
          <p className="text-xl sm:text-3xl font-extrabold text-white text-center">
            {carroSelecionado.veiculo_descricao}
          </p>
        )}
        {carroSelecionado.pernoite && (
          <p className="text-base sm:text-xl font-bold text-accent">🌙 Marcado para pernoitar</p>
        )}

        <p className="text-lg sm:text-3xl text-muted text-center">Tempo no pátio:</p>
        <p className="text-2xl sm:text-huge font-black text-accent">
          {formatarDuracao(minutosDecorridos)}
        </p>

        <div className="w-full max-w-xl flex flex-col gap-3">
          <label className="text-lg sm:text-2xl font-semibold text-center">Valor cobrado</label>
          <input
            type="text"
            inputMode="numeric"
            value={valorDigitos ? formatarMoeda(Number(valorDigitos) / 100) : ""}
            onChange={(e) => setValorDigitos(e.target.value.replace(/\D/g, "").slice(0, 7))}
            placeholder="R$ 0,00"
            className="w-full px-4 py-3 sm:py-4 rounded-xl2 border-2 border-accent bg-surface
                       text-3xl sm:text-giant font-black text-accent text-center"
          />
          <TecladoVirtual
            valor={valorDigitos}
            onChange={setValorDigitos}
            somenteNumeros
            maxLength={7}
          />
        </div>

        {mensagem && <p className="text-danger text-lg sm:text-2xl font-bold text-center">{mensagem}</p>}

        <p className="text-xl sm:text-3xl font-bold mt-2">Forma de pagamento:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
          <button
            onClick={() => confirmarSaida("dinheiro")}
            disabled={enviando}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            💵 DINHEIRO
          </button>
          <button
            onClick={() => confirmarSaida("cartao")}
            disabled={enviando}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            💳 CARTÃO
          </button>
          <button
            onClick={() => confirmarSaida("pix")}
            disabled={enviando}
            className="h-16 sm:h-24 rounded-xl2 bg-accent2 text-white text-xl sm:text-3xl font-extrabold disabled:opacity-50"
          >
            📱 PIX
          </button>
        </div>
        {enviando && (
          <p className="text-lg sm:text-xl text-muted font-semibold">Registrando saída...</p>
        )}

        <button
          onClick={() => { setTela("lista"); setCarroSelecionado(null); setMensagem(""); }}
          disabled={enviando}
          className="mt-2 text-lg sm:text-2xl font-bold text-muted underline"
        >
          Cancelar
        </button>
      </main>
    );
  }

  // ---------------------- TELA: LISTA EM CARDS (padrão) ----------------------
  return (
    <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 gap-4 sm:gap-6">
      <div className="w-full flex flex-wrap gap-3 justify-between items-center max-w-6xl">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Estacionamento Paraná" className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl" />
          <h1 className="text-xl sm:text-4xl font-extrabold">Estacionamento Paraná</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/gestao" className="text-sm sm:text-xl font-bold text-accent underline whitespace-nowrap">
            Ver gestão
          </Link>
          <button onClick={sair} className="text-sm sm:text-xl font-bold text-muted underline">
            Sair
          </button>
        </div>
      </div>

      <button
        onClick={() => setTela("novo")}
        className="w-full max-w-6xl h-16 sm:h-20 rounded-xl2 bg-accent text-base text-xl sm:text-3xl font-extrabold"
      >
        + NOVO CARRO
      </button>

      <p className="w-full max-w-6xl text-sm sm:text-lg text-muted">
        {carros.length} {carros.length === 1 ? "carro" : "carros"} no pátio
      </p>

      <div className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {carros.length === 0 && (
          <p className="col-span-full text-xl sm:text-3xl text-muted text-center py-10">
            Nenhum carro no pátio agora.
          </p>
        )}
        {carros.map((carro) => {
          const minutos = Math.max(0, Math.round((agora - new Date(carro.entrada)) / 60000));
          return (
            <button
              key={carro.id}
              onClick={() => abrirSaida(carro)}
              className="text-left rounded-xl2 bg-surface border-2 border-white/10 p-3 sm:p-4 flex flex-col gap-1.5 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="text-lg sm:text-2xl font-black tracking-widest break-all">
                  {carro.placa}
                </div>
                {carro.pernoite && <span className="text-lg shrink-0" title="Vai pernoitar">🌙</span>}
              </div>
              {carro.veiculo_descricao && (
                <div className="text-lg sm:text-xl font-extrabold text-white truncate">{carro.veiculo_descricao}</div>
              )}
              <div className="text-xs sm:text-sm text-muted">
                entrou {new Date(carro.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-sm sm:text-lg font-bold text-accent mt-1">
                {formatarDuracao(minutos)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-accent2 mt-1">REGISTRAR SAÍDA →</div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
