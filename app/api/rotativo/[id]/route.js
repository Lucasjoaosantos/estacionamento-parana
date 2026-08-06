import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { calcularPermanencia, calcularValor } from "@/lib/pricing";

// GET /api/rotativo/:id  -> devolve o registro + o valor calculado NA HORA
// (não grava nada, só mostra pro operador antes de confirmar o pagamento)
export async function GET(_request, { params }) {
  const supabase = supabaseServer();
  const { data: registro, error } = await supabase
    .from("rotativo")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !registro) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }

  const { data: config } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single();

  const agora = new Date();
  const minutosTotais = calcularPermanencia(registro.entrada, agora);
  const { valor, horasCobradas } = calcularValor(minutosTotais, config);

  return NextResponse.json({
    registro,
    minutosTotais,
    horasCobradas,
    valorSugerido: valor,
  });
}
