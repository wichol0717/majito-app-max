import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  if (!product) return null;

  const enCarrito = quantityOf(product.id);
  const disponible = Math.max(0, product.stock - enCarrito);
  const canPlus = qty < disponible;
  const canMinus = qty > 1;

  const confirmar = () => {
    addGift(product, qty, mensaje);
    setQty(1);
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-crema">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={disponible === 0}>
            <Gift className="mr-1 h-4 w-4" /> Agregar regalo al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}