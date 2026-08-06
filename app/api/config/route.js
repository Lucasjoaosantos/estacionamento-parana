import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ config: data });
}

export async function PATCH(request) {
  const body = await request.json();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("configuracoes")
    .update({
      valor_primeira_hora: body.valor_primeira_hora,
      valor_hora_adicional: body.valor_hora_adicional,
      tolerancia_minutos: body.tolerancia_minutos,
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ config: data });
}
