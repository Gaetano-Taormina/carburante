/* === THEME MANAGEMENT (LIGHT / DARK / SYSTEM) === */
const themeBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
let currentTheme = localStorage.getItem('theme') || 'light';

// We use ONE high-contrast map (OpenStreetMap). 
// Dark theme is handled perfectly by CSS inverting colors.
const map = L.map('map', { 
    zoomControl: false,
    maxBounds: [[33.0, -5.0], [52.0, 25.0]],
    maxBoundsViscosity: 0.8,
    minZoom: 5
}).setView([41.9028, 12.4964], 6);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19, 
    attribution: '&copy; OpenStreetMap contributors' 
}).addTo(map);

const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.innerText = '🌙';
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.innerText = '☀️';
    }
};

themeBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
});

applyTheme(currentTheme);


/* === DATA LOGIC AND MAP === */
let markersLayer = L.layerGroup().addTo(map);
let routeLayer = null;
let REAL_STATIONS = [];

const loadMinisteroData = async () => {
    document.getElementById('loader').classList.remove('hidden');
    try {
        const response = await fetch('assets/data/dati.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        REAL_STATIONS = data;

        document.getElementById('loader').classList.add('hidden');
    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerHTML = t('dyn_error_load');
    }
};

/* === CAPITALS MARKERS (ROME, VATICAN, SAN MARINO AND BORDERING COUNTRIES) === */
const addCapitalMarkers = () => {
    const capitals = [
        { name: 'Italy', capital: 'Rome', lat: 41.9028, lng: 12.4964, icon: '🏛️', flag: '🇮🇹', code: 'it', rotation: '12deg', isMirrored: false },
        { name: 'San Marino', capital: 'San Marino', lat: 43.9424, lng: 12.4578, icon: '🏰', flag: '🇸🇲', code: 'sm', rotation: '8deg', isMirrored: false },
        { name: 'Vatican City', capital: 'Vatican', lat: 41.9022, lng: 12.4533, icon: '⛪', flag: '🇻🇦', code: 'va', rotation: '-15deg', isMirrored: true, isSticker: false },
        { name: 'France', capital: 'Paris', lat: 48.8566, lng: 2.3522, icon: '🗼', flag: '🇫🇷', code: 'fr', rotation: '-5deg', isMirrored: false },
        { name: 'Switzerland', capital: 'Bern', lat: 46.9480, lng: 7.4474, icon: '🏔️', flag: '🇨🇭', code: 'ch', rotation: '5deg', isMirrored: false },
        { name: 'Austria', capital: 'Vienna', lat: 48.2082, lng: 16.3738, icon: '🎻', flag: '🇦🇹', code: 'at', rotation: '10deg', isMirrored: false },
        { name: 'Slovenia', capital: 'Ljubljana', lat: 46.0569, lng: 14.5058, icon: '🐉', flag: '🇸🇮', code: 'si', rotation: '-8deg', isMirrored: false }
    ];

    const capitalIcon = (code, rotation, isMirrored = false, isSticker = false) => {
        if (isSticker) {
            return L.divIcon({
                className: 'custom-capital-container',
                html: `
                    <div class="hover:scale-110 transition-transform duration-300 z-50 flex flex-col items-center justify-end" 
                         style="width: 40px; height: 60px; filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.5));">
                        <svg viewBox="0 0 24 24" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;">
                            <path d="M4 22h16v-8l-8-5-8 5v8z" />
                            <path d="M10 22v-5a2 2 0 0 1 4 0v5" fill="#78350f" />
                            <path d="M8 9l4-3 4 3V4h-8z" />
                            <circle cx="12" cy="6.5" r="1.5" fill="#78350f" />
                            <path d="M12 1v3" />
                            <path d="M10.5 2.5h3" />
                        </svg>
                        <div style="width: 6px; height: 6px; background: #78350f; border-radius: 50%; margin-top: -3px; z-index: 10;"></div>
                    </div>
                `,
                iconSize: [40, 60],
                iconAnchor: [20, 60]
            });
        }

        const anchorX = isMirrored ? 46 : 2;
        const typeClass = isMirrored ? 'mirrored' : 'normal';
        const waveClass = isMirrored ? 'animate-wave-mirrored' : 'animate-wave';

        return L.divIcon({
            className: 'custom-capital-container',
            html: `
                <div class="hover:scale-110 transition-transform duration-300 group z-50 flag-marker-wrapper">
                    <div class="flag-wrapper flag-${code}">
                        <div class="flag-pole ${typeClass} bg-slate-700 dark:bg-slate-400 shadow-md border border-slate-800 dark:border-slate-300 group-hover:bg-blue-600 transition-colors"></div>
                        <div class="flag-finial ${typeClass}"></div>
                        <div class="flag-fabric ${typeClass} ${waveClass} shadow-lg border-y ${isMirrored ? 'border-l' : 'border-r'} border-slate-200/50 dark:border-slate-600/50">
                            <img src="assets/img/${code}.png?v=5" class="flag-image ${typeClass}" alt="Bandiera">
                        </div>
                    </div>
                </div>
            `,
            iconSize: [48, 56],
            iconAnchor: [anchorX, 56]
        });
    };

    capitals.forEach(cap => {
        L.marker([cap.lat, cap.lng], { icon: capitalIcon(cap.code, cap.rotation, cap.isMirrored, cap.isSticker), zIndexOffset: 1000 })
            .bindPopup(`
                <div class="text-center p-3 min-w-[140px] relative overflow-hidden rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="absolute inset-0 bg-cover bg-center opacity-70 dark:opacity-60 popup-bg-blur popup-bg-${cap.code}"></div>
                    <div class="absolute inset-0 bg-white/40 dark:bg-slate-900/40"></div>
                    <div class="relative z-10 flex flex-col items-center">
                        <div class="text-4xl mb-1 drop-shadow-md">${cap.flag}</div>
                        <h4 class="font-black text-xl text-slate-900 dark:text-white drop-shadow-sm tracking-wide uppercase">${cap.name}</h4>
                        <div class="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/60 dark:border-slate-600/60">
                            Capital: <span class="text-blue-700 dark:text-blue-400 font-bold">${cap.capital}</span>
                        </div>
                    </div>
                </div>
            `, {
                closeButton: false,
                className: 'custom-popup-bg'
            })
            .addTo(map);
    });
};

const isPWA = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

const saveUserPreferences = () => {
    if (!isPWA()) return;
    localStorage.setItem('userFuel', document.getElementById('fuelTypeInput').value);
    localStorage.setItem('userRadius', document.getElementById('radiusInput').value);
    localStorage.setItem('userService', document.getElementById('serviceTypeInput').value);
};

const loadUserPreferences = () => {
    if (!isPWA()) return;
    const fuel = localStorage.getItem('userFuel');
    const radius = localStorage.getItem('userRadius');
    const service = localStorage.getItem('userService');
    
    if (fuel) document.getElementById('fuelTypeInput').value = fuel;
    if (radius) document.getElementById('radiusInput').value = radius;
    if (service) document.getElementById('serviceTypeInput').value = service;
};

const saveUserLocation = (lat, lng, query) => {
    if (!isPWA()) return;
    localStorage.setItem('userLat', lat);
    localStorage.setItem('userLng', lng);
    localStorage.setItem('userQuery', query);
    saveUserPreferences();
};

const loadUserLocation = () => {
    loadUserPreferences(); // Carichiamo i filtri prima di lanciare la ricerca
    if (!isPWA()) return;
    const lat = localStorage.getItem('userLat');
    const lng = localStorage.getItem('userLng');
    const query = localStorage.getItem('userQuery');
    
    if (lat && lng) {
        if (query) document.getElementById('locationInput').value = query;
        performSearch(parseFloat(lat), parseFloat(lng), false);
    }
};

window.addEventListener('load', () => {
    loadMinisteroData().then(() => {
        addCapitalMarkers();
        loadUserLocation(); // Mostra subito l'ultima zona dell'utente
    });
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const geocodeLocation = async (query) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Italy&format=json&limit=1`, {
        headers: { 'Accept-Language': 'it-IT' } 
    });
    const data = await res.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    throw new Error(t('dyn_not_found'));
};

const drawRouteAndShowPanel = async (userLat, userLng, bestStation) => {
    try {
        if (routeLayer) map.removeLayer(routeLayer);

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${bestStation.lng},${bestStation.lat}?overview=full&geometries=geojson`;
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            routeLayer = L.geoJSON(route.geometry, {
                style: { color: '#3b82f6', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }
            }).addTo(map);

            document.getElementById('rp-brand').innerText = bestStation.brand;
            document.getElementById('rp-price').innerText = `€ ${bestStation.displayedPrice.toFixed(3)}`;
            document.getElementById('rp-distance').innerText = (route.distance / 1000).toFixed(1) + " km";
            document.getElementById('rp-time').innerText = Math.round(route.duration / 60) + " min";
            document.getElementById('routePanel').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Errore rotta:", error);
    }
};

const performSearch = (lat, lng, isRouteEnabled = false) => {
    const radiusDropdownValue = parseFloat(document.getElementById('radiusInput').value);
    const fuelType = document.getElementById('fuelTypeInput').value;
    const serviceValue = document.getElementById('serviceTypeInput').value;

    markersLayer.clearLayers();
    if (routeLayer) map.removeLayer(routeLayer);
    document.getElementById('routePanel').classList.add('hidden');

    const canvasRenderer = L.canvas({ padding: 0.5 });

    L.circleMarker([lat, lng], { radius: 10, color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 1, weight: 4, renderer: canvasRenderer })
        .bindPopup("myPosition").addTo(markersLayer);

    const radiusInKm = radiusDropdownValue + 2;
    const latMargin = radiusInKm / 111.0;
    const lngMargin = radiusInKm / 80.0;
    const minLat = lat - latMargin;
    const maxLat = lat + latMargin;
    const minLng = lng - lngMargin;
    const maxLng = lng + lngMargin;

    let filtered = [];
    REAL_STATIONS.forEach(s => {
        if (s.lat < minLat || s.lat > maxLat || s.lng < minLng || s.lng > maxLng) return;

        const distance = calculateDistance(lat, lng, s.lat, s.lng);
        if (distance > radiusDropdownValue) return;

        let availablePrices = [];
        if ((serviceValue === "1" || serviceValue === "entrambi") && s.prices.self && s.prices.self[fuelType] !== undefined) {
            availablePrices.push({ type: 'self', price: s.prices.self[fuelType] });
        }
        if ((serviceValue === "0" || serviceValue === "entrambi") && s.prices.servito && s.prices.servito[fuelType] !== undefined) {
            availablePrices.push({ type: 'servito', price: s.prices.servito[fuelType] });
        }

        if (availablePrices.length > 0) {
            availablePrices.sort((a, b) => a.price - b.price);
            filtered.push({
                ...s, distance: distance,
                displayedPrice: availablePrices[0].price,
                displayedType: availablePrices[0].type,
                convenienceScore: availablePrices[0].price + (distance * 0.015)
            });
        }
    });

    const tableContainer = document.getElementById('tableContainer');
    
    if (filtered.length === 0) {
        document.getElementById('statusText').innerText = t('dyn_no_stations');
        tableContainer.classList.add('hidden');
        return;
    }

    const totalFound = filtered.length;
    
    const MAX_MARKERS = 80;
    if (filtered.length > MAX_MARKERS) {
        filtered.sort((a, b) => a.convenienceScore - b.convenienceScore);
        filtered = filtered.slice(0, MAX_MARKERS);
    }

    const minPrice = Math.min(...filtered.map(s => s.displayedPrice));
    const maxPrice = Math.max(...filtered.map(s => s.displayedPrice));

    let bestStation = null;
    let bestScore = Infinity;

    filtered.forEach(s => {
        if (s.convenienceScore < bestScore) {
            bestScore = s.convenienceScore;
            bestStation = s;
        }
    });

    const bounds = [];

    filtered.forEach(s => {
        const isBestValue = (bestStation && s.id === bestStation.id);
        let colorClass = 'marker-average'; let colorHex = '#3b82f6';

        if (s.displayedPrice === minPrice) { colorClass = 'marker-cheap'; colorHex = '#10b981'; }
        else if (s.displayedPrice === maxPrice && filtered.length > 2) { colorClass = 'marker-expensive'; colorHex = '#ef4444'; }

        let htmlMarker = isBestValue
            ? `<div class="price-marker marker-best">👑 € ${s.displayedPrice.toFixed(3)}</div>`
            : `<div class="price-marker ${colorClass}" style="border-color: ${colorHex};">€ ${s.displayedPrice.toFixed(3)}</div>`;

        const customIcon = L.divIcon({
            className: 'custom-div-icon', html: htmlMarker,
            iconSize: [isBestValue ? 90 : 70, isBestValue ? 40 : 30],
            iconAnchor: [isBestValue ? 45 : 35, isBestValue ? 45 : 35], popupAnchor: [0, -35]
        });

        let prezziHtml = '';
        if (s.prices.self && Object.keys(s.prices.self).length > 0) {
            prezziHtml += `<div class="font-bold mt-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">Self Service:</div>`;
            for (const [carb, p] of Object.entries(s.prices.self)) {
                prezziHtml += `<div class="flex justify-between text-sm px-2 py-1"><span>${carb}:</span> <span>€ ${p.toFixed(3)}</span></div>`;
            }
        }
        if (s.prices.servito && Object.keys(s.prices.servito).length > 0) {
            prezziHtml += `<div class="font-bold mt-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">Servito:</div>`;
            for (const [carb, p] of Object.entries(s.prices.servito)) {
                prezziHtml += `<div class="flex justify-between text-sm px-2 py-1"><span>${carb}:</span> <span>€ ${p.toFixed(3)}</span></div>`;
            }
        }
        bounds.push([s.lat, s.lng]);
    });

    if (!bestStation || !isRouteEnabled) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    
    let statusMsg = `${t('dyn_found')} <span class="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">${totalFound}</span> ${t('dyn_stations')}`;
    if (totalFound > MAX_MARKERS) statusMsg += ` <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full ml-1">${t('dyn_showing')} ${MAX_MARKERS} ${t('dyn_best_fluidity')}</span>`;
    statusMsg += ` ${t('dyn_best_price')} <span class="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">€ ${minPrice.toFixed(3)}</span>`;
    
    document.getElementById('statusText').innerHTML = statusMsg;

    if (isRouteEnabled && bestStation) drawRouteAndShowPanel(lat, lng, bestStation);

    const tableBody = document.getElementById('tableBody');
    tableContainer.classList.remove('hidden');
    document.getElementById('tableCount').innerText = `${filtered.length} ${t('dyn_results')}`;
    tableBody.innerHTML = '';

    const sortedStations = [...filtered].sort((a, b) => a.displayedPrice - b.displayedPrice);

    sortedStations.forEach((s, index) => {
        const isFirst = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;
        
        let rowClass = 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer';
        if (isFirst) rowClass += ' bg-amber-50 dark:bg-amber-900/20';

        let medal = `${index + 1}°`;
        if (isFirst) medal = '🥇';
        if (isSecond) medal = '🥈';
        if (isThird) medal = '🥉';

        const priceClass = isFirst ? 'text-amber-600 dark:text-amber-500 font-extrabold text-lg' : 'font-bold';

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
            <td class="p-2 sm:p-4 text-center text-base sm:text-lg font-bold text-slate-500">${medal}</td>
            <td class="p-2 sm:p-4">
                <div class="font-bold text-sm sm:text-base text-slate-800 dark:text-white">${s.brand}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${s.name} <span class="sm:hidden font-medium text-blue-500 ml-1">(${s.distance.toFixed(1)}km)</span></div>
            </td>
            <td class="p-2 sm:p-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">${s.address}</td>
            <td class="p-2 sm:p-4 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hidden sm:table-cell">${s.distance.toFixed(1)} km</td>
            <td class="p-2 sm:p-4 text-right ${priceClass} text-sm sm:text-base">€ ${s.displayedPrice.toFixed(3)}</td>
        `;

        tr.addEventListener('click', () => {
            map.setView([s.lat, s.lng], 16);
            window.scrollTo({ top: document.getElementById('map').offsetTop - 20, behavior: 'smooth' });
        });

        tableBody.appendChild(tr);
    });
};

/* === USER EVENTS === */
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('locationInput').value.trim();
    if (!query) return alert(t('dyn_enter_valid'));
    
    // Se l'utente clicca "Cerca" ma c'è scritto "Posizione Attuale" o "Punto Mappa",
    // usiamo le coordinate già salvate invece di cercare il testo su internet.
    if (query === t('dyn_current_pos') || query === t('dyn_map_point')) {
        const savedLat = localStorage.getItem('userLat');
        const savedLng = localStorage.getItem('userLng');
        if (savedLat && savedLng) {
            performSearch(parseFloat(savedLat), parseFloat(savedLng), true);
            return;
        }
    }

    try {
        const coords = await geocodeLocation(query);
        saveUserLocation(coords.lat, coords.lng, query);
        performSearch(coords.lat, coords.lng, true);
    } catch (err) {
        document.getElementById('statusText').innerText = t('dyn_not_found');
    }
});

document.getElementById('gpsBtn').addEventListener('click', () => {
    document.getElementById('statusText').innerText = t('dyn_gps_fetching');
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const text = t('dyn_current_pos');
            document.getElementById('locationInput').value = text;
            saveUserLocation(lat, lng, text);
            performSearch(lat, lng, true);
        },
        () => alert(t('dyn_gps_error'))
    );
});

map.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const text = t('dyn_map_point');
    document.getElementById('locationInput').value = text;
    saveUserLocation(lat, lng, text);
    performSearch(lat, lng, true);
});

['fuelTypeInput', 'radiusInput', 'serviceTypeInput'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        saveUserPreferences(); // Salviamo la nuova scelta
        
        const savedLat = localStorage.getItem('userLat');
        const savedLng = localStorage.getItem('userLng');
        
        // Se l'utente aveva già una posizione attiva (mappa, gps o città), aggiorniamo istantaneamente i risultati
        if (savedLat && savedLng) {
            performSearch(parseFloat(savedLat), parseFloat(savedLng), true);
        } else {
            // Fallback: se non c'è posizione salvata ma ha scritto qualcosa, simuliamo un click su Cerca
            const loc = document.getElementById('locationInput').value;
            if (loc.trim().length > 0) document.getElementById('searchBtn').click();
        }
    });
});


