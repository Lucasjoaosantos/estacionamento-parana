# Sistema de Estacionamento

Controle de rotativo (por placa) e caixa (dinheiro / cartão / pix), com duas telas:

- **Tela de Operação** (`/operacao`) — letras grandes, teclado na tela, poucos passos.
  Pensada para quem tem dificuldade de digitar e usa só no computador.
- **Painel de Gestão** (`/gestao`, `/caixa`) — visão geral, caixa do dia, tarifas.
  Pensada para uso no celular.

Na primeira vez que fizer login em cada aparelho, o sistema pergunta qual das
duas telas usar ali (fica salvo nesse navegador).

## 1. Rodando localmente

### 1.1 Criar o projeto no Supabase (banco de dados)

1. Crie uma conta/projeto em https://supabase.com
2. Vá em **SQL Editor** → **New query**, cole todo o conteúdo do arquivo
   `supabase/schema.sql` e rode (botão RUN).
3. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public key`
   - `service_role key` (fica em "Project API keys", é secreta — não divulgue)

### 1.2 Configurar o projeto

```bash
npm install
cp .env.example .env.local
```

Abra `.env.local` e cole as 4 chaves (3 do Supabase + o CRON_SECRET, veja a seção 5).

### 1.3 Criar o primeiro usuário (login)

```bash
node scripts/criar-usuario.js pai 1234 "Nome do seu pai" operador
node scripts/criar-usuario.js filho1 minhasenha "Nome do filho" admin
```

Você pode criar quantos usuários quiser, com usuário/senha simples.

### 1.4 Rodar

```bash
npm run dev
```

Abra http://localhost:3000 — vai pedir login e depois qual tela usar.

## 2. Subindo no Vercel (via GitHub)

1. Suba esta pasta para um repositório no GitHub.
2. Em https://vercel.com, clique em **New Project** e importe o repositório.
3. Em **Environment Variables**, adicione as 4 variáveis do `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `CRON_SECRET` — invente uma senha longa e aleatória para essa última).
4. Deploy. O Vercel te dá uma URL (ex: `estacionamento.vercel.app`) —
   essa é a URL que os filhos abrem no celular e o pai abre no computador.
5. O arquivo `vercel.json` já configura o fechamento automático do dia
   (todo dia à meia-noite, horário de Brasília). Não precisa fazer nada
   além de configurar o `CRON_SECRET` no passo 3 — o Vercel identifica
   e autentica essa chamada automaticamente.

Depois do primeiro deploy, você pode rodar o script `criar-usuario.js`
apontando o `.env.local` para o Supabase de produção (é o mesmo banco,
local e produção usam o mesmo Supabase).

## 3. Fechamento do dia (privacidade dos clientes)

Todo dia à meia-noite (horário de Brasília), o sistema automaticamente:

1. Soma tudo que entrou no caixa naquele dia (dinheiro, cartão, pix).
2. Salva esse resumo (só os totais e a quantidade de carros) na tela
   **Caixa → Histórico financeiro**, para sempre.
3. **Apaga** todas as placas e detalhes de carros daquele dia. Nada de
   placa ou veículo fica guardado além do dia em que o carro passou pelo
   estacionamento.

Carros que ainda estiverem no pátio na hora do fechamento **não são apagados**
— eles continuam normalmente até a saída.

Se quiser fechar o dia antes da meia-noite (por exemplo, para testar), use o
botão **"Fechar o dia agora"** na tela de Caixa. Essa ação não tem volta.

Isso só funciona automaticamente depois de configurar o `CRON_SECRET`
(veja a seção 2, passo 3) e fazer o deploy no Vercel — localmente, o
fechamento automático não roda (só o manual, pelo botão).

## 4. Ajustando as tarifas

As tarifas (valor da 1ª hora, hora adicional e tolerância em minutos) ficam
em **Painel de Gestão → Tarifas**, e podem ser trocadas a qualquer momento
sem precisar mexer no código.

Regra aplicada (a que você descreveu):
- Mínimo cobrado: 1 hora.
- Depois disso, cada hora adicional só é cobrada por completo se o tempo
  excedente passar da tolerância configurada (padrão: 40 minutos).
- Na hora de fechar a saída, o operador pode aplicar um desconto manual
  antes de escolher a forma de pagamento.

## 5. Estrutura do projeto

```
app/
  login/          tela de login (comum aos dois perfis)
  escolher-modo/   escolha de qual tela usar neste aparelho
  operacao/        tela grande e simples (rotativo)
  gestao/          painel para celular (visão geral)
  gestao/configuracoes/  tarifas
  caixa/           caixa do dia
  api/             rotas de backend (login, rotativo, caixa, config, fechamento)
lib/
  pricing.js       cálculo do valor a cobrar
  supabaseClient.js / supabaseServer.js
components/
  TecladoVirtual.js  teclado grande em ordem alfabética
  GestaoLayout.js    menu do painel de gestão
supabase/
  schema.sql       script para criar as tabelas no Supabase
scripts/
  criar-usuario.js criação de usuários (usuário/senha)
vercel.json        agenda do fechamento automático diário
```
