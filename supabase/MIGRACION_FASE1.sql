-- ============================================================
-- Majito Cake — Migración FASE 1
-- Google Maps + SPEI + Semáforo de entrega + Panel de pedidos
-- Pega TODO en: SQL Editor → New query → Run
-- Seguro: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- 1) COUNTER_ORDERS: dirección georreferenciada + semáforo + referencia SPEI
ALTER TABLE public.counter_orders
  ADD COLUMN IF NOT EXISTS direccion_texto TEXT,
  ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS envio_costo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'validando_pago',
  ADD COLUMN IF NOT EXISTS notas TEXT;

DO $$ BEGIN
  ALTER TABLE public.counter_orders
    ADD CONSTRAINT counter_orders_delivery_status_chk
    CHECK (delivery_status IN ('validando_pago','en_cocina','listo','en_camino','entregado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) GIFT_ORDERS: mismas columnas
ALTER TABLE public.gift_orders
  ADD COLUMN IF NOT EXISTS direccion_texto TEXT,
  ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS envio_costo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'validando_pago',
  ADD COLUMN IF NOT EXISTS notas TEXT;

DO $$ BEGIN
  ALTER TABLE public.gift_orders
    ADD CONSTRAINT gift_orders_delivery_status_chk
    CHECK (delivery_status IN ('validando_pago','en_cocina','listo','en_camino','entregado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) CUSTOMERS: origen (marketing) + cupón + email
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'directo',
  ADD COLUMN IF NOT EXISTS cupon_activo TEXT;

-- 4) Permitir a los clientes CONSULTAR su propio pedido por ID (rastreo).
--    Insert desde la app anónima (checkout) + Select para el semáforo.
GRANT SELECT, INSERT ON public.counter_orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.gift_orders    TO anon, authenticated;
GRANT ALL ON public.counter_orders TO service_role;
GRANT ALL ON public.gift_orders    TO service_role;

ALTER TABLE public.counter_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_orders    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS counter_orders_public_read  ON public.counter_orders;
CREATE POLICY counter_orders_public_read  ON public.counter_orders  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS counter_orders_public_write ON public.counter_orders;
CREATE POLICY counter_orders_public_write ON public.counter_orders  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS gift_orders_public_read     ON public.gift_orders;
CREATE POLICY gift_orders_public_read     ON public.gift_orders     FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS gift_orders_public_write    ON public.gift_orders;
CREATE POLICY gift_orders_public_write    ON public.gift_orders     FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5) Storage: bucket público para los comprobantes SPEI
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-pago', 'comprobantes-pago', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS comprobantes_public_read   ON storage.objects;
CREATE POLICY comprobantes_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'comprobantes-pago');

DROP POLICY IF EXISTS comprobantes_public_upload ON storage.objects;
CREATE POLICY comprobantes_public_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'comprobantes-pago');

-- ============================================================
-- LISTO. Ahora la app puede:
--   • Guardar dirección + coordenadas GPS en cada pedido
--   • Registrar transferencias SPEI con comprobante en Storage
--   • Mostrar semáforo público en /pedido/<id>
--   • Aprobar y avanzar entregas desde /admin/pedidos
-- ============================================================