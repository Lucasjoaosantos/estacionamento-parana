import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { calcularPermanencia } from "@/lib/pricing";

// GET /api/rotativo/:id  -> devolve o registro + quanto tempo já passou
// (não grava nada, só mostra pro operador antes de confirmar a saída)
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

  const agora = new Date();
  const minutosTotais = calcularPermanencia(registro.entrada, agora);

  return NextResponse.json({ registro, minutosTotais });
}
