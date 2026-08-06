import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request) {
  const { usuario, senha } = await request.json();

  if (!usuario || !senha) {
    return NextResponse.json(
      { erro: "Informe usuário e senha." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();
  const { data: user, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("usuario", usuario)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json(
      { erro: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  const senhaOk = await bcrypt.compare(senha, user.senha_hash);
  if (!senhaOk) {
    return NextResponse.json(
      { erro: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  // Sessão simples: devolve os dados do usuário (sem a senha) para o front-end
  // guardar em localStorage/cookie. Suficiente para o escopo deste sistema.
  const { senha_hash, ...usuarioSeguro } = user;

  return NextResponse.json({ usuario: usuarioSeguro });
}
