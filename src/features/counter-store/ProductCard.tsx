import { useState } from "react";
import { Gift, Minus, Plus } from "lucide-react";
import { useCart, type Product } from "./CartContext";

export interface CakeSize {
  nombre: "Individual" | "Mediano" | "Grande";
  precio: number;
  porciones?: string;
}

interface Props {
  product: Product;
  onGiftClick: (p: Product) => void;
}

export function ProductCard({ product, onGiftClick }: Props) {
  const { quantityOf, addToCart, items, increment, decrement } = useCart();

  // Determinamos si el producto pertenece a la categoría Pasteles
  const isPastel = product.categoria === "Pasteles";

  // Lista de tamaños con sus valores configurados o por defecto
  const tamaniosList: CakeSize[] =
    (product as any).tamanios && (product as any).tamanios.length > 0
      ? (product as any).tamanios
      : [
          { nombre: "Individual", precio: Number(product.precio) || 150, porciones: "Pequeño" },
          { nombre: "Mediano", precio: 350, porciones: "6 a 8 personas" },
          { nombre: "Grande", precio: 600, porciones: "15 a 20 personas" },
        ];

  // Estado del tamaño seleccionado (por defecto Individual si es pastel)
  const [selectedSize, setSelectedSize] = useState<CakeSize | undefined>(
    isPastel ? tamaniosList[0] : undefined
  );

  const enCarrito = quantityOf(product.id);
  const canPlus = enCarrito < product.stock;

  // Busca el ítem en el carrito respetando el tamaño en caso de ser pastel
  const nonGiftLine = items.find(
    (i: any) =>
      i.product.id === product.id &&
      !i.isGift &&
      (!isPastel ||
        i.selectedSize?.nombre === selectedSize?.nombre ||
        i.product?.selectedSize?.nombre === selectedSize?.nombre ||
        i.product?.tamano === selectedSize?.nombre ||
        i.tamano === selectedSize?.nombre)
  );

  // Precio dinámico a mostrar según el tamaño elegido
  const currentPrice = isPastel && selectedSize ? selectedSize.precio : product.precio;

  const handlePlus = () => {
    if (!canPlus) return;
    if (nonGiftLine) {
      increment(nonGiftLine.key);
    } else {
      // Pasamos el producto con el tamaño integrado en el nombre y en propiedades de texto plano
      const productToAdd = {
        ...product,
        nombre: isPastel && selectedSize ? `${product.nombre} (${selectedSize.nombre})` : product.nombre,
        precio: currentPrice,
        selectedSize,
        tamano: isPastel ? selectedSize?.nombre : undefined,
        tamaño: isPastel ? selectedSize?.nombre : undefined,
        size: isPastel ? selectedSize?.nombre : undefined,
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
              nombre: isPastel && selectedSize ? `${product.nombre} (${selectedSize.nombre})` : product.nombre,
              precio: currentPrice,
              selectedSize,
              tamano: isPastel ? selectedSize?.nombre : undefined,
              tamaño: isPastel ? selectedSize?.nombre : undefined,
              size: isPastel ? selectedSize?.nombre : undefined,
            } as any)
          }
          aria-label={`Regalar ${product.nombre ?? "producto"}`}
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

        {/* SELECTOR DE TAMAÑOS (Únicamente para la categoría Pasteles) */}
        {isPastel && (
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mocha">
              Selecciona tamaño:
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {tamaniosList.map((t) => {
                const isSelected = selectedSize?.nombre === t.nombre;
                return (
                  <button
                    key={t.nombre}
                    type="button"
                    onClick={() => setSelectedSize(t)}
                    className={`flex flex-col items-center justify-center rounded-xl p-1.5 text-xs transition border ${
                      isSelected
                        ? "bg-shocking text-white border-shocking shadow-sm"
                        : "bg-sunset/40 text-mocha border-mocha/10 hover:border-shocking/50"
                    }`}
                  >
                    <span className="font-bold">{t.nombre}</span>
                    {t.porciones && (
                      <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-mocha/70"}`}>
                        {t.porciones}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-2 text-2xl font-bold text-shocking">
          ${Number(currentPrice).toFixed(2)}
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