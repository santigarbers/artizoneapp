-- Crear bucket público para avatares
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Cualquiera puede ver los avatares
create policy "Avatares públicos"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Usuario solo puede subir a su propia carpeta
create policy "Usuario sube su propio avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuario solo puede actualizar su propio avatar
create policy "Usuario actualiza su propio avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
