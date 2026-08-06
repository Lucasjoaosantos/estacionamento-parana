-- ============================================================
-- SISTEMA DE ESTACIONAMENTO - Schema do banco de dados
-- Rode este arquivo inteiro no SQL Editor do Supabase (Project > SQL Editor > New query)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- USUÁRIOS (login simples: usuário + senha) ----------
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text unique not null,
  senha_hash text not null,
  nome text not null,
  papel text not null default 'operador', -- 'admin' | 'operador'
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

-- ---------- CONFIGURAÇÕES (tarifas do rotativo) ----------
create table if not exists configuracoes (
  id int primary key default 1,
  valor_primeira_hora numeric not null default 10,
  valor_hora_adicional numeric not null default 8,
  tolerancia_minutos int not null default 40,
  constraint somente_uma_linha check (id = 1)
);

insert into configuracoes (id, valor_primeira_hora, valor_hora_adicional, tolerancia_minutos)
values (1, 10, 8, 40)
on conflict (id) do nothing;

-- ---------- ROTATIVO (carros avulsos, controle por placa) ----------
create table if not exists rotativo (
  id uuid primary key default gen_random_uuid(),
  placa text not null,
  entrada timestamptz not null default now(),
  saida timestamptz,
  minutos_totais int,
  valor_calculado numeric,
  desconto numeric default 0,
  valor_cobrado numeric,
  forma_pagamento text,           -- 'dinheiro' | 'cartao' | 'pix'
  status text not null default 'ativo', -- 'ativo' | 'finalizado'
  usuario_entrada_id uuid references usuarios(id),
  usuario_saida_id uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index if not exists idx_rotativo_status on rotativo(status);
create index if not exists idx_rotativo_placa on rotativo(placa);

-- Trava de segurança: impede duas linhas "ativo" com a mesma placa ao mesmo tempo,
-- mesmo que dois aparelhos tentem registrar a entrada no mesmo instante.
create unique index if not exists idx_rotativo_placa_ativa_unica
  on rotativo(placa)
  where (status = 'ativo');

-- ---------- CAIXA (livro financeiro - toda entrada de dinheiro) ----------
create table if not exists caixa_movimentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,             -- 'entrada' | 'saida'
  origem text not null,           -- 'rotativo' | 'outro'
  referencia_id uuid,
  valor numeric not null,
  forma_pagamento text,           -- 'dinheiro' | 'cartao' | 'pix'
  descricao text,
  usuario_id uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index if not exists idx_caixa_criado_em on caixa_movimentos(criado_em);

-- ---------- RESUMO DIÁRIO ----------
-- Este é o ÚNICO histórico que fica guardado para sempre. Todo fim de dia,
-- o sistema soma os valores do dia, grava uma linha aqui, e DELETA os
-- detalhes de placas/carros e os lançamentos de caixa daquele dia
-- (ver app/api/fechamento/route.js).
create table if not exists resumo_diario (
  id uuid primary key default gen_random_uuid(),
  data date unique not null,
  total_dinheiro numeric not null default 0,
  total_cartao numeric not null default 0,
  total_pix numeric not null default 0,
  total_geral numeric not null default 0,
  qtd_veiculos int not null default 0,
  criado_em timestamptz default now()
);

-- ---------- Usuários ----------
-- Não crie usuários direto aqui no SQL (a senha precisa ser criptografada corretamente).
-- Depois de rodar este schema, use o script "scripts/criar-usuario.js" (veja README.md)
-- para criar o primeiro usuário administrador.
