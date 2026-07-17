import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

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

const TUXPAN = { lat: 20.9569, lng: -97.4083 };

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
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    Promise.resolve(browserKey)
      .then((key) => { if (!key) throw new Error("Maps no está activo."); return loadGoogleMaps(key); })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e: any) => { if (!cancelled) setError("Maps no está activo."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapDivRef.current || !autocompleteContainerRef.current) return;
    const g = (window as any).google;
    const initial = value ? { lat: value.latitud, lng: value.longitud } : TUXPAN;

    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    
    const marker = new g.maps.Marker({ position: initial, map, draggable: true });

    const geocoder = new g.maps.Geocoder();
    marker.addListener("dragend", () => {
      const p = marker.getPosition();
      const lat = p.lat();
      const lng = p.lng();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        const txt = status === "OK" && results?.[0]?.formatted_address ? results[0].formatted_address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onChangeRef.current({ direccion_texto: txt, latitud: lat, longitud: lng });
      });
    });

    // LIMPIEZA Y MONTAJE DEL AUTOCOMPLETE
    autocompleteContainerRef.current.innerHTML = "";
    const ac = document.createElement("gmp-place-autocomplete-element");
    ac.setAttribute("component-restrictions", 'country:mx');
    ac.setAttribute("placeholder", placeholder);
    (ac as any).requestedFields = ["formattedAddress", "geometry"];
    autocompleteContainerRef.current.appendChild(ac);

    ac.addEventListener("gmp-placeselect", (event: any) => {
      const place = event.place;
      if (!place || !place.location) return;
      const lat = place.location.lat();
      const lng = place.location.lng();
      const txt = place.formattedAddress || "";
      map.setCenter({ lat, lng });
      map.setZoom(17);
      marker.setPosition({ lat, lng });
      onChangeRef.current({ direccion_texto: txt, latitud: lat, longitud: lng });
    });
  }, [ready, placeholder]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      
      {/* Contenedor con altura mínima forzada para asegurar visibilidad */}
      <div className="relative w-full min-h-[44px]">
        <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-shocking z-10" />
        <div 
            ref={autocompleteContainerRef} 
            className="w-full h-[44px] overflow-hidden" 
        />
      </div>

      <div className="relative">
        <div ref={mapDivRef} className="h-52 w-full overflow-hidden rounded-lg border border-mocha/20 bg-crema" />
        {error && !ready && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-mocha/20 bg-crema px-4 text-center text-xs font-semibold text-mocha">
            Cargando buscador...
          </div>
        )}
      </div>
      
      {value && (
        <p className="rounded bg-crema px-2 py-1 text-[11px] text-mocha">
          📍 {value.direccion_texto}
        </p>
      )}
    </div>
  );
}