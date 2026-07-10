## Plan — Arreglar envío automático de WhatsApp al confirmar SPEI

El botón **Confirmar pedido SPEI** hoy registra el pedido pero no abre WhatsApp de forma confiable (el popup se bloquea en móvil por abrirse después de varios `await`). Voy a corregirlo usando tu número confirmado **7831450929** (formateado como `5217831450929`).

### Cambios en `src/features/counter-store/CartPanel.tsx`

1. **Normalizar el número de WhatsApp**
   - Función local `waNumber()`: limpia caracteres, y si detecta 10 dígitos mexicanos les antepone `521`.
   - Se aplica tanto al número de `settings.whatsapp_number` como al del comprador.

2. **Abrir la ventana ANTES de los `await`** (clave para móviles)
   - Al hacer click en "Confirmar pedido SPEI", abrir de inmediato `window.open("about:blank", "_blank")` — dentro del gesto del usuario, así no se bloquea.
   - Guardar la referencia a esa ventana.
   - Después de registrar el pedido, actualizar `win.location.href` con el link final de WhatsApp.
   - Si `win` es null (navegador bloqueó), fallback a `window.location.href`.

3. **Mensaje final SPEI**
   - Reutilizar `mensajeWhats` + agregar:
     - `🧾 Comprobante SPEI: <url>`
     - `🔎 Semáforo del pedido: <origin>/pedido/<id>`
   - Enviado al número de la tienda (`5217831450929`).

4. **Navegación al semáforo**
   - Después de disparar WhatsApp, navegar a `/pedido/:id` como ya se hacía.

### Publicación

- No toco Vercel directamente (no tengo acceso), pero si tu repo de GitHub está conectado a Vercel, el push automático desplegará el cambio.
- Publicaré también en Lovable (`.lovable.app`) para que puedas verificar antes.

### Fuera de alcance

- No cambio UI, carrito, base de datos, cupones, stock, ni el flujo Efectivo (ese ya funciona con el `<a href>`).