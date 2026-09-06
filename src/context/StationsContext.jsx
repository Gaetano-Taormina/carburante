import { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { registerWebMcpTools } from '../services/webMcpService';

const StationsContext = createContext();

// Mapping for URL translation
const fuelToEn = { 'Benzina': 'Petrol', 'Gasolio': 'Diesel', 'GPL': 'LPG', 'Metano': 'CNG' };
const enToFuel = { 'petrol': 'Benzina', 'diesel': 'Gasolio', 'lpg': 'GPL', 'cng': 'Metano', 'benzina': 'Benzina', 'gasolio': 'Gasolio', 'gpl': 'GPL', 'metano': 'Metano' };

// oxlint-disable-next-line react/only-export-components
export const useStations = () => useContext(StationsContext);

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export const StationsProvider = ({ children }) => {
  const [searchParams] = useSearchParams();
  const { fuel, city } = useParams();
  const navigate = useNavigate();



  // Fallback to query params just in case old links are used
  const rawFuel = fuel || searchParams.get('fuel') || searchParams.get('carburante');
  let initialFuel = 'Benzina';
  if (rawFuel) {
      initialFuel = enToFuel[rawFuel.toLowerCase()] || (rawFuel.charAt(0).toUpperCase() + rawFuel.slice(1));
  }

  // Filters State
  const [locationStr, setLocationStr] = useState('');
  const [radius, setRadius] = useState(5);
  const [fuelType, setFuelTypeInternal] = useState(initialFuel);
  const [serviceType, setServiceType] = useState('1'); // '1' = self, '0' = served, 'entrambi' = both

  // Sync state if URL changes (e.g. back button)
  if (initialFuel !== fuelType) {
    setFuelTypeInternal(initialFuel);
  }

  const setFuelType = useCallback((type) => {
    setFuelTypeInternal(type);
    
    // Check current language from pathname
    const isEn = window.location.pathname.startsWith('/en');
    const urlFuel = isEn ? (fuelToEn[type] || type) : type;
    const currentLang = isEn ? 'en' : 'it';
    
    // Reconstruct the path with the new fuel
    let newPath = `/${currentLang}`;
    if (city) {
       newPath += `/${isEn ? 'city' : 'citta'}/${city}`;
    }
    
    // Clean old query params if any
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('carburante');
    newParams.delete('fuel');
    
    // the new route structure includes fuel at the end
    navigate(`${newPath}/${urlFuel.toLowerCase()}?${newParams.toString()}`, { replace: true });
  }, [navigate, searchParams, city]);

  // Map and user location state
  const [userPos, setUserPos] = useState(null); // { lat, lng }
  
  // Selected Station State
  const [selectedStation, setSelectedStationInternal] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const setSelectedStation = useCallback((station) => {
    setSelectedStationInternal(station);
    if (!station) setRouteData(null);
  }, []);

  // SWR Fetch for Stations (Caching & Optimistic UI)
  const stationsUrl = userPos 
    ? `/api/stations?lat=${userPos.lat}&lng=${userPos.lng}&radius=${radius}&fuelType=${encodeURIComponent(fuelType)}&serviceType=${serviceType}` 
    : null;

  const { data: stationsData, error, isLoading, isValidating } = useSWR(stationsUrl, fetcher, {
    keepPreviousData: true, // Optimistic UI
    revalidateOnFocus: false,
    dedupingInterval: 10000
  });

  const stations = useMemo(() => stationsData?.stations || (Array.isArray(stationsData) ? stationsData : []), [stationsData]);
  const totalStations = stationsData?.totalCount || stations.length || 0;
  
  // Utilizza isValidating per skeleton non distruttivo in background
  const loading = isLoading;
  const isFetchingBackground = isValidating && !isLoading;

  // Fetch route when a station is selected
  useEffect(() => {
    if (!selectedStation || !userPos) {
        // oxlint-disable-next-line react/set-state-in-effect
        setRouteData(null);
        return;
    }

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${selectedStation.lng},${selectedStation.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          setRouteData({
            geometry: data.routes[0].geometry,
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
          });
        }
      } catch (err) {
        // oxlint-disable-next-line no-console
        console.error('OSRM Fetch Error:', err);
      }
    };
    fetchRoute();
  }, [selectedStation, userPos]);

  const handleNavigation = useCallback((station) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const stationName = encodeURIComponent(station.brand || station.name || 'Distributore');

    if (isAndroid) {
      // Trigger native Android App Chooser (Google Maps, Waze, etc.)
      window.location.href = `geo:${station.lat},${station.lng}?q=${station.lat},${station.lng}(${stationName})`;
    } else if (isIOS) {
      // Trigger native Apple Maps navigation on iOS with start (saddr) and destination (daddr)
      const saddr = userPos ? `&saddr=${userPos.lat},${userPos.lng}` : '';
      window.location.href = `maps://?daddr=${station.lat},${station.lng}${saddr}&q=${stationName}`;
    } else {
      // Desktop / Web: open Google Maps Directions from origin to destination
      const originParam = userPos ? `&origin=${userPos.lat},${userPos.lng}` : '';
      window.open(`https://www.google.com/maps/dir/?api=1${originParam}&destination=${station.lat},${station.lng}`, '_blank');
    }
  }, [userPos]);

  // Registrazione strumenti WebMCP per agenti AI nativi (Chrome 146+)
  useEffect(() => {
    registerWebMcpTools({
      onSearchLocation: async (loc) => {
        setLocationStr(loc);
        return { location: loc };
      },
      onSetFuel: (f) => setFuelType(f),
      onSetRadius: (r) => setRadius(r),
      onSetService: (s) => setServiceType(s),
      onNavigateStation: (st) => handleNavigation(st)
    });
  }, [setFuelType, handleNavigation, setRadius, setServiceType, setLocationStr]);

  const contextValue = useMemo(() => ({
      stations, totalStations,
      loading, isFetchingBackground, error,
      locationStr, setLocationStr,
      radius, setRadius,
      fuelType, setFuelType,
      serviceType, setServiceType,
      userPos, setUserPos,
      selectedStation, setSelectedStation,
      routeData,
      handleNavigation
  }), [
      stations, totalStations, loading, isFetchingBackground, error,
      locationStr, radius, fuelType, serviceType, userPos, selectedStation, routeData,
      setFuelType, handleNavigation, setSelectedStation
  ]);

  return (
    <StationsContext.Provider value={contextValue}>
      {children}
    </StationsContext.Provider>
  );
};
