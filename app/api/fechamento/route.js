import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Faz o fechamento de UM dia: soma os valores do caixa daquele dia, grava
// o resumo em "resumo_diario" (que fica para sempre) e DELETA os detalhes
// de placas (tabela rotativo) e os lançamentos de caixa daquele dia.
// Carros que ainda estão "ativo" (ainda não saíram) NUNCA são apagados.
async function fecharDia(dataStr) {
  const supabase = supabaseServer();
  const inicio = `${dataStr}T00:00:00`;
  const fim = `${dataStr}T23:59:59.999`;

  const { data: movimentos, error: erroMov } = await supabase
    .from("caixa_movimentos")
    .select("*")
    .gte("criado_em", inicio)
    .lte("criado_em", fim);

  if (erroMov) return { erro: erroMov.message };

  const resumo = { dinheiro: 0, cartao: 0, pix: 0, total: 0 };
  for (const mov of movimentos || []) {
    const sinal = mov.tipo === "saida" ? -1 : 1;
    const valor = sinal * Number(mov.valor);
    resumo.total += valor;
    if (mov.forma_pagamento === "dinheiro") resumo.dinheiro += valor;
    if (mov.forma_pagamento === "cartao") resumo.cartao += valor;
    if (mov.forma_pagamento === "pix") resumo.pix += valor;
  }

  const { count: qtdVeiculos } = await supabase
    .from("rotativo")
    .select("id", { count: "exact", head: true })
    .eq("status", "finalizado")
    .gte("saida", inicio)
    .lte("saida", fim);

  const { data: salvo, error: erroSalvar } = await supabase
    .from("resumo_diario")
    .upsert(
      {
        data: dataStr,
        total_dinheiro: resumo.dinheiro,
        total_cartao: resumo.cartao,
        total_pix: resumo.pix,
        total_geral: resumo.total,
        qtd_veiculos: qtdVeiculos || 0,
      },
      { onConflict: "data" }
    )
    .select()
    .single();

  if (erroSalvar) return { erro: erroSalvar.message };

  // Agora sim: apaga os detalhes de placas e os lançamentos de caixa daquele dia.
  // Só afeta carros já finalizados — quem ainda está no pátio não é tocado.
  await supabase
    .from("rotativo")
    .delete()
    .eq("status", "finalizado")
    .gte("saida", inicio)
    .lte("saida", fim);

  await supabase
    .from("caixa_movimentos")
    .delete()
    .gte("criado_em", inicio)
    .lte("criado_em", fim);

  return { resumo: salvo };
}

// GET /api/fechamento                     -> histórico de resumos diários (sem placas), usado pela tela
// GET /api/fechamento (chamado pelo Vercel Cron, com header Authorization: Bearer CRON_SECRET)
//                                          -> fecha automaticamente o dia anterior
export async function GET(request) {
  const auth = request.headers.get("authorization");
  const chamadaDoCron =
    process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;

  if (chamadaDoCron) {
    // O cron roda pouco depois da meia-noite, então fecha o dia que ACABOU de terminar (ontem).
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataStr = ontem.toISOString().slice(0, 10);

    const resultado = await fecharDia(dataStr);
    if (resultado.erro) return NextResponse.json({ erro: resultado.erro }, { status: 500 });
    return NextResponse.json({ ok: true, resumo: resultado.resumo });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("resumo_diario")
    .select("*")
    .order("data", { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ historico: data });
}

// POST /api/fechamento   { data? }  -> fechamento manual (botão "Fechar o dia agora")
// Sem "data" no corpo, fecha o dia de hoje.
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const dataStr = body.data || new Date().toISOString().slice(0, 10);

  const resultado = await fecharDia(dataStr);
  if (resultado.erro) return NextResponse.json({ erro: resultado.erro }, { status: 500 });
  return NextResponse.json({ ok: true, resumo: resultado.resumo });
}
