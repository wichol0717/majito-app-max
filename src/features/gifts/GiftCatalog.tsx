// [Módulo: features/gifts] -> [Archivo: GiftCatalog.tsx] -> [Acción: CREAR]
// Ruta D: Catálogo de regalos (esqueleto v1).

const regalos = [
  { id: "caja-chica", nombre: "Caja de galletas surtidas", precio: 180 },
  { id: "cupcakes-6", nombre: "6 cupcakes decorados", precio: 240 },
  { id: "detalle-flores", nombre: "Detalle con flores comestibles", precio: 320 },
  { id: "box-cumple", nombre: "Box de cumpleaños sorpresa", precio: 450 },
];

export function GiftCatalog() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {regalos.map((r) => (
        <article
          key={r.id}
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-mocha/10"
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground">{r.nombre}</h3>
            <p className="mt-1 text-2xl font-bold text-shocking">${r.precio}</p>
          </div>
          <button className="rounded-full bg-sweet-pink px-4 py-2 text-sm font-bold text-foreground">
            Elegir
          </button>
        </article>
      ))}
    </div>
  );
}