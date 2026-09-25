-- 3.6: private Storage for profile avatars and import source files.
-- The first path component is always the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars', 'avatars', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'imports', 'imports', false, 10485760,
    array[
      'text/csv', 'text/plain', 'application/csv', 'text/comma-separated-values',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Read access is needed for authenticated downloads and signed URL creation.
-- No UPDATE policy: clients replace an avatar with a new path and delete the old one.
create policy "owner reads private files"
on storage.objects for select to authenticated
using (
  bucket_id in ('avatars', 'imports')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "owner uploads private files"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('avatars', 'imports')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "owner deletes private files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('avatars', 'imports')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
