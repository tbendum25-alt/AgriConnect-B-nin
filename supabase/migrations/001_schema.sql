-- AgriConnect Bénin : schéma + sécurité (RLS). À exécuter dans l'éditeur SQL Supabase.
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users on delete cascade, full_name text not null default '', role text not null default 'buyer' check(role in('buyer','farmer','admin')), phone text, show_phone boolean not null default false, commune text, avatar_url text, account_status text not null default 'active' check(account_status in('active','suspended')), created_at timestamptz default now(), updated_at timestamptz default now());
create table public.categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text, image_url text, is_active boolean not null default true, sort_order int not null default 0, created_at timestamptz default now());
create table public.products(id uuid primary key default gen_random_uuid(), seller_id uuid not null references profiles(id), category_id uuid references categories(id), name text not null check(char_length(name) between 2 and 100), description text, price numeric not null check(price>0 and price<=10000000), unit text not null, quantity numeric not null check(quantity>0 and quantity<=1000000), commune text not null, location_detail text, images text[] not null default '{}', is_available boolean not null default true, status text not null default 'pending' check(status in('pending','approved','rejected','suspended','archived')), rejection_reason text, created_at timestamptz default now());
create table public.favorites(user_id uuid references profiles(id) on delete cascade, product_id uuid references products(id) on delete cascade, created_at timestamptz default now(), primary key(user_id,product_id));
create table public.reports(id uuid primary key default gen_random_uuid(), product_id uuid references products(id) on delete cascade, reporter_id uuid not null references profiles(id), reason text not null, details text, status text not null default 'pending' check(status in('pending','handled')), created_at timestamptz default now());
create table public.contact_messages(id uuid primary key default gen_random_uuid(), name text not null check(char_length(name)<=100), email text not null check(char_length(email)<=200), subject text not null check(char_length(subject)<=200), message text not null check(char_length(message) between 5 and 3000), created_at timestamptz default now());

create function public.is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and account_status='active') $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin
 insert into profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),case when new.raw_user_meta_data->>'role'='farmer' then 'farmer' else 'buyer' end); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Empêche toute auto-promotion en admin. auth.uid() est nul dans l'éditeur SQL : c'est ainsi que l'on crée le 1er admin.
create function public.protect_profile() returns trigger language plpgsql as $$ begin
 if auth.uid() is not null and not is_admin() and (new.role<>old.role or new.account_status<>old.account_status) then raise exception 'Modification interdite'; end if;
 new.updated_at=now(); return new; end $$;
create trigger protect_profile before update on profiles for each row execute function protect_profile();

create function public.protect_product() returns trigger language plpgsql as $$ begin
 if auth.uid() is not null and not is_admin() then
  if new.seller_id<>old.seller_id or new.rejection_reason is distinct from old.rejection_reason or new.status not in('pending','archived') then raise exception 'Modification interdite'; end if;
 end if; return new; end $$;
create trigger protect_product before update on products for each row execute function protect_product();

create view public.public_sellers as select id,full_name,commune,case when show_phone then phone end as phone from profiles where account_status='active' and role='farmer';
grant select on public.public_sellers to anon,authenticated;

alter table profiles enable row level security; alter table categories enable row level security; alter table products enable row level security;
alter table favorites enable row level security; alter table reports enable row level security; alter table contact_messages enable row level security;
create policy p_sel on profiles for select using(id=auth.uid() or is_admin());
create policy p_upd on profiles for update using(id=auth.uid() or is_admin());
create policy c_sel on categories for select using(is_active or is_admin());
create policy c_all on categories for all using(is_admin()) with check(is_admin());
create policy pr_sel on products for select using(status='approved' or seller_id=auth.uid() or is_admin());
create policy pr_ins on products for insert with check(seller_id=auth.uid() and status='pending' and exists(select 1 from profiles where id=auth.uid() and role='farmer' and account_status='active'));
create policy pr_upd on products for update using(seller_id=auth.uid() or is_admin());
create policy pr_del on products for delete using(is_admin());
create policy f_all on favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy r_ins on reports for insert with check(reporter_id=auth.uid());
create policy r_sel on reports for select using(is_admin());
create policy r_upd on reports for update using(is_admin());
create policy m_ins on contact_messages for insert with check(true);
create policy m_sel on contact_messages for select using(is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy img_read on storage.objects for select using(bucket_id='product-images');
create policy img_ins on storage.objects for insert to authenticated with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
