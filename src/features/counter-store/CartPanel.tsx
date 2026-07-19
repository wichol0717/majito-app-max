import { useEffect, useMemo, useState, useCallback } from "react";
import { Gift, Minus, Plus, Trash2, MessageCircle, Cake, Flame, Sparkles, Upload, Loader2, Copy, CheckCircle2, Ticket, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCart, type Product } from "./CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/api/supabase";
import { AddressPicker, type AddressValue } from "@/components/AddressPicker";
import { findCoupon, parseCupones, readCupon, readOrigen, saveCupon, clearOrigenYCupon, type Cupon } from "@/lib/coupons";

function generarReferencia() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `MAJITO-${s}`;
}
interface CartPanelProps {
  address: AddressValue | null;
  setAddress: (v: AddressValue | null) => void;
}

export function CartPanel({ address, setAddress }: CartPanelProps) {
  const { items, increment, decrement, remove, subtotal, totalItems, hasAnyGift, clear, addToCart, setCakeMessage } =
    useCart();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const ENVIO_COSTO = Number(settings.shipping_cost) || 0;
  
  const waNumber = (raw: string) => {
    const d = (raw || "").replace(/[^0-9]/g, "");
    if (d.length === 10) return `521${d}`;
    if (d.length === 12 && d.startsWith("52")) return `521${d.slice(2)}`;
    return d;
  };
  const WHATSAPP_NUM = waNumber(String(settings.whatsapp_number || "7831450929"));
  const cuponesDisponibles: Cupon[] = useMemo(() => parseCupones((settings as any).cupones), [settings]);

  const [entrega, setEntrega] = useState<"tienda" | "envio">("tienda");
  
  // 1. Inicializar con el prop 'address' global
  const [direccion, setDireccion] = useState<AddressValue | null>(address);

  // 2. Mantener sincronizado si el prop cambia desde afuera
  useEffect(() => {
    setDireccion(address);
  }, [address]);

  // Evita que el mapa se reinicie solo
  const memoizedAddress = useMemo(() => direccion, [direccion]);

  // 3. Avisar al papá (setAddress) cuando el usuario cambie el pin
  const handleAddressChange = useCallback((val: any) => {
    setDireccion(val);
    setAddress(val); 
  }, [setAddress]);
  
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");

  const [metodo, setMetodo] = useState<"efectivo" | "spei">("efectivo");
  const [referencia] = useState(generarReferencia());
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [refCopiada, setRefCopiada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<Cupon | null>(null);
  const [cuponMsg, setCuponMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = readCupon();
    if (stored && !cuponAplicado) {
      const found = findCoupon(cuponesDisponibles, stored);
      if (found) { setCuponAplicado(found); setCuponInput(found.code); }
    }
  }, [cuponesDisponibles.length]);

  function aplicarCupon() {
    const found = findCoupon(cuponesDisponibles, cuponInput);
    if (!found) { setCuponMsg("Cupón no válido"); setCuponAplicado(null); return; }
    setCuponAplicado(found);
    saveCupon(found.code);
    setCuponMsg(`${found.pct}% aplicado`);
  }
  function quitarCupon() {
    setCuponAplicado(null);
    setCuponInput("");
    setCuponMsg(null);
  }

  const [velaProd, setVelaProd] = useState<Product | null>(null);
  const [showGiftHint, setShowGiftHint] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").eq("categoria", "Velas").eq("activo", "SI").limit(1)
      .then(({ data }) => { if (data && data[0]) setVelaProd(data[0] as Product); });
  }, []);

  const normalizarDir = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").trim();

  const direccionesEnvio = useMemo(() => {
    const set = new Set<string>();
    if (entrega === "envio" && direccion && direccion.direccion_texto.length >= 5) {
      set.add(normalizarDir(direccion.direccion_texto));
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
  const descuento = cuponAplicado ? +(subtotal * (cuponAplicado.pct / 100)).toFixed(2) : 0;
  const total = Math.max(0, subtotal - descuento) + costoEnviosTotal;

  const hayMostrador = items.some((i) => !i.isGift);
  const hayPastel = items.some((i) => (i.product.categoria ?? "").toLowerCase() === "pasteles");

  // Definición corregida para evitar el "undefined"
  // Definición segura
 // Definición robusta para evitar errores de undefined
  const direccionOk = entrega === "tienda" || (!!direccion && typeof direccion.direccion_texto === 'string' && direccion.direccion_texto.length >= 5);
  
  // Definición simplificada para activar el botón
  const puedeConfirmarWhats = items.length > 0 && direccionOk;
  const puedeConfirmarSpei =
    puedeConfirmarWhats === true &&
    buyerName.trim().length >= 2 &&
    buyerWhatsapp.trim().length >= 8 &&
    !!comprobanteUrl;
    // --- DIAGNÓSTICO DE BOTÓN SPEI ---
  useEffect(() => {
    console.log("--- ESTADO DEL BOTÓN SPEI ---");
    console.log("1. puedeConfirmarWhats:", puedeConfirmarWhats);
    console.log("2. Nombre (>=2):", buyerName.trim().length >= 2);
    console.log("3. WhatsApp (>=8):", buyerWhatsapp.trim().length >= 8);
    console.log("4. Comprobante URL existe:", !!comprobanteUrl);
    console.log("--- ¿BOTÓN HABILITADO?:", puedeConfirmarSpei, "---");
  }, [puedeConfirmarWhats, buyerName, buyerWhatsapp, comprobanteUrl, puedeConfirmarSpei]);
  // --- DIAGNÓSTICO PROFUNDO DE DIRECCIÓN Y ENTREGA ---

useEffect(() => {
    console.log("--- DEBUG DE DIRECCIÓN Y ENTREGA ---");
    console.log("1. Items en carrito:", items.length);
    console.log("2. Tipo de entrega:", entrega);
    console.log("3. ¿Hay productos que requieren dirección?:", items.some((i) => !i.isGift));
    console.log("4. ¿Dirección válida (direccionOk)?:", direccionOk);
    console.log("5. ¿Objeto dirección real?:", JSON.stringify(direccion));
  }, [items, entrega, direccionOk, direccion]);
    const mensajeWhats = useMemo(() => {
    const lineas: string[] = ["*Nuevo pedido — Majito Cake*", ""];
    if (metodo === "spei") lineas.push(`Referencia: *${referencia}*`, "");
    const regularItems = items.filter((i) => !i.isGift);
    const giftItems = items.filter((i) => i.isGift);

    if (regularItems.length > 0) {
      lineas.push("* Compra de mostrador:*");
      regularItems.forEach((i) => {
        const sub = i.quantity * Number(i.product.precio);
        lineas.push(`• ${i.quantity}× ${i.product.nombre} — $${sub.toFixed(2)}`);
        if (i.cakeMessage && i.cakeMessage.trim()) {
          lineas.push(`    Mensaje en pastel: "${i.cakeMessage.trim()}"`);
        }
      });
      if (entrega === "envio" && direccion) {
        lineas.push(`    Enviar a: ${direccion.direccion_texto}`);
        lineas.push(`    https://www.google.com/maps?q=${direccion.latitud},${direccion.longitud}`);
      } else {
        lineas.push("    Recoger en local");
      }
      lineas.push("");
    }

    if (giftItems.length > 0) {
      lineas.push("* Regalos (envío individual):*");
      const yaCobradas = new Set<string>();
      if (entrega === "envio" && direccion) {
        yaCobradas.add(normalizarDir(direccion.direccion_texto));
      }
      giftItems.forEach((i, idx) => {
        const sub = i.quantity * Number(i.product.precio);
        const g = i.giftDetails;
        lineas.push(`— Regalo #${idx + 1}: ${i.quantity}× ${i.product.nombre} — $${sub.toFixed(2)}`);
        if (i.giftMessage) lineas.push(`    Mensaje: "${i.giftMessage}"`);
        if (g) {
          lineas.push(`    De: ${g.buyerName} (WA: ${g.buyerWhatsapp})`);
          lineas.push(`    Para: ${g.recipientName} (WA: ${g.recipientWhatsapp})`);
          lineas.push(`    Entregar en: ${g.recipientLocation}`);
          if (g.recipientLat != null && g.recipientLng != null) {
            lineas.push(`    https://www.google.com/maps?q=${g.recipientLat},${g.recipientLng}`);
          }
          const key = normalizarDir(g.recipientLocation);
          if (yaCobradas.has(key)) {
            lineas.push(`    Envío: incluido (misma dirección ya cobrada)`);
          } else {
            yaCobradas.add(key);
            lineas.push(`    Envío a domicilio del festejado: $${ENVIO_COSTO.toFixed(2)}`);
          }
        }
      });
      lineas.push("");
    }

    lineas.push(`Subtotal: $${subtotal.toFixed(2)}`);
    if (descuento > 0 && cuponAplicado) {
      lineas.push(`Cupón ${cuponAplicado.code} (-${cuponAplicado.pct}%): -$${descuento.toFixed(2)}`);
    }
    if (enviosCobrables > 0) {
      lineas.push(`Envío (${enviosCobrables} × $${ENVIO_COSTO.toFixed(2)}): $${costoEnviosTotal.toFixed(2)}`);
    }
    lineas.push(`*Total a transferir: $${total.toFixed(2)}*`);
    lineas.push("");
    if (metodo === "spei" && comprobanteUrl) {
      lineas.push("Ya subí el comprobante SPEI. Enlace del pedido:");
    } else {
      lineas.push("¡Hola! Aquí está mi pedido. En un momento adjunto mi comprobante de pago.");
    }
    return lineas.join("\n");
  }, [items, subtotal, total, descuento, cuponAplicado, entrega, direccion, ENVIO_COSTO, enviosCobrables, costoEnviosTotal, metodo, referencia, comprobanteUrl]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(mensajeWhats)}`;

  async function subirComprobante(file: File) {
    setError(null);
    setSubiendo(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${referencia}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("comprobantes-pago")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("comprobantes-pago").getPublicUrl(path);
      setComprobanteUrl(data.publicUrl);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo subir el comprobante");
    } finally {
      setSubiendo(false);
    }
  }

  async function confirmarSpei(e?: React.MouseEvent) {
    if (!puedeConfirmarSpei) return;
    const waWin = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;
    setEnviando(true);
    setError(null);
    try {
      for (const it of items) {
        try {
          await supabase.rpc("decrement_stock", { _product_id: it.product.id, _qty: it.quantity } as any);
        } catch { }
      }

      const giftItems = items.filter((i) => i.isGift);
      const regularItems = items.filter((i) => !i.isGift);
      const yaCobradas = new Set<string>();
      let primerId: string | null = null;

      if (regularItems.length > 0) {
        const envioCostoMostrador =
          entrega === "envio" && direccion ? ENVIO_COSTO : 0;
        if (envioCostoMostrador > 0 && direccion) yaCobradas.add(normalizarDir(direccion.direccion_texto));
        const subtMostrador = regularItems.reduce((s, i) => s + i.quantity * Number(i.product.precio), 0);
        const descMostrador = cuponAplicado ? +(subtMostrador * (cuponAplicado.pct / 100)).toFixed(2) : 0;
        const totalMostrador = Math.max(0, subtMostrador - descMostrador) + envioCostoMostrador;
        const payload: any = {
          customer_name: buyerName.trim(),
          customer_whatsapp: buyerWhatsapp.trim(),
          total_paid: totalMostrador,
          payment_method: "spei",
          proof_image_url: comprobanteUrl,
          payment_reference: referencia,
          status: "PENDING",
          delivery_status: "validando_pago",
          envio_costo: envioCostoMostrador,
          cupon_codigo: cuponAplicado?.code ?? null,
          descuento: descMostrador,
          direccion_texto: entrega === "envio" && direccion ? direccion.direccion_texto : null,
          latitud: entrega === "envio" && direccion ? direccion.latitud : null,
          longitud: entrega === "envio" && direccion ? direccion.longitud : null,
          notas: regularItems.map((i) => `${i.quantity}× ${i.product.nombre}${i.cakeMessage ? ` [msg: ${i.cakeMessage}]` : ""}`).join(" | "),
        };
        const { data, error: insErr } = await (supabase.from("counter_orders") as any).insert(payload).select("id").single();
        if (insErr) throw insErr;
        primerId = data?.id ?? null;
      }

      for (const g of giftItems) {
        // --- VALIDACIÓN CRÍTICA ---
        if (!g.product.id) {
             throw new Error("Error: No se pudo identificar el producto del regalo. Intenta de nuevo.");
        }

        const key = g.giftDetails ? normalizarDir(g.giftDetails.recipientLocation) : "";
        const cobraEnvio = key && !yaCobradas.has(key);
        if (cobraEnvio) yaCobradas.add(key);
        const envio = cobraEnvio ? ENVIO_COSTO : 0;
        const subtRegalo = g.quantity * Number(g.product.precio);
        const descRegalo = cuponAplicado ? +(subtRegalo * (cuponAplicado.pct / 100)).toFixed(2) : 0;
        const totalRegalo = Math.max(0, subtRegalo - descRegalo) + envio;
        const payload: any = {
          product_id: g.product.id, // --- SE AGREGA EL ID ---
          customer_name: g.giftDetails?.buyerName ?? buyerName.trim(),
          customer_whatsapp: g.giftDetails?.buyerWhatsapp ?? buyerWhatsapp.trim(),
          total_paid: totalRegalo,
          payment_method: "spei",
          proof_image_url: comprobanteUrl,
          payment_reference: referencia,
          status: "PENDING",
          delivery_status: "validando_pago",
          envio_costo: envio,
          cupon_codigo: cuponAplicado?.code ?? null,
          descuento: descRegalo,
          direccion_texto: g.giftDetails?.recipientLocation ?? null,
          latitud: g.giftDetails?.recipientLat ?? null,
          longitud: g.giftDetails?.recipientLng ?? null,
          mensaje: g.giftMessage ?? null,
          recipient_name: g.giftDetails?.recipientName ?? null,
          recipient_whatsapp: g.giftDetails?.recipientWhatsapp ?? null,
          gift_items: [{
            producto: g.product.nombre,
            cantidad: g.quantity,
            precio: Number(g.product.precio),
            mensaje: g.giftMessage,
            para: g.giftDetails?.recipientName,
            wa_festejado: g.giftDetails?.recipientWhatsapp,
          }],
        };
        const { data, error: insErr } = await (supabase.from("gift_orders") as any).insert(payload).select("id").single();
        if (insErr) throw insErr;
        if (!primerId) primerId = data?.id ?? null;
      }

      try {
        const origen = readOrigen();
        const wa = buyerWhatsapp.trim();
        if (wa) {
          await supabase.rpc("set_customer_origen", {
            _whatsapp: wa,
            _origen: origen,
            _cupon: cuponAplicado?.code ?? null,
          } as any);
        }
      } catch { }

      clear();
      clearOrigenYCupon();

      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const extras: string[] = [];
        if (comprobanteUrl) extras.push(` Comprobante SPEI: ${comprobanteUrl}`);
        if (primerId) extras.push(` Semáforo del pedido: ${origin}/pedido/${primerId}`);
        const msgFinal = extras.length ? `${mensajeWhats}\n\n${extras.join("\n")}` : mensajeWhats;
        const url = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msgFinal)}`;
        if (waWin && !waWin.closed) {
          waWin.location.href = url;
        } else {
          window.location.href = url;
          return;
        }
      } catch { }

      if (primerId) {
        navigate({ to: "/pedido/$id", params: { id: primerId } });
      }
    } catch (err: any) {
      if (waWin && !waWin.closed) waWin.close();
      setError(err?.message ?? "No se pudo registrar el pedido");
    } finally {
      setEnviando(false);
    }
  }

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
          to="/personalizado"
          className="flex items-center justify-center gap-2 rounded-full bg-sweet-pink px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="text-[10px] font-bold opacity-60">B</span>
          Personalizado
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
                  alt={i.product.nombre ?? undefined}
                  className="h-16 w-16 flex-none rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-sunset text-2xl">
                  
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
                            Para <strong>{i.giftDetails.recipientName}</strong>  {i.giftDetails.recipientLocation}
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
                      <Cake className="h-3 w-3"/> Escribe el mensaje del pastel en cada producto de la lista.
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
              Toca el ícono  sobre cualquier producto del mostrador y llena los datos del destinatario. El mensaje viaja con el pedido por WhatsApp.
            </p>
          )}
          {hayPastel && (
            <p className="rounded bg-white/60 p-2 text-[11px] text-mocha">
               Escribe el mensaje del pastel en cada producto de la lista.
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
    <AddressPicker
      key="mapa-envio"
      value={memoizedAddress}
      onChange={handleAddressChange}
      label="Dirección exacta *"
      placeholder="Busca tu calle, colonia o referencia"
    />
  </div>
)}
      </div>

      <div className="border-t border-mocha/10 pt-3">
        <p className="mb-2 text-sm font-semibold text-foreground">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMetodo("efectivo")}
            className={`rounded-xl border-2 p-3 text-left text-xs transition ${metodo === "efectivo" ? "border-shocking bg-shocking/10" : "border-mocha/20 bg-white hover:border-shocking/40"}`}>
            <p className="font-semibold text-foreground">Efectivo / WhatsApp</p>
            <p className="text-mocha">Coordinar por chat</p>
          </button>
          <button type="button" onClick={() => setMetodo("spei")}
            className={`rounded-xl border-2 p-3 text-left text-xs transition ${metodo === "spei" ? "border-shocking bg-shocking/10" : "border-mocha/20 bg-white hover:border-shocking/40"}`}>
            <p className="font-semibold text-foreground">Transferencia SPEI</p>
            <p className="text-mocha">Sube tu comprobante</p>
          </button>
        </div>
      </div>

      <div className={`rounded-xl p-3 text-xs text-foreground ${metodo === "spei" ? "bg-white ring-2 ring-shocking/40" : "bg-crema"}`}>
        <p className="mb-1 font-semibold text-shocking">Datos para transferencia SPEI</p>
        <p>Banco: <strong>{settings.bank_name}</strong></p>
        <p>Cuenta / CLABE: <strong>{settings.bank_account}</strong></p>
        <p>Titular: <strong>{settings.bank_holder}</strong></p>
        {metodo === "spei" && (
          <>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-crema p-2">
              <div className="flex-1">
                <p className="text-[10px] uppercase text-mocha">Referencia (concepto)</p>
                <p className="font-mono text-sm font-bold text-shocking">{referencia}</p>
              </div>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(referencia); setRefCopiada(true); setTimeout(() => setRefCopiada(false), 1500); }}
                className="flex items-center gap-1 rounded bg-shocking px-2 py-1 text-[11px] font-bold text-white"
              >
                {refCopiada ? <CheckCircle2 className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}
                {refCopiada ? "Copiada" : "Copiar"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-mocha">Monto a transferir: <strong className="text-shocking">${total.toFixed(2)}</strong></p>
          </>
        )}
      </div>

      {metodo === "spei" && (
        <div className="space-y-2 rounded-xl border border-shocking/30 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-shocking">Tus datos</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Tu nombre *"
              className="rounded border border-mocha/20 px-2 py-1.5 text-xs" maxLength={80}/>
            <input value={buyerWhatsapp} onChange={(e) => setBuyerWhatsapp(e.target.value)} placeholder="Tu WhatsApp *"
              inputMode="tel" className="rounded border border-mocha/20 px-2 py-1.5 text-xs" maxLength={20}/>
          </div>
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-shocking/40 bg-shocking/5 p-4 text-xs font-semibold text-shocking hover:bg-shocking/10">
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin"/> : comprobanteUrl ? <CheckCircle2 className="h-4 w-4"/> : <Upload className="h-4 w-4"/>}
            {subiendo ? "Subiendo…" : comprobanteUrl ? "Comprobante cargado — cambiar" : "Subir comprobante (foto)"}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setComprobanteFile(f); subirComprobante(f); } }}
            />
          </label>
          {comprobanteUrl && (
            <img src={comprobanteUrl} alt="Comprobante" className="mx-auto max-h-32 rounded"/>
          )}
          {comprobanteFile && !comprobanteUrl && !subiendo && (
            <p className="text-[11px] text-mocha">Archivo listo: {comprobanteFile.name}</p>
          )}
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
      )}

      <div className="space-y-1 border-t border-mocha/10 pt-3 text-sm">
        <div className="flex justify-between text-foreground/70">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && cuponAplicado && (
          <div className="flex justify-between text-green-600">
            <span>Cupón {cuponAplicado.code} (-{cuponAplicado.pct}%)</span>
            <span>-${descuento.toFixed(2)}</span>
          </div>
        )}
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

      <div className="rounded-xl border border-sunset/60 bg-sunset/20 p-3">
        <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-shocking">
          <Ticket className="h-3 w-3"/> ¿Tienes un cupón?
        </p>
        {cuponAplicado ? (
          <div className="flex items-center justify-between rounded-lg bg-white p-2 text-xs">
            <span className="font-mono font-bold text-green-600">{cuponAplicado.code} · -{cuponAplicado.pct}%</span>
            <button type="button" onClick={quitarCupon} className="flex items-center gap-1 text-mocha hover:text-shocking">
              <X className="h-3 w-3"/> Quitar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={cuponInput}
              onChange={(e) => { setCuponInput(e.target.value.toUpperCase()); setCuponMsg(null); }}
              placeholder="Escribe tu código"
              className="flex-1 rounded border border-mocha/20 px-2 py-1.5 text-xs font-mono uppercase"
              maxLength={20}
            />
            <button type="button" onClick={aplicarCupon}
              className="rounded bg-shocking px-3 py-1.5 text-xs font-bold text-white">
              Aplicar
            </button>
          </div>
        )}
        {cuponMsg && (
          <p className={`mt-1 text-[11px] ${cuponAplicado ? "text-green-600" : "text-red-600"}`}>{cuponMsg}</p>
        )}
      </div>

      {metodo === "efectivo" ? (
        <a
          href={puedeConfirmarWhats ? whatsappUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!puedeConfirmarWhats}
          onClick={(e) => {
            if (!puedeConfirmarWhats) {
              e.preventDefault();
              setError("Por favor completa los datos de entrega.");
            }
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition ${
            puedeConfirmarWhats ? "bg-shocking hover:bg-shocking/90" : "cursor-not-allowed bg-mocha/30"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Confirmar pedido por WhatsApp
        </a>
      ) : (
        <button
          type="button"
          disabled={!puedeConfirmarSpei || enviando}
          onClick={confirmarSpei}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition ${
            puedeConfirmarSpei ? "bg-shocking hover:bg-shocking/90" : "cursor-not-allowed bg-mocha/30"
          }`}
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {enviando ? "Procesando..." : "Confirmar pago SPEI"}
        </button>
      )}
    </aside>
  );
}