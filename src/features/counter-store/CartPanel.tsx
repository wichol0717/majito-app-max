import { useMemo, useState } from "react";
import { Gift, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "./CartContext";

const WHATSAPP_NUM = "5217831450929";
const ENVIO_COSTO = 80;

export function CartPanel() {
  const { items, increment, decrement, remove, subtotal, totalItems, hasAnyGift, clear } =
    useCart();

  const [entrega, setEntrega] = useState<"tienda" | "envio">("tienda");
  const [direccion, setDireccion] = useState("");

  const costoEnvio = entrega === "envio" ? ENVIO_COSTO : 0;
  const total = subtotal + costoEnvio;

  const puedeConfirmar =
    items.length > 0 && (entrega === "tienda" || direccion.trim().length >= 8);

  const mensajeWhats = useMemo(() => {
    const lineas: string[] = ["*Nuevo pedido — Majito Cake*", ""];
    items.forEach((i) => {
      const sub = i.quantity * Number(i.product.precio);
      const etiqueta = i.isGift ? " 🎁 REGALO" : "";
      lineas.push(`• ${i.quantity}× ${i.product.nombre}${etiqueta} — $${sub.toFixed(2)}`);
      if (i.isGift && i.giftMessage) {
        lineas.push(`   Mensaje: "${i.giftMessage}"`);
      }
    });
    lineas.push("");
    lineas.push(`Subtotal: $${subtotal.toFixed(2)}`);
    if (entrega === "envio") {
      lineas.push(`Envío a domicilio: $${ENVIO_COSTO.toFixed(2)}`);
      lineas.push(`Dirección: ${direccion}`);
    } else {
      lineas.push("Entrega: Recoger en tienda");
    }
    lineas.push(`*Total a transferir: $${total.toFixed(2)}*`);
    lineas.push("");
    lineas.push("¡Hola! Aquí está mi pedido. En un momento adjunto mi comprobante de pago.");
    return lineas.join("\n");
  }, [items, subtotal, total, entrega, direccion]);

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
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-sweet-pink">
                        <Gift className="h-3 w-3" /> Regalo: "{i.giftMessage}"
                      </p>
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
              </div>
            </li>
          );
        })}
      </ul>

      {!hasAnyGift && (
        <div className="rounded-xl border border-sweet-pink/40 bg-sweet-pink/10 p-3 text-xs text-foreground">
          🎁 <strong>¿Quieres convertir tu pedido en un detalle inolvidable?</strong> Añade un
          mensaje de regalo tocando el ícono 🎁 en cualquier producto.
        </div>
      )}

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
        <p>Banco: <strong>BBVA BANCOMER</strong></p>
        <p>Cuenta: <strong>4152 3144 9119 3861</strong></p>
        <p>Titular: <strong>Luis Ricardo Villalobos Fortun</strong></p>
      </div>

      <div className="space-y-1 border-t border-mocha/10 pt-3 text-sm">
        <div className="flex justify-between text-foreground/70">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {costoEnvio > 0 && (
          <div className="flex justify-between text-foreground/70">
            <span>Envío</span>
            <span>${costoEnvio.toFixed(2)}</span>
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