import { createClient } from "@supabase/supabase-js";

// Usado apenas dentro das rotas de API (app/api/**), nunca no navegador.
// A service role key ignora as regras de RLS, então isso fica só no servidor.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, serviceKey);
}
