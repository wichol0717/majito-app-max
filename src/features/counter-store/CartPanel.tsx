import { useEffect, useMemo, useState } from "react";
import { Gift, Minus, Plus, Trash2, MessageCircle, Cake, Flame, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type Product } from "./CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/api/supabase";

export function CartPanel() {
  const { items, increment, decrement, remove, subtotal, totalItems, hasAnyGift, clear, addToCart, setCakeMessage } =
    useCart();
  const { settings } = useAppSettings();
  const ENVIO_COSTO = Number(settings.shipping_cost) || 0;
  const WHATSAPP_NUM = String(settings.whatsapp_number);

  const [entrega, setEntrega] = useState<"tienda" | "envio">("tienda");
  const [direccion, setDireccion] = useState("");

  // Upsell state
  const [velaProd, setVelaProd] = useState<Product | null>(null);
  const [showGiftHint, setShowGiftHint] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").eq("categoria", "Velas").eq("activo", "SI").limit(1)
      .then(({ data }) => { if (data && data[0]) setVelaProd(data[0] as Product); });
  }, []);

  const normalizarDir = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").trim();

  // Direcciones únicas de envío. Si el mostrador va a domicilio y coincide con
  // la de un regalo (mismo comprador entrega en el mismo lugar), se cobra 1 solo envío.
  const direccionesEnvio = useMemo(() => {
    const set = new Set<string>();
    if (entrega === "envio" && direccion.trim().length >= 8) {
      set.add(normalizarDir(direccion));
    }
    items.forEach((i) => {
      if (i.isGift && i.giftDetails?.recipientLocation) {
        set.add(normalizarDir(i.giftDetails.recipientLocation));
      }
    });
    return set;
  }, [items, entrega, direccion]);

  const enviosCobrables = direccionesEnvio.size;
  const costoEnviosTotal = enviosCobrables * ENVIO_COSTO;
  const total = subtotal + costoEnviosTotal;

  const hayMostrador = items.some((i) => !i.isGift);
  const hayPastel = items.some((i) => (i.product.categoria ?? "").toLowerCase() === "pasteles");
  const puedeConfirmar =
    items.length > 0 &&
    (entrega === "tienda" || !hayMostrador || direccion.trim().length >= 8);

  const mensajeWhats = useMemo(() => {
    const lineas: string[] = ["*Nuevo pedido — Majito Cake*", ""];
    const regularItems = items.filter((i) => !i.isGift);
    const giftItems = items.filter((i) => i.isGift);

    if (regularItems.length > 0) {
      lineas.push("*🛍️ Compra de mostrador:*");
      regularItems.forEach((i) => {
        const sub = i.quantity * Number(i.product.precio);
        lineas.push(`• ${i.quantity}× ${i.product.nombre} — $${sub.toFixed(2)}`);
        if (i.cakeMessage && i.cakeMessage.trim()) {
          lineas.push(`   💌 Mensaje en pastel: "${i.cakeMessage.trim()}"`);
        }
      });
      if (entrega === "envio") {
        lineas.push(`   📍 Enviar a: ${direccion}`);
      } else {
        lineas.push("   🏪 Recoger en local");
      }
      lineas.push("");
    }

    if (giftItems.length > 0) {
      lineas.push("*🎁 Regalos (envío individual):*");
      const yaCobradas = new Set<string>();
      if (entrega === "envio" && direccion.trim().length >= 8) {
        yaCobradas.add(normalizarDir(direccion));
      }
      giftItems.forEach((i, idx) => {
        const sub = i.quantity * Number(i.product.precio);
        const g = i.giftDetails;
        lineas.push(`— Regalo #${idx + 1}: ${i.quantity}× ${i.product.nombre} — $${sub.toFixed(2)}`);
        if (i.giftMessage) lineas.push(`   💌 Mensaje: "${i.giftMessage}"`);
        if (g) {
          lineas.push(`   👤 De: ${g.buyerName} (WA: ${g.buyerWhatsapp})`);
          lineas.push(`   🎉 Para: ${g.recipientName} (WA: ${g.recipientWhatsapp})`);
          lineas.push(`   📍 Entregar en: ${g.recipientLocation}`);
          const key = normalizarDir(g.recipientLocation);
          if (yaCobradas.has(key)) {
            lineas.push(`   🚚 Envío: incluido (misma dirección ya cobrada)`);
          } else {
            yaCobradas.add(key);
            lineas.push(`   🚚 Envío a domicilio del festejado: $${ENVIO_COSTO.toFixed(2)}`);
          }
        }
      });
      lineas.push("");
    }

    lineas.push(`Subtotal: $${subtotal.toFixed(2)}`);
    if (enviosCobrables > 0) {
      lineas.push(`Envío (${enviosCobrables} × $${ENVIO_COSTO.toFixed(2)}): $${costoEnviosTotal.toFixed(2)}`);
    }
    lineas.push(`*Total a transferir: $${total.toFixed(2)}*`);
    lineas.push("");
    lineas.push("¡Hola! Aquí está mi pedido. En un momento adjunto mi comprobante de pago.");
    return lineas.join("\n");
  }, [items, subtotal, total, entrega, direccion, ENVIO_COSTO, enviosCobrables, costoEnviosTotal]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(mensajeWhats)}`;

  if (items.length === 0) {
    return (
      <aside className="rounded-2xl border border-dashed border-mocha/40 bg-white p-6 text-center text-mocha">
        <p className="text-sm">Tu carrito está vacío.</p>
        <p className="mt-1 text-xs">Agrega productos desde el mostrador.</p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-mocha/10">
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/personalizados"
          className="flex items-center justify-center gap-2 rounded-full bg-sweet-pink px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[10px] font-bold opacity-60">B</span>
          Personalizados
        </Link>
        <Link
          to="/eventos"
          className="flex items-center justify-center gap-2 rounded-full bg-mocha px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[10px] font-bold opacity-60">C</span>
          Carrito de Eventos
        </Link>
      </div>
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-shocking">Tu carrito</h2>
        <span className="rounded-full bg-sunset px-3 py-1 text-xs font-semibold text-mocha">
          {totalItems} artículo{totalItems === 1 ? "" : "s"}
        </span>
      </header>

      <ul className="flex flex-col divide-y divide-mocha/10">
        {items.map((i) => {
          const totalEnCarritoProducto = items
            .filter((x) => x.product.id === i.product.id)
            .reduce((s, x) => s + x.quantity, 0);
          const noMasStock = totalEnCarritoProducto >= i.product.stock;
          const esPastel = (i.product.categoria ?? "").toLowerCase() === "pasteles" && !i.isGift;
          return (
            <li key={i.key} className="flex gap-3 py-3">
              {i.product.img ? (
                <img
                  src={i.product.img}
                  alt={i.product.nombre}
                  className="h-16 w-16 flex-none rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-sunset text-2xl">
                  🍰
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{i.product.nombre}</p>
                    {i.isGift && (
                      <div className="mt-0.5 space-y-0.5 text-[11px] text-sweet-pink">
                        <p className="flex items-center gap-1 font-semibold">
                          <Gift className="h-3 w-3" /> Regalo: "{i.giftMessage}"
                        </p>
                        {i.giftDetails && (
                          <p className="text-mocha">
                            Para <strong>{i.giftDetails.recipientName}</strong> → {i.giftDetails.recipientLocation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i.key)}
                    className="text-mocha hover:text-shocking"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrement(i.key)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-sunset text-shocking hover:bg-mocha/20"
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                    <button
                      type="button"
                      onClick={() => increment(i.key)}
                      disabled={noMasStock}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-shocking text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-shocking/90"
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-shocking">
                    ${(i.quantity * Number(i.product.precio)).toFixed(2)}
                  </span>
                </div>
                {esPastel && (
                  <div className="mt-2">
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-shocking">
                      <Cake className="h-3 w-3"/> Mensaje en el pastel (máx. 60)
                    </label>
                    <input
                      value={i.cakeMessage ?? ""}
                      maxLength={60}
                      placeholder="Ej: Feliz cumple, Sofi"
                      onChange={(e) => setCakeMessage(i.key, e.target.value)}
                      className="w-full rounded border border-mocha/20 px-2 py-1 text-xs outline-none focus:border-shocking"
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ===== UPSELLS ===== */}
      <div className="rounded-2xl border border-sweet-pink/40 bg-sweet-pink/10 p-3">
        <p className="mb-2 flex items-center gap-1 text-sm font-bold text-shocking">
          <Sparkles className="h-4 w-4"/> ¿Le agregas un detalle especial?
        </p>
        <div className="grid gap-2">
          {velaProd && (
            <button
              type="button"
              onClick={() => addToCart(velaProd, 1)}
              className="flex items-center justify-between rounded-xl bg-white p-2 text-left text-xs shadow-sm hover:shadow"
            >
              <span className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-sunset"/>
                <span><strong>{velaProd.nombre}</strong> — perfectas para tu pastel</span>
              </span>
              <span className="rounded-full bg-shocking px-2 py-1 font-bold text-white">+ ${Number(velaProd.precio).toFixed(0)}</span>
            </button>
          )}
          {!hasAnyGift && (
            <button
              type="button"
              onClick={() => setShowGiftHint((v) => !v)}
              className="flex items-center justify-between rounded-xl bg-white p-2 text-left text-xs shadow-sm hover:shadow"
            >
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-sweet-pink"/>
                <span><strong>Enviar como regalo</strong> — con mensaje personalizado</span>
              </span>
              <span className="text-sweet-pink">›</span>
            </button>
          )}
          {showGiftHint && (
            <p className="rounded bg-white/60 p-2 text-[11px] text-mocha">
              Toca el ícono 🎁 sobre cualquier producto del mostrador y llena los datos del destinatario. El mensaje viaja con el pedido por WhatsApp.
            </p>
          )}
          {hayPastel && (
            <p className="rounded bg-white/60 p-2 text-[11px] text-mocha">
              💌 Escribe el mensaje del pastel en cada producto de la lista.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-mocha/10 pt-3">
        <p className="mb-2 text-sm font-semibold text-foreground">Método de entrega</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEntrega("tienda")}
            className={`rounded-xl border-2 p-3 text-left text-xs transition ${
              entrega === "tienda"
                ? "border-shocking bg-shocking/10"
                : "border-mocha/20 bg-white hover:border-shocking/40"
            }`}
          >
            <p className="font-semibold text-foreground">Recoger en tienda</p>
            <p className="text-mocha">Gratis</p>
          </button>
          <button
            type="button"
            onClick={() => setEntrega("envio")}
            className={`rounded-xl border-2 p-3 text-left text-xs transition ${
              entrega === "envio"
                ? "border-shocking bg-shocking/10"
                : "border-mocha/20 bg-white hover:border-shocking/40"
            }`}
          >
            <p className="font-semibold text-foreground">Envío a domicilio</p>
            <p className="text-mocha">+ ${ENVIO_COSTO}</p>
          </button>
        </div>
        {entrega === "envio" && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Dirección completa *
            </label>
            <Textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia, referencia…"
              rows={2}
              maxLength={300}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-crema p-3 text-xs text-foreground">
        <p className="mb-1 font-semibold text-shocking">Datos para transferencia</p>
        <p>Banco: <strong>{settings.bank_name}</strong></p>
        <p>Cuenta: <strong>{settings.bank_account}</strong></p>
        <p>Titular: <strong>{settings.bank_holder}</strong></p>
      </div>

      <div className="space-y-1 border-t border-mocha/10 pt-3 text-sm">
        <div className="flex justify-between text-foreground/70">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {enviosCobrables > 0 && (
          <div className="flex justify-between text-foreground/70">
            <span>Envíos ({enviosCobrables} × ${ENVIO_COSTO.toFixed(2)})</span>
            <span>${costoEnviosTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-shocking">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <a
        href={puedeConfirmar ? whatsappUrl : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!puedeConfirmar}
        onClick={(e) => {
          if (!puedeConfirmar) e.preventDefault();
        }}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow transition ${
          puedeConfirmar
            ? "bg-shocking hover:bg-shocking/90"
            : "cursor-not-allowed bg-mocha/40"
        }`}
      >
        <MessageCircle className="h-5 w-5" />
        Confirmar pedido y Enviar Comprobante
      </a>

      <Button variant="ghost" size="sm" onClick={clear} className="text-mocha">
        Vaciar carrito
      </Button>
    </aside>
  );
}