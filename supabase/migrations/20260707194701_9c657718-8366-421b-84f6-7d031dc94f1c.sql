
CREATE OR REPLACE FUNCTION public.set_customer_origen(_whatsapp text, _origen text, _cupon text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _whatsapp IS NULL OR length(_whatsapp) < 6 THEN RETURN; END IF;
  UPDATE public.customers
     SET origen = COALESCE(origen, _origen, 'directo'),
         cupon_activo = COALESCE(_cupon, cupon_activo)
   WHERE whatsapp = _whatsapp;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.set_customer_origen(text, text, text) TO anon, authenticated;
