// [Módulo: features/kitchen-kds] -> [Archivo: KitchenBoard.tsx] -> [Acción: CREAR]
// KDS Kanban maestro de Majito. Diseño "One-Thumb": botones enormes, alto contraste.

const columnas = [
  { id: "mostrador", titulo: "Mostrador", color: "bg-shocking", ruta: "A" },
  { id: "personalizado", titulo: "Personalizado", color: "bg-sweet-pink", ruta: "B" },
  { id: "eventos", titulo: "Eventos", color: "bg-mocha", ruta: "C" },
  { id: "regalos", titulo: "Regalos", color: "bg-sunset", ruta: "D" },
];

export function KitchenBoard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columnas.map((c) => (
        <section
          key={c.id}
          className="flex min-h-[400px] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-mocha/10"
        >
          <header
            className={`flex items-center justify-between rounded-t-2xl ${c.color} px-4 py-3 text-white`}
          >
            <h3 className="text-lg font-bold">{c.titulo}</h3>
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
              Ruta {c.ruta}
            </span>
          </header>
          <div className="flex-1 p-3">
            <p className="rounded-xl border border-dashed border-mocha/30 p-6 text-center text-sm text-mocha">
              Sin pedidos activos.
            </p>
          </div>
          <div className="p-3">
            <button className="w-full rounded-full bg-shocking py-4 text-base font-bold text-white shadow active:scale-[0.98]">
              Validar anticipo
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}