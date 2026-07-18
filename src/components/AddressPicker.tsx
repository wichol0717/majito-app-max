import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

/**
 * AddressPicker.tsx
 * Selector de dirección con Google Places Autocomplete (Nueva API) + mapa arrastrable.
 * Devuelve al padre: texto legible, latitud y longitud (coordenadas GPS).
 * Versión completa y expandida.
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

// Tuxpan, Veracruz - Coordenadas base
const TUXPAN = { lat: 20.9569, lng: -97.4083 };

// Loader singleton para evitar múltiples cargas de script
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
  if (!g || !g.maps) return;
  
  await Promise.all([
    g.maps.importLibrary("maps"),
    g.maps.importLibrary("places"),
    g.maps.importLibrary("geocoding"),
  ]);
}

export function AddressPicker({ 
  value, 
  onChange, 
  label = "Dirección de entrega *", 
  placeholder = "Busca calle, colonia o referencia" 
}: Props) {
  
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validación auxiliar para asegurar que no enviamos coordenadas cero
  const isValidCoordinate = (lat: number, lng: number) => lat !== 0 && lng !== 0;

  // 1. Efecto: Carga inicial del script de Google Maps
  useEffect(() => {
    let cancelled = false;
    const browserKey =
      import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      import.meta.env.VITE_GOOGLE_API_KEY ||
      import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
      "";

    Promise.resolve(browserKey)
      .then((key) => {
        if (!key) throw new Error("Maps no está activo: Falta la API Key.");
        return loadGoogleMaps(key);
      })
      .then(() => { 
        if (!cancelled) setReady(true); 
      })
      .catch((e: any) => { 
        console.error("Error al cargar la API de Maps:", e);
        if (!cancelled) setError("Error al cargar Google Maps."); 
      });
      
    return () => { cancelled = true; };
  }, []);

  // 2. Efecto: Sincronización cuando cambia el valor desde afuera
  useEffect(() => {
    if (ready && mapRef.current && markerRef.current && value) {
      const pos = { lat: value.latitud, lng: value.longitud };
      markerRef.current.setPosition(pos);
      mapRef.current.setCenter(pos);
      mapRef.current.setZoom(17);
    }
  }, [value, ready]);

  // 3. Efecto: Inicialización completa del Mapa y del Autocomplete
  useEffect(() => {
    // Protección para evitar inicializaciones duplicadas
    if (mapRef.current) return; 
    if (!ready || !mapDivRef.current || !autocompleteContainerRef.current) return;
    
    console.log("--- DEBUG: AddressPicker inicializando mapa exitosamente ---");

    const g = (window as any).google;
    const initial = (value && isValidCoordinate(value.latitud, value.longitud)) ? { lat: value.latitud, lng: value.longitud } : TUXPAN;

    // Crear mapa
    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Crear marcador arrastrable
    const marker = new g.maps.Marker({
      position: initial,
      map,
      draggable: true,
    });
    
    mapRef.current = map;
    markerRef.current = marker;

    const geocoder = new g.maps.Geocoder();

    // Evento al arrastrar marcador
    marker.addListener("dragend", () => {
      console.log("📍 [DEBUG] Marcador arrastrado manualmente...");
      const p = marker.getPosition();
      if (!p) return;
      const lat = p.lat();
      const lng = p.lng();
      
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        const txt = status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        console.log("🚀 [DRAGEND] Disparando onChange con:", { txt, lat, lng });
        onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
      });
    });

    // Inicializar componente Autocomplete
    setTimeout(() => {
      autocompleteContainerRef.current!.innerHTML = "";
      try {
        const ac = new g.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: "mx" },
        });
        
        ac.requestedDataFields = ["formattedAddress", "geometry"];
        autocompleteContainerRef.current!.appendChild(ac);

        // DEBUG: Asignar a ventana para consola para inspección
        (window as any).ac = ac; 
        console.log("DEBUG: Elemento AC creado y asignado a window.ac");

        // Lógica de procesamiento de lugar seleccionado
        const processPlace = async (place: any) => {
          if (!place) return;
          console.log("⏳ Procesando lugar seleccionado:", place);
          
          try {
            // Aseguramos que tenemos los datos de la API
            if (place.fetchFields) {
                await place.fetchFields({ fields: ["formattedAddress", "location"] });
            }
            
            if (!place.location) return;
            
            const lat = place.location.lat();
            const lng = place.location.lng();
            const txt = place.formattedAddress || "";
            
            console.log("🚀 [AUTOC] DISPARANDO onChange con:", { txt, lat, lng });
            map.setCenter({ lat, lng });
            map.setZoom(17);
            marker.setPosition({ lat, lng });
            onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
          } catch (e) {
            console.error("❌ Error al procesar lugar:", e);
          }
        };

        // Escuchar eventos oficiales de la nueva API
        ac.addEventListener("gmp-placeselect", (e: any) => {
          console.log("✅ Evento gmp-placeselect detectado");
          processPlace(e.place || ac.value);
        });

        ac.addEventListener("change", () => {
          console.log("🚨 Evento 'change' detectado en AC");
          if (ac.value) processPlace(ac.value);
        });

      } catch (err) {
        console.error("Error al inicializar buscador:", err);
      }
    }, 500);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  
  // Renderizado
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      
      {/* Contenedor del buscador */}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shocking z-10" />
        <div 
            ref={autocompleteContainerRef} 
            className="w-full [&>gmp-place-autocomplete-input]:w-full [&>gmp-place-autocomplete-input]:rounded-lg [&>gmp-place-autocomplete-input]:border [&>gmp-place-autocomplete-input]:border-mocha/20 [&>gmp-place-autocomplete-input]:py-2 [&>gmp-place-autocomplete-input]:pl-9 [&>gmp-place-autocomplete-input]:pr-3 [&>gmp-place-autocomplete-input]:text-sm [&>gmp-place-autocomplete-input]:outline-none focus-within:[&>gmp-place-autocomplete-input]:border-shocking"
        />
      </div>

      {/* Contenedor del mapa */}
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
      
      {/* Indicadores de carga */}
      {!ready && !error && <p className="text-[11px] text-mocha">Cargando mapa…</p>}
      {error && <p className="text-[11px] text-shocking">{error}</p>}
      
      {/* Visualización de la dirección seleccionada */}
      {value && isValidCoordinate(value.latitud, value.longitud) && (
        <p className="flex items-center gap-1 rounded bg-crema px-2 py-1 text-[11px] text-mocha">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {value.direccion_texto}
        </p>
      )}
    </div>
  );
}

/**
 * BOTÓN DE CHECKOUT
 */
export function CheckoutButton({ disabled, onClick, loading }: { disabled: boolean; onClick: () => void; loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
        disabled 
          ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50" 
          : "bg-shocking text-white shadow-lg shadow-shocking/20 hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      {loading ? "Procesando..." : "Confirmar Pedido"}
    </button>
  );
}