-- Imagem (logo/foto da empresa) opcional em cada vaga.
-- Bucket PÚBLICO para leitura (as vagas são públicas); só empresas e administradores gravam, na própria pasta.
ALTER TABLE public.jobs ADD COLUMN image_path text CHECK (image_path IS NULL OR char_length(image_path) <= 300);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-images', 'job-images', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY job_images_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-images' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp')
    AND (public.has_role(auth.uid(), 'company') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY job_images_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'job-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
