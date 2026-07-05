import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift, Minus, Plus } from "lucide-react";
import { useCart, type Product } from "./CartContext";

const MENSAJES = [
  "Feliz Cumpleaños",
  "Feliz Aniversario",
  "Para alguien especial",
  "Te amo",
];

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function GiftModal({ product, onClose }: Props) {
  const { addGift, quantityOf } = useCart();
  const [qty, setQty] = useState(1);
  const [mensaje, setMensaje] = useState(MENSAJES[0]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
  const [recipientLocation, setRecipientLocation] = useState("");

  if (!product) return null;

  const enCarrito = quantityOf(product.id);
  const disponible = Math.max(0, product.stock - enCarrito);
  const canPlus = qty < disponible;
  const canMinus = qty > 1;

  const formValido =
    buyerName.trim().length >= 2 &&
    buyerWhatsapp.trim().length >= 8 &&
    recipientName.trim().length >= 2 &&
    recipientWhatsapp.trim().length >= 8 &&
    recipientLocation.trim().length >= 5;

  const confirmar = () => {
    if (!formValido) return;
    addGift(product, qty, mensaje, {
      buyerName: buyerName.trim(),
      buyerWhatsapp: buyerWhatsapp.trim(),
      recipientName: recipientName.trim(),
      recipientWhatsapp: recipientWhatsapp.trim(),
      recipientLocation: recipientLocation.trim(),
    });
    setQty(1);
    setBuyerName("");
    setBuyerWhatsapp("");
    setRecipientName("");
    setRecipientWhatsapp("");
    setRecipientLocation("");
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-crema">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-shocking">
            <Gift className="h-5 w-5" /> Regalar: {product.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          {product.img ? (
            <img
              src={product.img}
              alt={product.nombre}
              className="h-32 w-32 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-sunset text-4xl">
              🎁
            </div>
          )}
          <div className="flex-1">
            <p className="text-2xl font-bold text-shocking">
              ${Number(product.precio).toFixed(2)}
            </p>
            <p className="text-xs text-mocha">Disponibles: {disponible}</p>

            <div className="mt-3 flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => canMinus && setQty(qty - 1)}
                disabled={!canMinus}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-semibold">{qty}</span>
              <Button
                type="button"
                size="icon"
                onClick={() => canPlus && setQty(qty + 1)}
                disabled={!canPlus}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Mensaje de regalo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MENSAJES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMensaje(m)}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                  mensaje === m
                    ? "border-shocking bg-shocking/10 text-shocking"
                    : "border-mocha/20 bg-white text-foreground hover:border-shocking/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-shocking/20 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-shocking">Datos del comprador</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyerName" className="text-xs">Tu nombre *</Label>
              <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} maxLength={80} placeholder="Nombre completo" />
            </div>
            <div>
              <Label htmlFor="buyerWhatsapp" className="text-xs">Tu WhatsApp *</Label>
              <Input id="buyerWhatsapp" value={buyerWhatsapp} onChange={(e) => setBuyerWhatsapp(e.target.value)} maxLength={20} placeholder="Ej. 7831234567" inputMode="tel" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-sweet-pink/40 bg-sweet-pink/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-sweet-pink">Datos del festejado / a quién enviar</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="recipientName" className="text-xs">Nombre del festejado *</Label>
              <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={80} placeholder="A quién se lo regalas" />
            </div>
            <div>
              <Label htmlFor="recipientWhatsapp" className="text-xs">WhatsApp del festejado *</Label>
              <Input id="recipientWhatsapp" value={recipientWhatsapp} onChange={(e) => setRecipientWhatsapp(e.target.value)} maxLength={20} placeholder="Ej. 7831112233" inputMode="tel" />
            </div>
          </div>
          <div>
            <Label htmlFor="recipientLocation" className="text-xs">Ubicación / dirección de entrega *</Label>
            <Textarea id="recipientLocation" value={recipientLocation} onChange={(e) => setRecipientLocation(e.target.value)} rows={2} maxLength={300} placeholder="Calle, número, colonia, referencias, ciudad" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={disponible === 0 || !formValido}>
            <Gift className="mr-1 h-4 w-4" /> Agregar regalo al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}