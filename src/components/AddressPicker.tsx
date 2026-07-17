import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * AddressPicker Component
 * Versión completa y robusta con manejo profundo de Google Maps API,
 * Geocodificación y la nueva API de Autocomplete.
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

// Configuración inicial de coordenadas: Tuxpan, Veracruz
const TUXPAN = { lat: 20.9569, lng: -97.4083 };

/**
 * Cargador de librerías de Google Maps (Singleton pattern)
 * Asegura que el script solo se cargue una vez para evitar errores de duplicación.
 */
let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.importLibrary) return ensureMapsLibraries();
  if (loaderPromise) return loaderPromise;
  
  loaderPromise = new Promise((resolve, reject) => {
    // Definimos el callback global que espera Google
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

/**
 * Función para cargar las librerías específicas necesarias
 * (Maps, Places, Geocoding)
 */
async function ensureMapsLibraries() {
  const g = (window as any).google;
  if (!g || !g.maps) throw new Error("Google Maps no inicializado correctamente");
  
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
  
  // Referencias para el DOM
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  
  // Referencias para las instancias de la API
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Estados de control
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mantenemos la referencia de onChange actualizada para evitar cierres (closures)
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * Ciclo de vida: Carga inicial de la API
   */
  useEffect(() => {
    let cancelled = false;
    const browserKey =
      import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      "";

    Promise.resolve(browserKey)
      .then((key) => {
        if (!key) throw new Error("Maps no está activo. Verifica API Key.");
        return loadGoogleMaps(key);
      })
      .then(() => { 
        if (!cancelled) setReady(true); 
      })
      .catch((e: any) => { 
        console.error("Error cargando Google Maps:", e);
        if (!cancelled) setError("Error al cargar Google Maps."); 
      });
      
    return () => { cancelled = true; };
  }, []);

  /**
   * Ciclo de vida: Inicialización del Mapa, Marcador y Autocomplete
   */
  useEffect(() => {
    if (!ready || !mapDivRef.current || !autocompleteContainerRef.current) return;
    
    const g = (window as any).google;
    const initial = value ? { lat: value.latitud, lng: value.longitud } : TUXPAN;

    // 1. Inicializar el mapa
    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeId: g.maps.MapTypeId.ROADMAP,
    });
    
    // 2. Inicializar el marcador arrastrable
    const marker = new g.maps.Marker({
      position: initial,
      map,
      draggable: true,
      animation: g.maps.Animation.DROP,
    });
    
    mapRef.current = map;
    markerRef.current = marker;

    // 3. Geocodificación inversa al soltar el marcador
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

    // 4. Configurar el Autocomplete Element (Nueva API)
    autocompleteContainerRef.current.innerHTML = "";
    const ac = document.createElement("gmp-place-autocomplete-element");
    
    // Configuración estricta de restricciones
    ac.setAttribute("component-restrictions", 'country:mx');
    ac.setAttribute("placeholder", placeholder);
    
    // Definir campos requeridos
    (ac as any).requestedFields = ["formattedAddress", "geometry"];
    
    autocompleteContainerRef.current.appendChild(ac);

    // Listener del componente
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
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      
      {/* Contenedor del buscador: Usamos los selectores Tailwind que funcionaban originalmente */}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shocking z-10" />
        <div 
            ref={autocompleteContainerRef} 
            className="w-full [&>gmp-place-autocomplete-input]:w-full [&>gmp-place-autocomplete-input]:rounded-lg [&>gmp-place-autocomplete-input]:border [&>gmp-place-autocomplete-input]:border-mocha/20 [&>gmp-place-autocomplete-input]:py-2 [&>gmp-place-autocomplete-input]:pl-9 [&>gmp-place-autocomplete-input]:pr-3 [&>gmp-place-autocomplete-input]:text-sm [&>gmp-place-autocomplete-input]:outline-none focus-within:[&>gmp-place-autocomplete-input]:border-shocking [&>gmp-place-autocomplete-input]:bg-white"
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