import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Selector de dirección con Google Places Autocomplete (Nueva API) + mapa arrastrable.
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
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!key) throw new Error("Maps no está activo.");
        return loadGoogleMaps(key);
      })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e: any) => { if (!cancelled) setError("Maps no está activo."); });
    return () => { cancelled = true; };
  }, []);

  // --- Sincronización robusta ---
  useEffect(() => {
    if (ready && mapRef.current && markerRef.current && value) {
      const pos = { lat: value.latitud, lng: value.longitud };
      markerRef.current.setPosition(pos);
      mapRef.current.setCenter(pos);
      mapRef.current.setZoom(17);
    }
  }, [value, ready]);

  useEffect(() => {
    // PROTECCIÓN CONTRA BUCLE INFINITO
    if (mapRef.current) return; 

    if (!ready || !mapDivRef.current || !autocompleteContainerRef.current) return;
    
    // Log movido aquí: solo se imprimirá cuando el mapa realmente se cree
    console.log("--- DEBUG: AddressPicker inicializando mapa exitosamente ---");

    const g = (window as any).google;
    const initial = value ? { lat: value.latitud, lng: value.longitud } : TUXPAN;

    // Inicializar Mapa
    const map = new g.maps.Map(mapDivRef.current, {
      center: initial,
      zoom: value ? 16 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Inicializar Marcador
    const marker = new g.maps.Marker({
      position: initial,
      map,
      draggable: true,
    });
    mapRef.current = map;
    markerRef.current = marker;

    const geocoder = new g.maps.Geocoder();

    // 🔴 DEBUG DEL ARRASTRE DEL PIN
    marker.addListener("dragend", () => {
      console.log("📍 [DEBUG] Marcador arrastrado manualmente. Ejecutando Geocoder...");
      const p = marker.getPosition();
      if (!p) return;
      const lat = p.lat();
      const lng = p.lng();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        const txt = status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        console.log("✅ [DEBUG] Geocoder terminó. Enviando al padre:", txt);
        onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
      });
    });

    // Inicializar Buscador
    autocompleteContainerRef.current.innerHTML = "";
    try {
      const ac = new g.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: "mx" },
      });
      
      ac.requestedDataFields = ["formattedAddress", "geometry"];
      autocompleteContainerRef.current.appendChild(ac);

      // 🔴 DEBUG DE ESCRITURA
      ac.addEventListener("input", (e: any) => {
          console.log("⌨️ [DEBUG] Escribiendo en buscador");
      });

      // 🔴 NUEVA LOGICA: Manejador unificado para ambos eventos de selección
      const handlePlaceSelected = async (event: any) => {
        console.log("🚨 [DEBUG] ¡Se detectó intento de selección de lugar!");
        
        // Obtenemos el objeto place tanto si es gmp-placeselect como si es placeselect
        const place = event.place || (event.detail && event.detail.place);
        
        if (!place) {
            console.error("❌ ERROR: El evento no trajo el objeto 'place'");
            return;
        }
        
        try {
          console.log("⏳ Pidiendo datos de ubicación a Google...");
          await place.fetchFields({ fields: ["formattedAddress", "location"] });
          
          if (!place.location) {
            console.error("❌ ERROR: Google no devolvió coordenadas");
            return;
          }
          
          const lat = place.location.lat();
          const lng = place.location.lng();
          const txt = place.formattedAddress || "";
          
          console.log("✅ [DEBUG ÉXITO] Datos extraídos:", { txt, lat, lng });
          
          map.setCenter({ lat, lng });
          map.setZoom(17);
          marker.setPosition({ lat, lng });
          onChange({ direccion_texto: txt, latitud: lat, longitud: lng });
        } catch (fetchError) {
          console.error("❌ ERROR CRÍTICO al hacer fetchFields:", fetchError);
        }
      };

      // 🔴 ESCUCHAMOS AMBOS EVENTOS (gmp-placeselect y el fallback placeselect)
      ac.addEventListener("gmp-placeselect", handlePlaceSelected);
      ac.addEventListener("placeselect", handlePlaceSelected);

    } catch (err) {
      console.error("Error al inicializar buscador:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shocking z-10" />
        <div 
            ref={autocompleteContainerRef} 
            className="w-full [&>gmp-place-autocomplete-input]:w-full [&>gmp-place-autocomplete-input]:rounded-lg [&>gmp-place-autocomplete-input]:border [&>gmp-place-autocomplete-input]:border-mocha/20 [&>gmp-place-autocomplete-input]:py-2 [&>gmp-place-autocomplete-input]:pl-9 [&>gmp-place-autocomplete-input]:pr-3 [&>gmp-place-autocomplete-input]:text-sm [&>gmp-place-autocomplete-input]:outline-none focus-within:[&>gmp-place-autocomplete-input]:border-shocking"
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