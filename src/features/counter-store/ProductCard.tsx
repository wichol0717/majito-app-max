import { Gift, Minus, Plus } from "lucide-react";
import { useCart, type Product } from "./CartContext";

interface Props {
  product: Product;
  onGiftClick: (p: Product) => void;
}

export function ProductCard({ product, onGiftClick }: Props) {
  const { quantityOf, addToCart, items, increment, decrement } = useCart();
  const enCarrito = quantityOf(product.id);
  const canPlus = enCarrito < product.stock;

  const nonGiftLine = items.find((i) => i.product.id === product.id && !i.isGift);

  const handlePlus = () => {
    if (!canPlus) return;
    if (nonGiftLine) increment(nonGiftLine.key);
    else addToCart(product, 1);
  };
  const handleMinus = () => {
    if (nonGiftLine) decrement(nonGiftLine.key);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-mocha/10 transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative">
        <button
          type="button"
          onClick={() => onGiftClick(product)}
          aria-label={`Regalar ${product.nombre}`}
          className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-sweet-pink text-white shadow-lg transition hover:scale-110 hover:bg-shocking"
        >
          <Gift className="h-4 w-4" />
        </button>
        {product.stock <= 0 && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-mocha px-2 py-1 text-[10px] font-bold uppercase text-white">
            Agotado
          </span>
        )}
        {product.img ? (
          <img
            src={product.img}
            alt={product.nombre}
            loading="lazy"
            className="h-44 w-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-sunset text-4xl">🍰</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha">
          {product.categoria ?? "Sin categoría"}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{product.nombre}</h3>
        {product.descripcion && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{product.descripcion}</p>
        )}
        <p className="mt-2 text-2xl font-bold text-shocking">
          ${Number(product.precio).toFixed(2)}
        </p>
        <p className="text-[11px] text-mocha">Stock: {product.stock}</p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-mocha/10 pt-3">
          <button
            type="button"
            onClick={handleMinus}
            disabled={enCarrito === 0}
            aria-label="Quitar uno"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset text-shocking transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-mocha/20"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-bold text-foreground">{enCarrito}</span>
          <button
            type="button"
            onClick={handlePlus}
            disabled={!canPlus}
            aria-label="Agregar uno"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-shocking text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-shocking/90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}