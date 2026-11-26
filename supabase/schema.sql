-- Execute APENAS em um NOVO projeto Supabase para Dina Moda.
-- Substitua o UUID do administrador no final, após criar o usuário no Supabase Auth.
-- O SQL não cria produtos fictícios no banco definitivo.
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.store_settings (
 id integer primary key check (id=1),
 data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
create table if not exists public.products (
 id text primary key,
 data jsonb not null,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint products_data_object check (jsonb_typeof(data)='object')
);
create table if not exists public.banners (
 id text primary key,
 data jsonb not null,
 active boolean not null default true,
 position integer not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text unique not null,
 customer_name text not null,
 customer_phone text not null,
 fulfillment text not null check (fulfillment in ('entrega','retirada')),
 address text,
 notes text,
 items jsonb not null,
 total numeric(12,2) not null check(total>=0),
 status text not null default 'aguardando_confirmacao' check(status in ('aguardando_confirmacao','confirmado','em_separacao','pronto_retirada','saiu_entrega','concluido','cancelado')),
 created_at timestamptz not null default now()
);
create index if not exists products_active_created_idx on public.products(active,created_at desc);
create index if not exists banners_active_position_idx on public.banners(active,position);
create index if not exists orders_created_idx on public.orders(created_at desc);

alter table public.admin_profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;

-- Usuários podem verificar somente sua própria condição de administradores.
create policy "admin self read" on public.admin_profiles for select to authenticated
 using (user_id=(select auth.uid()));
-- Somente operadores do serviço podem conceder/revogar administração.

create policy "public store settings" on public.store_settings for select to anon,authenticated using (true);
create policy "admin modify settings" on public.store_settings for all to authenticated
 using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));

create policy "public active products or admin" on public.products for select to anon,authenticated
 using (active or exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))));
create policy "admin modify products" on public.products for all to authenticated
 using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));

create policy "public active banners or admin" on public.banners for select to anon,authenticated
 using (active or exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))));
create policy "admin modify banners" on public.banners for all to authenticated
 using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));

create policy "admin read orders" on public.orders for select to authenticated
 using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "admin update orders" on public.orders for update to authenticated
 using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
-- Pedidos públicos são criados SOMENTE pela Edge Function, nunca por insert direto do browser.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('catalog-images','catalog-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict (id) do nothing;
create policy "public images" on storage.objects for select to anon,authenticated using(bucket_id='catalog-images');
create policy "admin upload images" on storage.objects for insert to authenticated
 with check(bucket_id='catalog-images' and exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "admin update images" on storage.objects for update to authenticated
 using(bucket_id='catalog-images' and exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())))
 with check(bucket_id='catalog-images' and exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "admin delete images" on storage.objects for delete to authenticated
 using(bucket_id='catalog-images' and exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));

-- IMPORTANTE: não inserir UUID fictício. Após criar usuário:
-- insert into public.admin_profiles (user_id) values ('UUID_REAL_DO_AUTH_USERS');
-- Opcional: definir os dados reais da loja pelo painel, após conceder acesso.
