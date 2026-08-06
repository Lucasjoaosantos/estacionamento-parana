import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { calcularPermanencia, calcularValor } from "@/lib/pricing";

// GET /api/rotativo?status=ativo   -> lista carros no estacionamento
// GET /api/rotativo?status=todos   -> lista tudo (para relatórios)
export async function GET(request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ativo";

  let query = supabase
    .from("rotativo")
    .select("*")
    .order("entrada", { ascending: false });

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ rotativo: data });
}

// POST /api/rotativo   { placa, usuario_id }  -> registra ENTRADA de carro novo
export async function POST(request) {
  const supabase = supabaseServer();
  const { placa, usuario_id } = await request.json();

  if (!placa) {
    return NextResponse.json({ erro: "Informe a placa." }, { status: 400 });
  }

  const placaFormatada = placa.toUpperCase().trim();

  // Impede registrar a mesma placa duas vezes enquanto ela ainda estiver ativa no pátio
  const { data: jaNoPatio } = await supabase
    .from("rotativo")
    .select("id, entrada")
    .eq("placa", placaFormatada)
    .eq("status", "ativo")
    .maybeSingle();

  if (jaNoPatio) {
    const horaEntrada = new Date(jaNoPatio.entrada).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return NextResponse.json(
      { erro: `Essa placa já está no pátio (entrada às ${horaEntrada}). Registre a saída antes de lançar de novo.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("rotativo")
    .insert({
      placa: placaFormatada,
      usuario_entrada_id: usuario_id || null,
      status: "ativo",
    })
    .select()
    .single();

  if (error) {
    // Se dois cliques acontecerem ao mesmo tempo (ex: dois aparelhos), o índice
    // único do banco (ver supabase/schema.sql) rejeita a segunda tentativa aqui.
    if (error.code === "23505") {
      return NextResponse.json(
        { erro: "Essa placa já está no pátio." },
        { status: 409 }
      );
    }
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ registro: data });
}

// PATCH /api/rotativo   { id, forma_pagamento, desconto, usuario_id }
//   -> registra SAÍDA + pagamento, calcula valor e lança no caixa
export async function PATCH(request) {
  const supabase = supabaseServer();
  const { id, forma_pagamento, desconto, usuario_id } = await request.json();

  if (!id || !forma_pagamento) {
    return NextResponse.json(
      { erro: "Informe o id e a forma de pagamento." },
      { status: 400 }
    );
  }

  const { data: registro, error: erroBusca } = await supabase
    .from("rotativo")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBusca || !registro) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }

  const { data: configData } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single();

  const saida = new Date();
  const minutosTotais = calcularPermanencia(registro.entrada, saida);
  const { valor } = calcularValor(minutosTotais, configData);

  const descontoAplicado = Number(desconto) || 0;
  const valorCobrado = Math.max(0, valor - descontoAplicado);

  const { data: atualizado, error: erroUpdate } = await supabase
    .from("rotativo")
    .update({
      saida: saida.toISOString(),
      minutos_totais: minutosTotais,
      valor_calculado: valor,
      desconto: descontoAplicado,
      valor_cobrado: valorCobrado,
      forma_pagamento,
      status: "finalizado",
      usuario_saida_id: usuario_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (erroUpdate) return NextResponse.json({ erro: erroUpdate.message }, { status: 500 });

  await supabase.from("caixa_movimentos").insert({
    tipo: "entrada",
    origem: "rotativo",
    referencia_id: id,
    valor: valorCobrado,
    forma_pagamento,
    descricao: `Rotativo - placa ${registro.placa}`,
    usuario_id: usuario_id || null,
  });

  return NextResponse.json({ registro: atualizado });
}
