import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Minus, Plus, Check } from "lucide-react";
import { useCart, type Product } from "./CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { AddressPicker, type AddressValue } from "@/components/AddressPicker";

const SUGERENCIAS = [
  "Feliz Cumpleaños",
  "Feliz Aniversario",
  "Para alguien especial",
  "Te amo",
];

const TARJETAS = [
  { id: "cumple", label: "Feliz Cumpleaños", img: "/tarjetas/cumple.jpg" },
  { id: "boda", label: "Feliz Boda", img: "/tarjetas/boda.jpg" },
  { id: "aniversario", label: "Feliz Aniversario", img: "/tarjetas/aniversario.jpg" },
  { id: "amor", label: "Te amo", img: "/tarjetas/amor.jpg" },
  { id: "especial", label: "Para alguien especial", img: "/tarjetas/especial.jpg" },
];

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function GiftModal({ product, onClose }: Props) {
  const { addGift, quantityOf } = useCart();
  const { settings } = useAppSettings();
  const ENVIO_COSTO = Number(settings.shipping_cost) || 0;
  
  const [qty, setQty] = useState(1);
  const [mensaje, setMensaje] = useState(""); 
  const [selectedCardId, setSelectedCardId] = useState<string>(TARJETAS[0].id);

  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
  const [recipientAddress, setRecipientAddress] = useState<AddressValue | null>(null);

  useEffect(() => {
    if (product) {
      setQty(1);
      setMensaje("");
      setSelectedCardId(TARJETAS[0].id);
      setBuyerName("");
      setBuyerWhatsapp("");
      setRecipientName("");
      setRecipientWhatsapp("");
      setRecipientAddress(null);
    }
  }, [product]);

  const formValido =
    buyerName.trim().length >= 2 &&
    buyerWhatsapp.trim().length >= 8 &&
    recipientName.trim().length >= 2 &&
    recipientWhatsapp.trim().length >= 8 &&
    recipientAddress !== null &&
    (recipientAddress.direccion_texto || "").trim().length > 0 &&
    mensaje.trim().length > 0;

  useEffect(() => {
    if (!formValido) {
      console.log("--- DIAGNÓSTICO DE FORMULARIO ---");
      console.log("1. Nombre Comprador (>=2):", buyerName.trim().length >= 2);
      console.log("2. WhatsApp Comprador (>=8):", buyerWhatsapp.trim().length >= 8);
      console.log("3. Nombre Festejado (>=2):", recipientName.trim().length >= 2);
      console.log("4. WhatsApp Festejado (>=8):", recipientWhatsapp.trim().length >= 8);
      console.log("5. ¿Existe objeto dirección?:", recipientAddress !== null);
      console.log("6. ¿Dirección texto tiene contenido?:", (recipientAddress?.direccion_texto || "").trim().length > 0);
      console.log("7. ¿Mensaje tiene contenido?:", mensaje.trim().length > 0);
      console.log("----------------------------------");
    }
  }, [buyerName, buyerWhatsapp, recipientName, recipientWhatsapp, recipientAddress, mensaje, formValido]);

  if (!product) return null;

  const enCarrito = quantityOf(product.id);
  const disponible = Math.max(0, product.stock - enCarrito);
  const canPlus = qty < disponible;
  const canMinus = qty > 1;

  const confirmar = () => {
    if (!recipientAddress) return;
    
    const cardObj = TARJETAS.find((t) => t.id === selectedCardId) || TARJETAS[0];
    
    addGift(product, qty, mensaje, {
      buyerName: buyerName.trim(),
      buyerWhatsapp: buyerWhatsapp.trim(),
      recipientName: recipientName.trim(),
      recipientWhatsapp: recipientWhatsapp.trim(),
      recipientLocation: recipientAddress.direccion_texto,
      recipientLat: recipientAddress.latitud,
      recipientLng: recipientAddress.longitud,
      cardId: cardObj.id,
      cardImage: cardObj.img,
      dedicatoria: mensaje.trim(), 
    });
    
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
              alt={product.nombre ?? "Imagen de producto"} 
              className="h-32 w-32 rounded-xl object-cover" 
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-sunset text-4xl">🎁</div>
          )}
          <div className="flex-1">
            <p className="text-2xl font-bold text-shocking">${Number(product.precio).toFixed(2)}</p>
            <p className="text-xs text-mocha">Disponibles: {disponible}</p>

            <div className="mt-3 flex items-center gap-3">
              <Button type="button" size="icon" variant="outline" onClick={() => canMinus && setQty(qty - 1)} disabled={!canMinus}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-semibold">{qty}</span>
              <Button type="button" size="icon" onClick={() => canPlus && setQty(qty + 1)} disabled={!canPlus}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Diseño de la tarjeta digital</label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {TARJETAS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCardId(t.id);
                }}
                className={`relative flex min-w-[100px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition-all ${
                  selectedCardId === t.id ? "border-shocking" : "border-mocha/20 hover:border-shocking/40"
                }`}
              >
                <div className="pointer-events-none relative h-16 w-full bg-sunset/30">
                  <img src={t.img} alt={t.label} className="h-full w-full object-cover" />
                  {selectedCardId === t.id && (
                    <div className="absolute right-1 top-1 rounded-full bg-shocking p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="pointer-events-none bg-white py-1.5 text-center text-[10px] font-medium text-foreground">
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="mensaje" className="mb-2 block text-sm font-semibold text-foreground">Mensaje de regalo (Dedicatoria)</Label>
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMensaje(s)}
                className="rounded-full border border-mocha/20 bg-white px-3 py-1 text-xs text-mocha hover:border-shocking"
              >
                {s}
              </button>
            ))}
          </div>
          <Input 
            id="mensaje" 
            value={mensaje} 
            onChange={(e) => setMensaje(e.target.value)} 
            placeholder="Escribe aquí tu mensaje personalizado..." 
            className="w-full"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-shocking/20 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-shocking">Datos del comprador</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyerName" className="text-xs">Tu nombre *</Label>
              <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div>
              <Label htmlFor="buyerWhatsapp" className="text-xs">Tu WhatsApp *</Label>
              <Input id="buyerWhatsapp" value={buyerWhatsapp} onChange={(e) => setBuyerWhatsapp(e.target.value)} placeholder="Ej. 7831234567" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-sweet-pink/40 bg-sweet-pink/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-sweet-pink">Datos del festejado</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="recipientName" className="text-xs">Nombre del festejado *</Label>
              <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="A quién se lo regalas" />
            </div>
            <div>
              <Label htmlFor="recipientWhatsapp" className="text-xs">WhatsApp del festejado *</Label>
              <Input id="recipientWhatsapp" value={recipientWhatsapp} onChange={(e) => setRecipientWhatsapp(e.target.value)} />            
            </div>
          </div>
          <AddressPicker
            value={recipientAddress}
            onChange={setRecipientAddress}
            label="Ubicación exacta del festejado *"
            placeholder="Busca la dirección de entrega"
          />
          <p className="rounded-lg bg-shocking/10 p-2 text-[11px] font-semibold text-shocking">
            🚚 Este regalo se envía a domicilio. Costo de envío: <strong>${ENVIO_COSTO.toFixed(2)}</strong>.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={!formValido}>
            <Gift className="mr-1 h-4 w-4" /> Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}