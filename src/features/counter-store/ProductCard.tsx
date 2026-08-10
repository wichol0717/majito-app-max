import { useState, useEffect } from "react";
import { Gift, Minus, Plus } from "lucide-react";
import { useCart, type Product } from "./CartContext";

export interface Variant {
  id: number;
  product_id?: number;
  nombre: string;
  precio: number;
  stock: number;
  porciones?: string;
}

interface Props {
  product: Product & { 
    product_variants?: Variant[];
    variants?: Variant[];
    tamanios?: Variant[];
  };
  onGiftClick: (p: Product) => void;
}

export function ProductCard({ product, onGiftClick }: Props) {
  const { quantityOf, addToCart, items, increment, decrement } = useCart();

  // Obtenemos las variantes directamente desde Supabase (según la relación o columna que devuelva)
  const variantes: Variant[] = product.product_variants ?? product.variants ?? product.tamanios ?? [];
  const tieneVariantes = variantes.length > 0;

  // Estado para el tamaño/variante seleccionado (por defecto la primera opción de la base de datos)
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    tieneVariantes ? variantes[0] : undefined
  );

  // Sincronizamos si cambia el producto
  useEffect(() => {
    if (variantes.length > 0) {
      setSelectedVariant(variantes[0]);
    } else {
      setSelectedVariant(undefined);
    }
  }, [product.id]);

  const enCarrito = quantityOf(product.id);
  
  // Precio y stock estrictamente regidos por lo que está en Supabase
  const currentPrice = tieneVariantes && selectedVariant ? Number(selectedVariant.precio) : Number(product.precio ?? 0);
  const currentStock = tieneVariantes && selectedVariant ? Number(selectedVariant.stock) : Number(product.stock ?? 0);
  const canPlus = enCarrito < currentStock;

  const nonGiftLine = items.find(
    (i: any) =>
      i.product.id === product.id &&
      !i.isGift &&
      (!tieneVariantes || i.selectedVariant?.id === selectedVariant?.id)
  );

  const handlePlus = () => {
    if (!canPlus) return;
    if (nonGiftLine) {
      increment(nonGiftLine.key);
    } else {
      const productToAdd = {
        ...product,
        nombre: tieneVariantes && selectedVariant ? `${product.nombre} (${selectedVariant.nombre})` : product.nombre,
        precio: currentPrice,
        selectedVariant,
      };
      addToCart(productToAdd as any, 1);
    }
  };

  const handleMinus = () => {
    if (nonGiftLine) decrement(nonGiftLine.key);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-mocha/10 transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            onGiftClick({
              ...product,
              nombre: tieneVariantes && selectedVariant ? `${product.nombre} (${selectedVariant.nombre})` : product.nombre,
              precio: currentPrice,
              selectedVariant,
            } as any)
          }
          aria-label={`Regalar ${product.nombre ?? "producto"}`}
          className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-sweet-pink text-white shadow-lg transition hover:scale-110 hover:bg-shocking"
        >
          <Gift className="h-4 w-4" />
        </button>

        {currentStock <= 0 && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-mocha px-2 py-1 text-[10px] font-bold uppercase text-white">
            Agotado
          </span>
        )}

        {product.img ? (
          <img
            src={product.img}
            alt={product.nombre ?? "Imagen del producto"}
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

        {/* SELECTOR DE TAMAÑOS / VARIANTES */}
        {tieneVariantes && (
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mocha">
              Tamaños / Opciones:
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {variantes.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 text-xs transition border ${
                      isSelected
                        ? "bg-shocking text-white border-shocking shadow-sm font-bold"
                        : "bg-sunset/40 text-mocha border-mocha/10 hover:border-shocking/50"
                    }`}
                  >
                    <span>{v.nombre}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/90" : "text-shocking font-semibold"}`}>
                      ${Number(v.precio).toFixed(2)}
                    </span>
                    {v.porciones && (
                      <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-mocha/70"}`}>
                        {v.porciones}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-shocking">
            ${currentPrice.toFixed(2)}
          </p>
          <p className="text-[11px] text-mocha">Stock: {currentStock}</p>
        </div>

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