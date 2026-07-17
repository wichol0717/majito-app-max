import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Selector de dirección con Google Places Autocomplete (API Clásica) + mapa arrastrable.
 * Devuelve al padre: texto legible, latitud y longitud (coordenadas GPS).
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

// Loader singleton
let loaderPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  
  loaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=MX&channel=majito_app`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function AddressPicker({ value, onChange, label = "Dirección de entrega *", placeholder = "Busca calle, colonia o referencia" }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref para el buscador clásico
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el onChange para evitar el problema de "estado estancado"
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    const browserKey =
      import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      import.meta.env.VITE_GOOGLE_API_KEY ||
      "";

    Promise.resolve(browserKey)
      .then((key) => {
        if (!key) throw new Error("Maps no está activo.");
        return loadGoogleMaps(key);
      })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e: any) => { if (!cancelled) setError("Maps no está activo."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapDivRef.current || !inputRef.current) return;
    const g = (window as any).google;
    const initial = value ? { lat: value.latitud, lng: value.longitud } : TUXPAN;

    // Mapa
    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    
    // Marcador
    const marker = new g.maps.Marker({
      position: initial,
      map,
      draggable: true,
    });
    mapRef.current = map;
    markerRef.current = marker;

    // Geocodificación para el marcador arrastrable
    const geocoder = new g.maps.Geocoder();
    marker.addListener("dragend", () => {
      const p = marker.getPosition();
      const lat = p.lat();
      const lng = p.lng();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        const txt = status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        onChangeRef.current({ direccion_texto: txt, latitud: lat, longitud: lng });
      });
    });

    // API Clásica: Autocomplete
    const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "mx" },
      fields: ["formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const txt = place.formatted_address || "";
      
      map.setCenter({ lat, lng });
      map.setZoom(17);
      marker.setPosition({ lat, lng });
      
      // Notificar al componente padre
      onChangeRef.current({ direccion_texto: txt, latitud: lat, longitud: lng });
    });
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shocking z-10" />
        <input 
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full rounded-lg border border-mocha/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-shocking"
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
            Escribe la dirección completa.
          </div>
        )}
      </div>
      {!ready && !error && <p className="text-[11px] text-mocha">Cargando mapa…</p>}
      {error && <p className="text-[11px] text-shocking">{error}</p>}
      {value && (
        <p className="rounded bg-crema px-2 py-1 text-[11px] text-mocha">
          📍 {value.direccion_texto}
        </p>
      )}
    </div>
  );
}