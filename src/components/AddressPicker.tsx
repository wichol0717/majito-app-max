import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getGoogleMapsKey } from "@/lib/maps.functions";

/**
 * Selector de dirección con Google Places Autocomplete + mapa arrastrable.
 * Devuelve al padre: texto legible, latitud y longitud (coordenadas GPS).
 * Restringido a México, con sesgo hacia Tuxpan, Veracruz.
 */

export interface AddressValue {
  direccion_texto: string;
  latitud: number;
  longitud: number;
}

interface Props {
  value: AddressValue | null;
  onChange: (v: AddressValue | null) => void;
  label?: string;
  placeholder?: string;
}

// Tuxpan, Veracruz
const TUXPAN = { lat: 20.9569, lng: -97.4083 };

// Loader singleton (solo un <script> en toda la sesión)
let loaderPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.importLibrary) return ensureMapsLibraries();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    (window as any).__majitoInitMap = () => {
      ensureMapsLibraries().then(resolve).catch(reject);
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async&callback=__majitoInitMap&language=es&region=MX&channel=majito_app`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

async function ensureMapsLibraries() {
  const g = (window as any).google;
  await Promise.all([
    g.maps.importLibrary("maps"),
    g.maps.importLibrary("places"),
    g.maps.importLibrary("geocoding"),
  ]);
}

export function AddressPicker({ value, onChange, label = "Dirección de entrega *", placeholder = "Busca calle, colonia o referencia" }: Props) {
  const getKey = useServerFn(getGoogleMapsKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(value?.direccion_texto ?? "");

  // Carga la API de Google Maps con la key obtenida del backend
  useEffect(() => {
    let cancelled = false;
    const browserKey =
      import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
      import.meta.env.VITE_GOOGLE_API_KEY ||
      import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
      "";

    const keyPromise = browserKey ? Promise.resolve({ key: browserKey }) : getKey();

    keyPromise
      .then(({ key }) => {
        if (!key) throw new Error("Maps no está activo en este deploy. Escribe la dirección completa para continuar.");
        return loadGoogleMaps(key);
      })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e: any) => { if (!cancelled) setError(e?.message ?? "Maps no está activo. Escribe la dirección completa para continuar."); });
    return () => { cancelled = true; };
  }, [getKey]);

  const handleManualChange = (text: string) => {
    setManualAddress(text);
    if (!ready && text.trim().length >= 5) {
      onChange({
        direccion_texto: text.trim(),
        latitud: value?.latitud ?? TUXPAN.lat,
        longitud: value?.longitud ?? TUXPAN.lng,
      });
    } else if (!ready) {
      onChange(null);
    }
  };

  // Inicializa autocomplete + mapa cuando la API está lista
  useEffect(() => {
    if (!ready || !inputRef.current || !mapDivRef.current) return;
    const g = (window as any).google;
    const initial = value
      ? { lat: value.latitud, lng: value.longitud }
      : TUXPAN;

    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    const marker = new g.maps.Marker({
      position: initial,
      map,
      draggable: true,
    });
    mapRef.current = map;
    markerRef.current = marker;

    // Al arrastrar el marcador, reverse-geocode para obtener el texto
    const geocoder = new g.maps.Geocoder();
    marker.addListener("dragend", () => {
      const p = marker.getPosition();
      const lat = p.lat();
      const lng = p.lng();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        const txt = status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (inputRef.current) inputRef.current.value = txt;
        onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
      });
    });

    // Autocomplete legacy (soportado universalmente y sin costos raros)
    const ac = new g.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "mx" },
      fields: ["formatted_address", "geometry", "name"],
      bounds: new g.maps.LatLngBounds(
        new g.maps.LatLng(TUXPAN.lat - 0.25, TUXPAN.lng - 0.25),
        new g.maps.LatLng(TUXPAN.lat + 0.25, TUXPAN.lng + 0.25),
      ),
      strictBounds: false,
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const txt = place.formatted_address || place.name || "";
      map.setCenter({ lat, lng });
      map.setZoom(17);
      marker.setPosition({ lat, lng });
      if (inputRef.current) inputRef.current.value = txt;
      onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shocking" />
        <input
          ref={inputRef}
          type="text"
          value={ready ? undefined : manualAddress}
          defaultValue={ready ? (value?.direccion_texto ?? "") : undefined}
          placeholder={placeholder}
          className="w-full rounded-lg border border-mocha/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-shocking"
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleManualChange(e.target.value)}
        />
      </div>
      <div className="relative">
        <div
          ref={mapDivRef}
          className="h-52 w-full overflow-hidden rounded-lg border border-mocha/20 bg-crema"
          aria-label="Mapa de la dirección de entrega"
        />
        {error && !ready && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-mocha/20 bg-crema px-4 text-center text-xs font-semibold text-mocha">
            Escribe la dirección completa en el campo de arriba.
          </div>
        )}
      </div>
      {!ready && !error && (
        <p className="text-[11px] text-mocha">Cargando mapa…</p>
      )}
      {error && (
        <p className="text-[11px] text-shocking">{error}</p>
      )}
      {value && (
        <p className="rounded bg-crema px-2 py-1 text-[11px] text-mocha">
          📍 {value.direccion_texto}
          <span className="ml-2 text-[10px] opacity-70">({value.latitud.toFixed(5)}, {value.longitud.toFixed(5)})</span>
        </p>
      )}
      <p className="text-[10px] text-mocha/70">
        {ready ? "Arrastra el marcador rojo para afinar el punto exacto." : "Con Maps inactivo, confirma la dirección por WhatsApp."}
      </p>
    </div>
  );
}