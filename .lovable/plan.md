## Fase 1 — Google Maps + SPEI + Semáforo/Admin

Alcance: módulos 1, 2 y 3 del pedido. Regalos digitales (4) y repartidor (5) quedan para fases siguientes.

### 1. Base de datos (migración única)

Adaptar tablas existentes, sin duplicar:

- `counter_orders` y `gift_orders`: añadir columnas
  - `direccion_texto text`, `latitud numeric(10,7)`, `longitud numeric(10,7)`
  - `payment_reference text` (ej. `MAJITO-A3F9`)
  - `proof_image_url` ya existe → reutilizar
  - `delivery_status text default 'validando_pago'` con CHECK en `('validando_pago','en_cocina','listo','en_camino','entregado')`
  - `envio_costo numeric(10,2) default 0`
- `customers`: añadir `email text`, `origen text default 'directo'`, `cupon_activo text`
- `app_settings`: la clave `shipping_cost` ya existe (80). Se seguirá leyendo desde ahí.
- Storage: crear bucket público `comprobantes-pago` + policy anon INSERT/SELECT para subir fotos de comprobante.

### 2. Google Maps (módulo 1)

- Guardar `GOOGLE_MAPS_BROWSER_KEY` como secreto público expuesto vía `VITE_GOOGLE_MAPS_BROWSER_KEY` (la key ya dada por el usuario, `@secret:GOOGLE_API_KEY`, se copia a un nombre `VITE_*` para uso en browser). Restringida por referrer en Google Cloud (fuera del alcance de esta app).
- Nuevo componente `src/components/AddressPicker.tsx`:
  - Carga el script de Maps JS API async con `loading=async&callback=initMap&libraries=places`.
  - Usa `google.maps.places.PlaceAutocompleteElement` (Places API New) restringido a `componentRestrictions: { country: 'mx' }` y sesgado a Tuxpan, Veracruz (`locationBias` centrado en 20.9569, -97.4083, radio 25 km).
  - Al seleccionar un lugar, monta un `google.maps.Map` con marcador rojo arrastrable; el usuario puede afinar la posición.
  - Devuelve `{ direccion_texto, latitud, longitud }` al padre.
- Se integra en `CartPanel.tsx` (dirección de mostrador) y `GiftModal.tsx` (dirección de festejado). Reemplaza el input de texto libre actual.

### 3. Flujo SPEI + comprobante (módulo 2)

- En `CartPanel.tsx` reemplazar el checkout actual por un flujo de 2 pasos:
  1. Selección de método: `Efectivo` (mantiene flujo WhatsApp) o `Transferencia SPEI` (nuevo).
  2. Si SPEI:
     - Genera `payment_reference = 'MAJITO-' + <4 chars A-Z0-9>`.
     - Muestra tarjeta con Banco, Titular, CLABE (de `app_settings`) + referencia + monto total (subtotal + envío único por dirección, como ya está implementado).
     - Input `file` para subir comprobante → sube a bucket `comprobantes-pago` con path `${payment_reference}.jpg`, guarda URL pública.
     - Botón "Confirmar pedido" → inserta filas en `counter_orders` / `gift_orders` con:
       - `payment_method='spei'`, `proof_image_url`, `payment_reference`, `direccion_texto`, `latitud`, `longitud`, `envio_costo`, `delivery_status='validando_pago'`, `status='PENDING'`.
     - Redirige a `/pedido/:id` (tracking).
- Envío ($80) sigue viniendo de `app_settings.shipping_cost` y sumándose una vez por dirección única (regla ya existente).

### 4. Semáforo / rastreo cliente (módulo 3)

- Nueva ruta pública `src/routes/pedido.$id.tsx`:
  - Lee el pedido por id (busca en `counter_orders` y `gift_orders`).
  - Línea de tiempo de 5 pasos: Validando pago → En cocina → Listo → En camino → Entregado. Ilumina los pasos ≤ `delivery_status` actual.
  - Muestra referencia, total, dirección, mini-mapa con el pin del pedido.
  - Se suscribe a cambios realtime de Supabase para reflejar avances en vivo.

### 5. Panel admin extendido (módulo 3)

- Nueva ruta `src/routes/admin.pedidos.tsx` (protegida por `RequireAdmin` ya existente):
  - Tabs: "Pendientes de pago" | "En curso" | "Entregados".
  - Cada tarjeta muestra cliente, total, dirección con link a Google Maps, thumbnail del comprobante (click → modal grande).
  - Acciones vía server fns en `src/lib/admin.functions.ts`:
    - `adminApproveOrder({password, id, tabla})` → marca `status='VERIFIED'` y `delivery_status='en_cocina'`.
    - `adminAdvanceDelivery({password, id, tabla})` → avanza al siguiente estado del semáforo.
- En `src/routes/admin.configuracion.tsx` (ya existe) se garantiza que `shipping_cost` es editable (ya lo es via `adminUpdateSetting`).
- En `src/routes/admin.clientes.tsx` añadir filtro por `origen`.

### 6. Detalles técnicos

- No se toca `src/integrations/supabase/*` (auto-gen).
- `src/api/database.types.ts` se amplía manualmente con las nuevas columnas.
- Realtime en `pedido.$id.tsx` usa el cliente browser de `@/api/supabase`.
- La key de Google la guardo como secreto runtime `GOOGLE_MAPS_BROWSER_KEY` y además la escribo al `.env` como `VITE_GOOGLE_MAPS_BROWSER_KEY` para que el browser la lea. La key dada por el usuario está referrer-restringida (queda a su cargo agregar `*.lovable.app` y su dominio final en Google Cloud Console).
- Se seguirá enviando también el mensaje de WhatsApp actual al confirmar (para no romper el flujo existente); solo se añade el registro en BD y la carga del comprobante.

### Archivos que se van a crear/editar

- Migración SQL (nueva).
- Bucket `comprobantes-pago` (nuevo).
- `src/components/AddressPicker.tsx` (nuevo).
- `src/routes/pedido.$id.tsx` (nuevo).
- `src/routes/admin.pedidos.tsx` (nuevo).
- `src/features/counter-store/CartPanel.tsx` (editar: flujo SPEI + AddressPicker).
- `src/features/counter-store/GiftModal.tsx` (editar: AddressPicker para festejado).
- `src/lib/admin.functions.ts` (editar: aprobar/avanzar/listar pedidos).
- `src/routes/admin.clientes.tsx` (editar: filtro por origen).
- `src/routes/admin.tsx` (editar: link a /admin/pedidos).
- `src/api/database.types.ts` (editar: nuevas columnas).
- `.env` (nueva var `VITE_GOOGLE_MAPS_BROWSER_KEY`).

### Fuera de fase 1 (para siguiente turno)

- Módulo 4: Tarjeta digital `/regalo/:id`, banner promo `?promo=REGALO5`, cupones SOYBUENAMIGO/REGALO15, captura de `origen=regalo_digital`.
- Módulo 5: Ruta `/reparto/:id`, botón "Enviar a Repartidor" con prompt del número, QR de la tarjeta de regalo, confirmar entrega.

¿Apruebas para arrancar con esta fase 1?
