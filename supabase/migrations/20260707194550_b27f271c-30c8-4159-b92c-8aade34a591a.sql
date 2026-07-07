
ALTER TABLE public.counter_orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'validando_pago',
  ADD COLUMN IF NOT EXISTS direccion_texto TEXT,
  ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS envio_costo NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS cupon_codigo TEXT,
  ADD COLUMN IF NOT EXISTS descuento NUMERIC(10,2) DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='counter_orders_delivery_status_chk') THEN
    ALTER TABLE public.counter_orders
      ADD CONSTRAINT counter_orders_delivery_status_chk
      CHECK (delivery_status IN ('validando_pago','en_cocina','listo','en_camino','entregado'));
  END IF;
END $$;

ALTER TABLE public.gift_orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS proof_image_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'validando_pago',
  ADD COLUMN IF NOT EXISTS direccion_texto TEXT,
  ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS envio_costo NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gift_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mensaje TEXT,
  ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎁',
  ADD COLUMN IF NOT EXISTS cupon_codigo TEXT,
  ADD COLUMN IF NOT EXISTS descuento NUMERIC(10,2) DEFAULT 0;

UPDATE public.gift_orders
  SET customer_name     = COALESCE(customer_name, buyer_name),
      customer_whatsapp = COALESCE(customer_whatsapp, buyer_whatsapp),
      total_paid        = COALESCE(total_paid, total),
      mensaje           = COALESCE(mensaje, message)
  WHERE customer_name IS NULL OR customer_whatsapp IS NULL OR total_paid IS NULL;

GRANT SELECT, INSERT ON public.gift_orders TO anon;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='gift_orders_delivery_status_chk') THEN
    ALTER TABLE public.gift_orders
      ADD CONSTRAINT gift_orders_delivery_status_chk
      CHECK (delivery_status IN ('validando_pago','en_cocina','listo','en_camino','entregado'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_gift_customer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.upsert_customer_from_order(
    COALESCE(NEW.customer_whatsapp, NEW.buyer_whatsapp),
    COALESCE(NEW.customer_name, NEW.buyer_name),
    COALESCE(NEW.total_paid, NEW.total)
  );
  RETURN NEW;
END;
$function$;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'directo',
  ADD COLUMN IF NOT EXISTS cupon_activo TEXT;

INSERT INTO public.app_settings (key, value, is_public)
VALUES (
  'cupones',
  '[
    {"code":"REGALO5","pct":5,"desc":"5% al comprar tu propio regalo"},
    {"code":"SOYBUENAMIGO","pct":10,"desc":"10% para amigos frecuentes"},
    {"code":"REGALO15","pct":15,"desc":"15% especial regalos"}
  ]'::jsonb,
  true
)
ON CONFLICT (key) DO NOTHING;
