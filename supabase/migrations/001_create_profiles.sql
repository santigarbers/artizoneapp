-- Habilitar PostGIS para coordenadas geográficas (Phase 2)
create extension if not exists postgis;

-- Tabla de perfiles
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique not null,
  bio         text,
  genres      text[],
  instruments text[],
  avatar_url  text,
  location    geography(Point, 4326),
  created_at  timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Cualquiera puede ver perfiles (necesario para el mapa)
create policy "Perfiles visibles para todos"
  on public.profiles for select
  using (true);

-- Solo el dueño puede actualizar su propio perfil
create policy "Usuario edita su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Solo el dueño puede insertar su propio perfil
create policy "Usuario inserta su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
