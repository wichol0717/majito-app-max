## Problema

En el checkout SPEI, `confirmarSpei()` en `src/features/counter-store/CartPanel.tsx` inserta el pedido y navega al semáforo, pero nunca abre `wa.me`. Solo el flujo "Efectivo/WhatsApp" (que usa el link `whatsappUrl`) manda mensaje. Resultado: cuando el cliente sube comprobante SPEI y confirma, ni tú ni él reciben el mensaje de WhatsApp.

## Solución

En `confirmarSpei()`, después de insertar los pedidos y **antes** del `navigate(...)`:

1. Construir el mensaje final de WhatsApp reusando `mensajeWhats` + agregar:
   - Link al comprobante subido (`comprobanteUrl`)
   - Link al semáforo del pedido (`${origin}/pedido/${primerId}`)
2. Abrir `https://wa.me/${WHATSAPP_NUM}?text=...` con `window.open(url, "_blank")` (evita bloqueo de popup porque se dispara en el mismo click del usuario).
3. Después navegar a `/pedido/:id`.

También añadir el mismo `window.open` de WhatsApp al confirmar en efectivo si el usuario venía del botón "Confirmar" (actualmente depende de que el usuario haga clic en el `<a>` de WhatsApp — dejar ambos caminos cubiertos).

## Cambios

- `src/features/counter-store/CartPanel.tsx`:
  - En `confirmarSpei()`, antes de `navigate`, calcular `msgFinal` (con link al comprobante y al pedido) y ejecutar `window.open(wa.me..., "_blank")`.
  - Manejar caso `window.open` bloqueado → fallback `window.location.href`.

Sin cambios de UI ni de esquema. Cero migración.
