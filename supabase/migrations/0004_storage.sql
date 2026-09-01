-- Storage buckets + object policies.
--
-- Owner-scoped buckets use the path convention "{auth.uid()}/{filename}" —
-- the standard Supabase storage-RLS pattern of gating on the first path
-- segment. All buckets are public-read (matching the original Firebase
-- Storage behaviour of a public download URL); writes are owner- or
-- admin-restricted. CVs/cert docs could be moved to private + signed URLs
-- later if stricter access control is needed.

insert into storage.buckets (id, name, public) values
  ('worker-photos',   'worker-photos',   true),
  ('worker-cvs',       'worker-cvs',      true),
  ('worker-cert-docs', 'worker-cert-docs', true),
  ('employer-logos',  'employer-logos',  true),
  ('blog-images',     'blog-images',     true),
  ('site-assets',     'site-assets',     true)
on conflict (id) do nothing;

-- Owner-scoped buckets: any authenticated user may read; only the owner
-- (first path segment == their uid) or an admin may write/delete.
do $$
declare
  b text;
begin
  foreach b in array array['worker-photos', 'worker-cvs', 'worker-cert-docs', 'employer-logos']
  loop
    execute format(
      'create policy "%1$s_select_public" on storage.objects for select using (bucket_id = %2$L);',
      b, b
    );
    execute format(
      'create policy "%1$s_write_owner_or_admin" on storage.objects for insert
         with check (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
    execute format(
      'create policy "%1$s_update_owner_or_admin" on storage.objects for update
         using (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
    execute format(
      'create policy "%1$s_delete_owner_or_admin" on storage.objects for delete
         using (bucket_id = %2$L and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));',
      b, b
    );
  end loop;
end $$;

-- Admin-managed buckets: public read, admin-only write.
do $$
declare
  b text;
begin
  foreach b in array array['blog-images', 'site-assets']
  loop
    execute format(
      'create policy "%1$s_select_public" on storage.objects for select using (bucket_id = %2$L);',
      b, b
    );
    execute format(
      'create policy "%1$s_write_admin_only" on storage.objects for all
         using (bucket_id = %2$L and public.is_admin())
         with check (bucket_id = %2$L and public.is_admin());',
      b, b
    );
  end loop;
end $$;
