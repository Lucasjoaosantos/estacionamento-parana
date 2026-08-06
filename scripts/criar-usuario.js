// Script para criar (ou resetar a senha de) um usuário do sistema.
//
// Como usar:
//   1) Preencha o arquivo .env.local (veja .env.example) com os dados do Supabase.
//      IMPORTANTE: aqui é preciso a SUPABASE_SERVICE_ROLE_KEY (não a anon key).
//   2) Rode no terminal, dentro da pasta do projeto:
//        node scripts/criar-usuario.js usuario senha "Nome Completo" admin
//      Exemplo:
//        node scripts/criar-usuario.js joao 1234 "João Pereira" admin
//        node scripts/criar-usuario.js filho1 minha_senha "Filho do João" operador
//
// O papel (4º argumento) pode ser "admin" ou "operador". Se não passar, usa "operador".

require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const [usuario, senha, nome, papel] = process.argv.slice(2);

  if (!usuario || !senha || !nome) {
    console.log(
      'Uso: node scripts/criar-usuario.js usuario senha "Nome Completo" [admin|operador]'
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Faltam variáveis no .env.local (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const senha_hash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabase
    .from("usuarios")
    .upsert(
      { usuario, senha_hash, nome, papel: papel || "operador", ativo: true },
      { onConflict: "usuario" }
    )
    .select();

  if (error) {
    console.error("Erro ao criar usuário:", error.message);
    process.exit(1);
  }

  console.log("Usuário criado/atualizado com sucesso:", data[0].usuario);
}

main();
