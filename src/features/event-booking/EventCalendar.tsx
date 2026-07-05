// [Módulo: features/event-booking] -> [Archivo: EventCalendar.tsx] -> [Acción: CREAR]
// Ruta C: Calendario de eventos con reglas del Manifiesto Parte III Caso C:
//   - No pasado
//   - Anti-empalmes (1 evento por día)

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabase";
import { useAppSettings } from "@/hooks/useAppSettings";

type Cat = "reposteria" | "snacks_frios";
interface Pkg {
  id: number;
  categoria: Cat;
  personas: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  incluye: any;
  requiere_cotizacion: boolean;
}

export function EventCalendar() {
  const STORAGE_KEY = "majito.event-booking.v1";
  type Persisted = {
    seleccionada: string | null;
    categoria: Cat | null;
    personas: number | null;
    direccion: string;
    nombre: string;
    whatsapp: string;
  };
  const initial: Persisted = (() => {
    if (typeof window === "undefined") return {
      seleccionada: null, categoria: null, personas: null, direccion: "", nombre: "", whatsapp: "",
    };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return { seleccionada: null, categoria: null, personas: null, direccion: "", nombre: "", whatsapp: "", ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { seleccionada: null, categoria: null, personas: null, direccion: "", nombre: "", whatsapp: "" };
  })();

  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [seleccionada, setSeleccionada] = useState<string | null>(initial.seleccionada);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });
  const [paquetes, setPaquetes] = useState<Pkg[]>([]);
  const [categoria, setCategoria] = useState<Cat | null>(initial.categoria);
  const [personas, setPersonas] = useState<number | null>(initial.personas);
  const [direccion, setDireccion] = useState(initial.direccion);
  const [nombre, setNombre] = useState(initial.nombre);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const { settings } = useAppSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        seleccionada, categoria, personas, direccion, nombre, whatsapp,
      }));
    } catch { /* ignore */ }
  }, [seleccionada, categoria, personas, direccion, nombre, whatsapp]);

  useEffect(() => {
    supabase
      .from("event_bookings")
      .select("event_date, status")
      .in("status", ["HELD_24H", "VERIFIED"])
      .then(({ data }) => {
        setOcupadas(new Set((data ?? []).map((r) => r.event_date)));
      });
    supabase
      .from("event_packages")
      .select("*")
      .eq("activo", true)
      .then(({ data }) => setPaquetes((data ?? []) as Pkg[]));
  }, []);

  const dias = useMemo(() => construirMes(mes.anio, mes.mes), [mes]);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pkg = useMemo(() =>
    paquetes.find((p) => p.categoria === categoria && p.personas === personas) ?? null,
  [paquetes, categoria, personas]);

  const puedeReservar =
    seleccionada && pkg && nombre.trim().length >= 2 && whatsapp.trim().length >= 8 &&
    direccion.trim().length >= 8;

  const mensajeWA = useMemo(() => {
    if (!pkg || !seleccionada) return "";
    const l: string[] = [
      "*Reserva de evento — Majito Cake*",
      "",
      `📅 Fecha: ${formatearLargo(seleccionada)}`,
      `👥 Personas: ${pkg.personas === 200 ? "200+" : pkg.personas}`,
      `🎯 Categoría: ${pkg.categoria === "reposteria" ? "Repostería" : "Snacks fríos"}`,
      `📦 Paquete: ${pkg.nombre}`,
    ];
    if (pkg.descripcion) l.push(`   ${pkg.descripcion}`);
    if (pkg.requiere_cotizacion) l.push("   💬 Requiere cotización personalizada");
    else if (pkg.precio) l.push(`💰 Precio: $${Number(pkg.precio).toFixed(2)} (anticipo 50%: $${(Number(pkg.precio)/2).toFixed(2)})`);
    l.push("");
    l.push(`📍 Dirección del evento: ${direccion}`);
    l.push(`👤 Cliente: ${nombre} (WA: ${whatsapp})`);
    return l.join("\n");
  }, [pkg, seleccionada, direccion, nombre, whatsapp]);

  const whatsappUrl = pkg && seleccionada
    ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(mensajeWA)}`
    : undefined;

  return (
    <div>
      {/* Paso 1: Categoría */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mocha">1 · Categoría</p>
        <div className="grid grid-cols-2 gap-2">
          {(["reposteria","snacks_frios"] as Cat[]).map((c) => (
            <button key={c} type="button" onClick={() => { setCategoria(c); setPersonas(null); }}
              className={`rounded-xl border-2 p-3 text-left text-sm transition ${
                categoria === c ? "border-shocking bg-shocking/10" : "border-mocha/20 bg-white hover:border-shocking/40"
              }`}>
              <p className="font-bold text-foreground">{c === "reposteria" ? "🧁 Repostería" : "🥪 Snacks fríos"}</p>
              <p className="text-xs text-mocha">{c === "reposteria" ? "50% brownies + 50% galletas" : "50% paletas + 50% Boings"}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: Tamaño */}
      {categoria && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mocha">2 · Personas</p>
          <div className="grid grid-cols-4 gap-2">
            {[50,100,150,200].map((n) => {
              const p = paquetes.find((pk) => pk.categoria === categoria && pk.personas === n);
              return (
                <button key={n} type="button" onClick={() => setPersonas(n)} disabled={!p}
                  className={`rounded-xl border-2 p-2 text-center text-sm font-bold transition ${
                    personas === n ? "border-shocking bg-shocking/10 text-shocking" : "border-mocha/20 bg-white hover:border-shocking/40"
                  } disabled:opacity-40`}>
                  {n === 200 ? "200+" : n}
                  {p?.precio && <div className="text-[10px] font-normal text-mocha">${Number(p.precio).toFixed(0)}</div>}
                  {p?.requiere_cotizacion && <div className="text-[10px] font-normal text-mocha">Cotizar</div>}
                </button>
              );
            })}
          </div>
          {pkg && (
            <div className="mt-2 rounded-lg bg-white p-3 text-xs ring-1 ring-mocha/10">
              <p className="font-bold text-foreground">{pkg.nombre}</p>
              {pkg.descripcion && <p className="text-mocha">{pkg.descripcion}</p>}
            </div>
          )}
        </div>
      )}

      {/* Paso 3: Calendario */}
      {categoria && personas && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mocha">3 · Fecha del evento</p>
      )}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMes(retrocederMes(mes))}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-mocha/20"
        >
          ←
        </button>
        <h3 className="text-xl font-bold capitalize text-mocha">
          {nombreMes(mes.anio, mes.mes)}
        </h3>
        <button
          type="button"
          onClick={() => setMes(avanzarMes(mes))}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-mocha/20"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-widest text-mocha">
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {dias.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = d.toISOString().split("T")[0];
          const enPasado = d < hoy;
          const ocupada = ocupadas.has(iso);
          const seleccionadaHoy = seleccionada === iso;
          const bloqueada = enPasado || ocupada;

          return (
            <button
              key={iso}
              type="button"
              disabled={bloqueada}
              onClick={() => setSeleccionada(iso)}
              className={`aspect-square rounded-xl text-sm font-semibold transition ${
                bloqueada
                  ? "cursor-not-allowed bg-mocha/10 text-mocha/40 line-through"
                  : seleccionadaHoy
                    ? "bg-shocking text-white shadow-md"
                    : "bg-white text-foreground ring-1 ring-mocha/20 hover:bg-sunset"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {seleccionada && pkg && (
        <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-mocha/20">
          <p className="text-sm text-mocha">Fecha elegida:</p>
          <p className="text-xl font-bold text-shocking">{formatearLargo(seleccionada)}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <input value={nombre} onChange={(e)=>setNombre(e.target.value)} placeholder="Tu nombre"
              className="rounded border border-mocha/20 px-3 py-2 text-sm"/>
            <input value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="WhatsApp (521…)"
              className="rounded border border-mocha/20 px-3 py-2 text-sm"/>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-foreground">Dirección del evento *</p>
            <textarea value={direccion} onChange={(e)=>setDireccion(e.target.value)} rows={2}
              placeholder="Calle, número, colonia, referencia del lugar del evento…"
              className="w-full rounded border border-mocha/20 px-3 py-2 text-sm"/>
          </div>

          <a href={puedeReservar ? whatsappUrl : undefined}
            target="_blank" rel="noreferrer"
            aria-disabled={!puedeReservar}
            onClick={(e)=>{ if (!puedeReservar) e.preventDefault(); }}
            className={`block w-full rounded-full px-6 py-3 text-center font-bold text-white ${puedeReservar?"bg-shocking hover:bg-shocking/90":"cursor-not-allowed bg-mocha/40"}`}>
            {pkg.requiere_cotizacion ? "Pedir cotización por WhatsApp" : "Apartar con anticipo del 50% por WhatsApp"}
          </a>
          <p className="text-xs text-mocha">El día se aparta por 24 h mientras confirmas por WhatsApp.</p>
        </div>
      )}
    </div>
  );
}

function construirMes(anio: number, mes: number): (Date | null)[] {
  const primero = new Date(anio, mes, 1);
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const padding = primero.getDay();
  const arr: (Date | null)[] = Array(padding).fill(null);
  for (let i = 1; i <= totalDias; i++) arr.push(new Date(anio, mes, i));
  return arr;
}
function avanzarMes({ anio, mes }: { anio: number; mes: number }) {
  return mes === 11 ? { anio: anio + 1, mes: 0 } : { anio, mes: mes + 1 };
}
function retrocederMes({ anio, mes }: { anio: number; mes: number }) {
  const hoy = new Date();
  if (anio === hoy.getFullYear() && mes === hoy.getMonth()) return { anio, mes };
  return mes === 0 ? { anio: anio - 1, mes: 11 } : { anio, mes: mes - 1 };
}
function nombreMes(anio: number, mes: number) {
  return new Date(anio, mes, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}
function formatearLargo(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}