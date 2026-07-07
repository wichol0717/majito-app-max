// Genera mensajes de WhatsApp para el cliente cuando cambia el estado de un pedido.
// Devuelve el link wa.me listo para abrir con window.open.

export type DeliveryStatus =
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_camino"
  | "entregado";

interface Ctx {
  cliente: string;
  whatsapp: string; // 10 dígitos o E.164
  ref: string; // referencia corta
  total: number;
  origin: string; // window.location.origin
  orderId: string;
  esRegalo?: boolean;
  metodo?: string;
}

function clean(num: string) {
  const digits = (num || "").replace(/[^0-9]/g, "");
  // México: si son 10 dígitos, prefijar 521
  if (digits.length === 10) return `521${digits}`;
  return digits;
}

function link(ctx: Ctx, msg: string) {
  const num = clean(ctx.whatsapp);
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export function msgPagoAprobado(ctx: Ctx) {
  return link(
    ctx,
    `¡Hola ${ctx.cliente}! 🎉\n\nRecibimos tu pago de $${ctx.total.toFixed(
      2,
    )} (ref *${ctx.ref}*). Ya estamos preparando tu pedido con muuucho amor 💖\n\nPuedes ver el avance aquí:\n${ctx.origin}/pedido/${ctx.orderId}\n\n— Majito Cake 🧁`,
  );
}

export function msgAvance(ctx: Ctx, next: DeliveryStatus) {
  const base = `Hola ${ctx.cliente} 👋 — pedido *${ctx.ref}*`;
  const track = `\n\nSemáforo en vivo:\n${ctx.origin}/pedido/${ctx.orderId}`;
  const gift = ctx.esRegalo ? `\n\n🎁 Tarjeta digital: ${ctx.origin}/regalo/${ctx.orderId}` : "";
  switch (next) {
    case "en_cocina":
      return link(ctx, `${base}\n\n👩‍🍳 ¡Ya está en cocina! Empezamos a prepararlo.${track}${gift}\n\n— Majito Cake 🧁`);
    case "listo":
      return link(ctx, `${base}\n\n✅ ¡Está listo! ${
        ctx.metodo === "efectivo" || ctx.metodo === "spei" ? "Ya sale para su entrega." : "Ya puedes recogerlo o va en camino."
      }${track}${gift}\n\n— Majito Cake 🧁`);
    case "en_camino":
      return link(ctx, `${base}\n\n🛵 ¡Va en camino! Prepara los $${ctx.total.toFixed(2)}.${track}${gift}\n\n— Majito Cake 🧁`);
    case "entregado":
      return link(
        ctx,
        `${base}\n\n💖 ¡Entregado! Muchísimas gracias por tu compra.\n\n¿Nos regalas 30 segundos para dejar tu reseña? Nos ayuda muchísimo 🙏\nhttps://g.page/r/majito-cake/review\n\nY si quieres regalar algo dulce a alguien: ${ctx.origin}/regalos\n\n— Majito Cake 🧁`,
      );
    default:
      return link(ctx, `${base}${track}`);
  }
}