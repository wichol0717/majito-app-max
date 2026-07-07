# Fase 2 — Regalos digitales + Repartidor

## Módulo 4: Tarjeta digital de regalo y cupones

- Nueva ruta pública `src/routes/regalo.$id.tsx`:
  - Lee el `gift_orders` por id.
  - Muestra tarjeta bonita con el mensaje personalizado, remitente, festejado y foto/emoji temático.
  - Botón "Comprar tu propio regalo con 5% off" → link a `/regalos?promo=REGALO5`.
  - Botón "Ver estado del pedido" → `/pedido/:id`.

- Cupones (aplicables al total del carrito, `CartPanel.tsx` + `GiftModal.tsx`):
  - `REGALO5` (5%), `SOYBUENAMIGO` (10%), `REGALO15` (15%).
  - Se leen de `app_settings` (nueva clave `cupones` JSON) para poder editarlos desde admin.
  - Al aplicar, se guarda en `customers.cupon_activo` y en el pedido como `origen`.

- Banner en `/regalos` cuando `?promo=REGALO5`: precarga el cupón en el carrito y muestra aviso.

- Captura de `origen`: si el usuario llega vía `/regalo/:id` → `origen='regalo_digital'`; vía `?promo=...` → `origen='promo_<codigo>'`.

## Módulo 5: Repartidor

- Nueva ruta `src/routes/reparto.$id.tsx` (link privado enviado por WhatsApp al repartidor):
  - Muestra pedido: cliente, teléfono (click-to-call), dirección con botón "Abrir en Google Maps" (link `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`), total a cobrar, método de pago, comprobante si es SPEI.
  - Botón "Marcar entregado" → server fn que setea `delivery_status='entregado'`.
  - Si es regalo, muestra QR de la tarjeta digital (`/regalo/:id`) para mostrar al festejado.

- En `admin.pedidos.tsx` tarjeta "En camino":
  - Botón "Enviar a repartidor" → prompt para número de WhatsApp → abre `wa.me` con el link `/reparto/:id` y mensaje pre-armado con dirección + total.

## Cambios de datos

- Migración:
  - `gift_orders`: añadir `mensaje text`, `emoji text default '🎁'` (si no existen).
  - `counter_orders` y `gift_orders`: añadir `cupon_codigo text`, `descuento numeric(10,2) default 0`.
  - Insertar clave `cupones` en `app_settings` con los 3 cupones default.

## Archivos

- Nuevos: `src/routes/regalo.$id.tsx`, `src/routes/reparto.$id.tsx`, `src/lib/coupons.ts`.
- Editar: `CartPanel.tsx`, `GiftModal.tsx` (input cupón + descuento), `admin.pedidos.tsx` (botón repartidor), `admin.configuracion.tsx` (editar cupones), `src/routes/regalos.tsx` (banner promo), `src/api/database.types.ts`.

¿Apruebas para arrancar?
