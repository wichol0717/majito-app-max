
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='comprobantes_pago_public_read') THEN
    CREATE POLICY "comprobantes_pago_public_read" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'comprobantes-pago');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='comprobantes_pago_public_insert') THEN
    CREATE POLICY "comprobantes_pago_public_insert" ON storage.objects
      FOR INSERT TO anon, authenticated
      WITH CHECK (bucket_id = 'comprobantes-pago');
  END IF;
END $$;
