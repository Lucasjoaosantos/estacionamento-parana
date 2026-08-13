import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { calcularPermanencia } from "@/lib/pricing";

// GET /api/rotativo?status=ativo               -> lista carros no estacionamento
// GET /api/rotativo?status=todos                -> lista tudo (para relatórios)
// GET /api/rotativo?status=finalizado&data=YYYY-MM-DD -> saídas de um dia específico (para o total faturado)
export async function GET(request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ativo";
  const data = searchParams.get("data");

  let query = supabase
    .from("rotativo")
    .select("*")
    .order("entrada", { ascending: false });

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  if (data) {
    const inicio = `${data}T00:00:00`;
    const fim = `${data}T23:59:59.999`;
    const campoData = status === "finalizado" ? "saida" : "entrada";
    query = query.gte(campoData, inicio).lte(campoData, fim);
  }

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ rotativo: rows });
}

// POST /api/rotativo   { placa, veiculo_descricao, pernoite, usuario_id }  -> registra ENTRADA de carro novo
export async function POST(request) {
  const supabase = supabaseServer();
  const { placa, veiculo_descricao, pernoite, usuario_id } = await request.json();

  if (!placa || placa.trim().length < 3) {
    return NextResponse.json(
      { erro: "Informe ao menos 3 caracteres da placa." },
      { status: 400 }
    );
  }

  if (!veiculo_descricao || !veiculo_descricao.trim()) {
    return NextResponse.json(
      { erro: "Informe uma descrição do veículo (cor, modelo, etc)." },
      { status: 400 }
    );
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
      veiculo_descricao: veiculo_descricao.trim(),
      pernoite: !!pernoite,
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

// PATCH /api/rotativo   { id, valor, forma_pagamento, usuario_id }
//   -> registra SAÍDA + o valor que o operador digitou (não é calculado
//      automaticamente por tarifa — o operador informa o valor cobrado)
export async function PATCH(request) {
  const supabase = supabaseServer();
  const { id, valor, forma_pagamento, usuario_id } = await request.json();

  if (!id) {
    return NextResponse.json({ erro: "Informe o id do veículo." }, { status: 400 });
  }

  if (valor === undefined || valor === null || isNaN(Number(valor)) || Number(valor) < 0) {
    return NextResponse.json({ erro: "Informe o valor cobrado." }, { status: 400 });
  }

  if (!forma_pagamento || !["dinheiro", "cartao", "pix"].includes(forma_pagamento)) {
    return NextResponse.json({ erro: "Informe a forma de pagamento." }, { status: 400 });
  }

  const { data: registro, error: erroBusca } = await supabase
    .from("rotativo")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBusca || !registro) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }

  // Evita registrar a saída duas vezes (ex: clique duplo, ou dois
  // aparelhos tentando registrar a saída do mesmo carro ao mesmo tempo).
  if (registro.status === "finalizado") {
    return NextResponse.json(
      { erro: "A saída desse veículo já havia sido registrada." },
      { status: 409 }
    );
  }

  const saida = new Date();
  const minutosTotais = calcularPermanencia(registro.entrada, saida);

  const { data: atualizado, error: erroUpdate } = await supabase
    .from("rotativo")
    .update({
      saida: saida.toISOString(),
      minutos_totais: minutosTotais,
      valor_cobrado: Number(valor),
      forma_pagamento,
      status: "finalizado",
      usuario_saida_id: usuario_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (erroUpdate) return NextResponse.json({ erro: erroUpdate.message }, { status: 500 });

  return NextResponse.json({ registro: atualizado });
}
