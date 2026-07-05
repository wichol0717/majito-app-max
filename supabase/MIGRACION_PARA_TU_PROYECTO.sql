-- ============================================================
-- Majito Cake — Migración para tu proyecto Supabase original
-- Pega TODO en: SQL Editor → New query → Run
-- Es SEGURO: usa IF NOT EXISTS y no borra tus productos actuales.
-- ============================================================

-- 1) PRODUCTS: agrega columnas nuevas si no existen
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 999;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2) APP SETTINGS (WhatsApp, banco, costos)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settings_public_read ON public.app_settings;
CREATE POLICY settings_public_read ON public.app_settings FOR SELECT TO anon, authenticated USING (is_public = true);

INSERT INTO public.app_settings(key,value) VALUES
  ('whatsapp_number', '"5217831450929"'::jsonb),
  ('bank_name', '"BBVA BANCOMER"'::jsonb),
  ('bank_account', '"4152 3144 9119 3861"'::jsonb),
  ('bank_holder', '"Luis Ricardo Villalobos Fortun"'::jsonb),
  ('shipping_cost', '80'::jsonb),
  ('low_stock_threshold', '3'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3) EVENT PACKAGES (Repostería / Snacks fríos × 50/100/150/200+)
CREATE TABLE IF NOT EXISTS public.event_packages (
  id BIGSERIAL PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('reposteria','snacks_frios')),
  personas INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2),
  incluye JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  requiere_cotizacion BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (categoria, personas)
);
GRANT SELECT ON public.event_packages TO anon, authenticated;
GRANT ALL ON public.event_packages TO service_role;
ALTER TABLE public.event_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS packages_public_read ON public.event_packages;
CREATE POLICY packages_public_read ON public.event_packages FOR SELECT TO anon, authenticated USING (activo = true);

INSERT INTO public.event_packages(categoria,personas,nombre,descripcion,precio,incluye,requiere_cotizacion) VALUES
  ('reposteria', 50,  'Repostería — 50 personas',  '50% brownies y 50% galletas con toppings diversos', NULL, '["Brownies (50%)","Galletas con toppings variados (50%)"]'::jsonb, true),
  ('reposteria', 100, 'Repostería — 100 personas', '50% brownies y 50% galletas con toppings diversos', NULL, '["Brownies (50%)","Galletas con toppings variados (50%)"]'::jsonb, true),
  ('reposteria', 150, 'Repostería — 150 personas', '50% brownies y 50% galletas con toppings diversos', NULL, '["Brownies (50%)","Galletas con toppings variados (50%)"]'::jsonb, true),
  ('reposteria', 200, 'Repostería — 200+ personas','50% brownies y 50% galletas con toppings diversos', NULL, '["Brownies (50%)","Galletas con toppings variados (50%)"]'::jsonb, true),
  ('snacks_frios', 50,  'Snacks fríos — 50 personas',  '50% paletas y 50% Boings con toppings diversos', NULL, '["Paletas (50%)","Boings con toppings (50%)"]'::jsonb, true),
  ('snacks_frios', 100, 'Snacks fríos — 100 personas', '50% paletas y 50% Boings con toppings diversos', NULL, '["Paletas (50%)","Boings con toppings (50%)"]'::jsonb, true),
  ('snacks_frios', 150, 'Snacks fríos — 150 personas', '50% paletas y 50% Boings con toppings diversos', NULL, '["Paletas (50%)","Boings con toppings (50%)"]'::jsonb, true),
  ('snacks_frios', 200, 'Snacks fríos — 200+ personas','50% paletas y 50% Boings con toppings diversos', NULL, '["Paletas (50%)","Boings con toppings (50%)"]'::jsonb, true)
ON CONFLICT (categoria, personas) DO NOTHING;

-- 4) CUSTOMERS (CRM automático)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp TEXT UNIQUE NOT NULL,
  name TEXT,
  first_order_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_order_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customers_service_all ON public.customers;
CREATE POLICY customers_service_all ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5) FUNCIÓN: descuenta stock de forma atómica (no vende más de lo que hay)
CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id BIGINT, _qty INTEGER)
RETURNS public.products
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.products;
BEGIN
  UPDATE public.products SET stock = stock - _qty, updated_at = now()
   WHERE id = _product_id AND stock >= _qty
  RETURNING * INTO row;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Sin stock suficiente para producto %', _product_id USING ERRCODE='P0001'; END IF;
  RETURN row;
END; $$;
GRANT EXECUTE ON FUNCTION public.decrement_stock(BIGINT, INTEGER) TO anon, authenticated, service_role;

-- 6) SEED: agrega producto "Vela de fiesta" ($60) si no existe
INSERT INTO public.products (nombre, precio, categoria, activo, stock, descripcion)
SELECT 'Vela de fiesta', 60, 'Velas', 'SI', 999, 'Vela decorativa para pastel'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE lower(nombre) = 'vela de fiesta');

-- ============================================================
-- LISTO. Refresca la app y ya podrás:
--   • Editar WhatsApp / datos bancarios desde /admin/configuracion
--   • Ver y ajustar stock desde /admin/inventario
--   • Configurar paquetes de eventos desde /admin/paquetes
--   • Ver clientes recurrentes desde /admin/clientes
-- ============================================================