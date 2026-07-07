-- Ejecutar en tu Supabase (jntrxjvntiwrmjzsxona) → SQL Editor
-- Añade columnas que el panel de admin necesita para listar pedidos.

ALTER TABLE public.counter_orders
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'validando_pago';

ALTER TABLE public.gift_orders
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'validando_pago';

CREATE INDEX IF NOT EXISTS counter_orders_created_at_idx
  ON public.counter_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS gift_orders_created_at_idx
  ON public.gift_orders (created_at DESC);