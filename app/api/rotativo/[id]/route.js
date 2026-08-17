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

// PATCH /api/rotativo/:id   { placa, veiculo_descricao, pernoite }
//   -> corrige os dados de um carro que já está no pátio (placa digitada
//      errada na entrada, ou marcar/desmarcar pernoite depois que o
//      funcionário lembrar). NÃO mexe em entrada/saída/valor.
export async function PATCH(request, { params }) {
  const supabase = supabaseServer();
  const { placa, veiculo_descricao, pernoite } = await request.json();

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

  const { data: registro, error: erroBusca } = await supabase
    .from("rotativo")
    .select("*")
    .eq("id", params.id)
    .single();

  if (erroBusca || !registro) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }

  if (registro.status === "finalizado") {
    return NextResponse.json(
      { erro: "Esse veículo já teve a saída registrada, não é possível editar." },
      { status: 409 }
    );
  }

  const placaFormatada = placa.toUpperCase().trim();

  // Se mudou a placa, garante que ela não bate com outro carro já ativo no pátio
  if (placaFormatada !== registro.placa) {
    const { data: jaNoPatio } = await supabase
      .from("rotativo")
      .select("id, entrada")
      .eq("placa", placaFormatada)
      .eq("status", "ativo")
      .neq("id", params.id)
      .maybeSingle();

    if (jaNoPatio) {
      const horaEntrada = new Date(jaNoPatio.entrada).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return NextResponse.json(
        { erro: `Essa placa já está no pátio em outro carro (entrada às ${horaEntrada}).` },
        { status: 409 }
      );
    }
  }

  const { data: atualizado, error: erroUpdate } = await supabase
    .from("rotativo")
    .update({
      placa: placaFormatada,
      veiculo_descricao: veiculo_descricao.trim().toUpperCase(),
      pernoite: !!pernoite,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (erroUpdate) {
    if (erroUpdate.code === "23505") {
      return NextResponse.json(
        { erro: "Essa placa já está no pátio em outro carro." },
        { status: 409 }
      );
    }
    return NextResponse.json({ erro: erroUpdate.message }, { status: 500 });
  }

  return NextResponse.json({ registro: atualizado });
}
