Voy a implementar 5 bloques, todos gestionados desde Supabase. Antes de arrancar necesito tu OK y algunas decisiones ❓.

---

## 1. Datos bancarios y WhatsApp editables desde Supabase

Hoy están hardcoded en `CartPanel.tsx`. Los muevo a una tabla de configuración.

**Tabla `app_settings`** (key/value):
- `whatsapp_number`, `bank_name`, `bank_account`, `bank_holder`, `shipping_cost`
- RLS: lectura pública (`anon` SELECT), escritura solo `admin`
- Hook `useAppSettings()` que consume `CartPanel` y todos los mensajes de WhatsApp
- Página `/admin/configuracion` (protegida) con formulario para editarlos

---

## 2. Panel de admin con contraseña + inventario + control de stock

**❓ Decisión clave — cómo proteger el admin:**
- **A) Contraseña compartida** guardada como secret server-side (`ADMIN_PANEL_PASSWORD`). Rápido, sin login real.
- **B) Login Supabase Auth + tabla `user_roles`** con rol `admin` (patrón estándar `has_role`). Más seguro y auditable.

Recomiendo **B** — ya usas Supabase y es lo correcto para roles. Si prefieres simplicidad ahora, hago A y migramos después.

**Rutas admin nuevas** (bajo `_authenticated/` con rol admin, o gate por contraseña si eliges A):
- `/admin/inventario` — lista de `products`, editar `stock`, `precio`, `activo`; badge de "bajo stock"
- `/admin/configuracion` — §1
- `/admin/clientes` — §3
- `/admin/paquetes-eventos` — §4

**No vender más de lo que hay:**
- Ya existe `stock` en `products` y `CartContext` respeta el tope al agregar
- Añado función Postgres `decrement_stock(product_id, qty)` con `SECURITY DEFINER` — `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty RETURNING *`; si no devuelve fila, lanza error
- Se llama al confirmar pedido (antes de abrir WhatsApp) para reservar stock atómicamente
- Pedido queda `PENDING` en `counter_orders`; botón admin para "Cancelar y devolver stock"

---

## 3. Base de datos de clientes (CRM recurrentes)

**Tabla `customers`:**
```
id uuid pk, whatsapp text unique, name text,
first_order_at, last_order_at timestamptz,
total_orders int, total_spent numeric,
tags text[], notes text
```

**Trigger** en `counter_orders`, `custom_cake_orders`, `event_bookings`, `gift_orders`: al insertar hace upsert por `whatsapp` e incrementa contadores.

**UI `/admin/clientes`:**
- Lista con búsqueda y filtro "recurrentes" (`total_orders >= 3`)
- Botón "Enviar promo por WhatsApp" → abre `wa.me` con plantilla editable
- RLS: solo admin (contiene PII)

---

## 4. Carrito de Eventos — 2 categorías × 4 paquetes

En `/eventos`, reestructurar en 2 pasos:

**Paso 1 — Categoría:** 🧁 Repostería · 🥪 Snacks fríos  
**Paso 2 — Tamaño:** 50 · 100 · 150 · 200+ personas (200+ = "cotización personalizada")

**Tabla `event_packages`:**
```
id, categoria ('reposteria'|'snacks_frios'),
personas int, nombre, descripcion,
precio numeric, incluye jsonb, activo bool
```

Editable desde `/admin/paquetes-eventos`. Al elegir → formulario existente de reserva → WhatsApp con detalle completo (modalidad de entrega obligatoria, ya lo tienes en memoria).

**❓ ¿Me pasas precios y contenido de cada paquete o los creo como placeholders para que los edites en el admin?**

---

## 5. Upsells antes de cerrar la venta (CartPanel)

Bloque nuevo **"¿Le agregas un detalle especial?"** justo antes del botón "Confirmar pedido", con 3 tarjetas:

1. **🎁 Regalo sorpresa para alguien** — abre modal con productos `categoria='regalos'` (reusa flujo `addGift` existente con destinatario y mensaje)
2. **🕯️ Velas** — selector de cantidad; nuevos productos `categoria='velas'`
3. **💌 Mensaje en el pastel** — solo aparece si hay `categoria='pasteles'` en el carrito; textarea máx 60 chars que se adjunta al item en el mensaje de WhatsApp

Todos los extras se añaden a la sección `*✨ Extras:*` del mensaje final.

**❓ Velas:** ¿tienes nombres/precios/fotos, o creo genéricos ("Vela número $15", "Pack 10 velas regulares $25") editables desde admin?

---

## SQL maestro (te lo entrego completo al ejecutar)

Resumen de lo que crearé en una sola migración:

```sql
-- Roles (patrón estándar has_role + user_roles) -- si eliges opción B
-- app_settings + seeds + RLS + policies
-- customers + trigger de agregación desde las 4 tablas de pedidos
-- event_packages + seeds
-- decrement_stock() SECURITY DEFINER
-- GRANTs explícitos en cada tabla nueva
```

---

## Preguntas antes de arrancar

1. **Admin**: ¿opción **A** (contraseña compartida) o **B** (login + rol admin)? → recomiendo B
2. **Paquetes de eventos**: ¿me pasas precios/contenido, o placeholders editables?
3. **Velas**: ¿datos reales o genéricos editables?
4. **Regalos como upsell**: ¿usar todos los productos con `categoria='regalos'`, o quieres una selección curada "sugeridos para regalo"?

Respóndeme y ejecuto todo en un solo bloque.