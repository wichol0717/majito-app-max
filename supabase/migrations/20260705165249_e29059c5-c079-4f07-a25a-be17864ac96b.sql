
-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  categoria TEXT,
  activo TEXT NOT NULL DEFAULT 'SI',
  img TEXT,
  descripcion TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated USING (activo = 'SI');
CREATE POLICY "products_service_all" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- APP SETTINGS (key/value editable desde admin)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "settings_service_all" ON public.app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- EVENT PACKAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.event_packages (
  id BIGSERIAL PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('reposteria','snacks_frios')),
  personas INTEGER NOT NULL CHECK (personas > 0),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2),
  incluye JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  requiere_cotizacion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (categoria, personas)
);
GRANT SELECT ON public.event_packages TO anon;
GRANT SELECT ON public.event_packages TO authenticated;
GRANT ALL ON public.event_packages TO service_role;
ALTER TABLE public.event_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON public.event_packages FOR SELECT TO anon, authenticated USING (activo = true);
CREATE POLICY "packages_service_all" ON public.event_packages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- ORDER TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.counter_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  total_paid NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  delivery_mode TEXT,
  delivery_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.counter_orders TO anon;
GRANT SELECT, INSERT ON public.counter_orders TO authenticated;
GRANT ALL ON public.counter_orders TO service_role;
ALTER TABLE public.counter_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counter_public_insert" ON public.counter_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "counter_service_all" ON public.counter_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.custom_cake_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  reference_photo_url TEXT,
  flavor_chosen TEXT NOT NULL,
  notes TEXT,
  total_price NUMERIC(10,2) NOT NULL,
  deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_mode TEXT,
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'HELD_24H',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.custom_cake_orders TO anon;
GRANT SELECT, INSERT ON public.custom_cake_orders TO authenticated;
GRANT ALL ON public.custom_cake_orders TO service_role;
ALTER TABLE public.custom_cake_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cakes_public_insert" ON public.custom_cake_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "cakes_service_all" ON public.custom_cake_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  event_date DATE NOT NULL,
  categoria TEXT,
  personas INTEGER,
  package_id BIGINT REFERENCES public.event_packages(id) ON DELETE SET NULL,
  total_price NUMERIC(10,2),
  deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_mode TEXT,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'HELD_24H',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.event_bookings TO anon;
GRANT SELECT, INSERT ON public.event_bookings TO authenticated;
GRANT ALL ON public.event_bookings TO service_role;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read_status" ON public.event_bookings FOR SELECT TO anon, authenticated USING (status IN ('HELD_24H','VERIFIED'));
CREATE POLICY "events_public_insert" ON public.event_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events_service_all" ON public.event_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.gift_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name TEXT NOT NULL,
  buyer_whatsapp TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_whatsapp TEXT,
  recipient_location TEXT NOT NULL,
  message TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gift_orders TO anon;
GRANT SELECT, INSERT ON public.gift_orders TO authenticated;
GRANT ALL ON public.gift_orders TO service_role;
ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts_public_insert" ON public.gift_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "gifts_service_all" ON public.gift_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- CUSTOMERS (CRM)
-- =========================================================
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
CREATE POLICY "customers_service_all" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- FUNCTIONS + TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id BIGINT, _qty INTEGER)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.products;
BEGIN
  UPDATE public.products
     SET stock = stock - _qty, updated_at = now()
   WHERE id = _product_id AND stock >= _qty
  RETURNING * INTO row;
  IF row.id IS NULL THEN
    RAISE EXCEPTION 'Sin stock suficiente para producto %', _product_id USING ERRCODE = 'P0001';
  END IF;
  RETURN row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.decrement_stock(BIGINT, INTEGER) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.upsert_customer_from_order(_whatsapp TEXT, _name TEXT, _amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _whatsapp IS NULL OR length(_whatsapp) < 6 THEN RETURN; END IF;
  INSERT INTO public.customers (whatsapp, name, last_order_at, total_orders, total_spent)
  VALUES (_whatsapp, _name, now(), 1, COALESCE(_amount,0))
  ON CONFLICT (whatsapp) DO UPDATE
     SET last_order_at = now(),
         total_orders = public.customers.total_orders + 1,
         total_spent = public.customers.total_spent + COALESCE(_amount,0),
         name = COALESCE(public.customers.name, EXCLUDED.name);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_counter_customer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.upsert_customer_from_order(NEW.customer_whatsapp, NEW.customer_name, NEW.total_paid); RETURN NEW; END; $$;
CREATE TRIGGER counter_orders_customer AFTER INSERT ON public.counter_orders FOR EACH ROW EXECUTE FUNCTION public.trg_counter_customer();

CREATE OR REPLACE FUNCTION public.trg_cake_customer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.upsert_customer_from_order(NEW.customer_whatsapp, NEW.customer_name, NEW.total_price); RETURN NEW; END; $$;
CREATE TRIGGER cake_orders_customer AFTER INSERT ON public.custom_cake_orders FOR EACH ROW EXECUTE FUNCTION public.trg_cake_customer();

CREATE OR REPLACE FUNCTION public.trg_event_customer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.upsert_customer_from_order(NEW.customer_whatsapp, NEW.customer_name, COALESCE(NEW.total_price,0)); RETURN NEW; END; $$;
CREATE TRIGGER event_bookings_customer AFTER INSERT ON public.event_bookings FOR EACH ROW EXECUTE FUNCTION public.trg_event_customer();

CREATE OR REPLACE FUNCTION public.trg_gift_customer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.upsert_customer_from_order(NEW.buyer_whatsapp, NEW.buyer_name, NEW.total); RETURN NEW; END; $$;
CREATE TRIGGER gift_orders_customer AFTER INSERT ON public.gift_orders FOR EACH ROW EXECUTE FUNCTION public.trg_gift_customer();
