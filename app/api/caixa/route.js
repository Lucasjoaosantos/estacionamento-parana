import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/caixa?data=2026-08-06  -> movimentos do dia (padrão: hoje) + resumo
export async function GET(request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data") || new Date().toISOString().slice(0, 10);

  const inicio = `${data}T00:00:00`;
  const fim = `${data}T23:59:59`;

  const { data: movimentos, error } = await supabase
    .from("caixa_movimentos")
    .select("*")
    .gte("criado_em", inicio)
    .lte("criado_em", fim)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const resumo = { dinheiro: 0, cartao: 0, pix: 0, total: 0 };
  for (const mov of movimentos) {
    const sinal = mov.tipo === "saida" ? -1 : 1;
    const valor = sinal * Number(mov.valor);
    resumo.total += valor;
    if (mov.forma_pagamento === "dinheiro") resumo.dinheiro += valor;
    if (mov.forma_pagamento === "cartao") resumo.cartao += valor;
    if (mov.forma_pagamento === "pix") resumo.pix += valor;
  }

  return NextResponse.json({ movimentos, resumo, data });
}

// POST /api/caixa  -> lançamento manual (ex: saída de dinheiro para troco, despesa)
export async function POST(request) {
  const supabase = supabaseServer();
  const body = await request.json();

  const { data, error } = await supabase
    .from("caixa_movimentos")
    .insert({
      tipo: body.tipo || "saida",
      origem: body.origem || "outro",
      valor: body.valor,
      forma_pagamento: body.forma_pagamento,
      descricao: body.descricao || "Lançamento manual",
      usuario_id: body.usuario_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ movimento: data });
}
