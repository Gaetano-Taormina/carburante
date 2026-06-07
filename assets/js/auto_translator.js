const translations = {
    it: {
        "title": "FuelFinder Italy - Prezzi Reali",
        "loader_h2": "Caricamento dei dati ministeriali in corso...",
        "loader_p": "Questa operazione può richiedere qualche secondo...",
        "badge_dati": "Dati Reali Ministeriali",
        "badge_solo": "Solo in Italia 🇮🇹",
        "lbl_location": "CAP / Città",
        "ph_location": "Es. 00100 o Roma (Solo località italiane)",
        "btn_search": "Cerca",
        "title_gps": "Usa GPS",
        "lbl_radius": "Distanza",
        "lbl_fuel": "Carburante",
        "fuel_gasoline": "Benzina",
        "fuel_diesel": "Gasolio",
        "fuel_lpg": "GPL",
        "fuel_methane": "Metano",
        "lbl_service": "Servizio",
        "service_self": "Self Service",
        "service_served": "Servito",
        "service_both": "Entrambi",
        "status_ready": "I dati sono pronti. Cerca, usa il GPS, oppure <strong class=\"text-blue-500\">clicca direttamente sulla mappa</strong>.",
        "rp_title": "Scelta Consigliata",
        "rp_brand": "Marchio:",
        "rp_price": "Prezzo:",
        "rp_dist": "📍 Distanza:",
        "rp_time": "⏱️ Tempo stimato:",
        "btn_close": "Chiudi Pannello",
        "footer_text": "Progetto Didattico - Dati forniti dal <a href=\"https://www.mimit.gov.it/it/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-bold hover:text-blue-500 transition-colors\">MIMIT</a> (Open Data gratis)",
        "table_title": "<span>🏆</span> Classifica Migliori Prezzi",
        "th_pos": "Pos.",
        "th_brand": "Distributore",
        "th_address": "Indirizzo",
        "th_dist": "Distanza",
        "th_price": "Prezzo",
        // Script.js dynamic translations
        "dyn_error_load": "<div class=\"text-red-600 text-xl font-bold\">Errore caricamento dati! Verifica la cartella 'data'.</div>",
        "dyn_not_found": "Località non trovata.",
        "dyn_enter_valid": "Inserisci un CAP o una città valida.",
        "dyn_gps_fetching": "Acquisizione posizione...",
        "dyn_gps_error": "Impossibile ottenere la posizione GPS.",
        "dyn_current_pos": "Posizione Attuale",
        "dyn_map_point": "Punto su mappa",
        "dyn_start_point": "<div class='font-bold text-center p-1 text-slate-800 dark:text-white'>Punto di Partenza</div>",
        "dyn_no_stations": "Nessun distributore trovato nel raggio selezionato.",
        "dyn_found": "Trovati",
        "dyn_stations": "distributori.",
        "dyn_showing": "Mostro in mappa i",
        "dyn_best_fluidity": "più convenienti per fluidità",
        "dyn_best_price": "Miglior prezzo in zona:",
        "dyn_results": "risultati"
    },
    en: {
        "title": "FuelFinder Italy - Real Prices",
        "loader_h2": "Loading ministerial data...",
        "loader_p": "This operation may take a few seconds...",
        "badge_dati": "Real Ministerial Data",
        "badge_solo": "Italy Only 🇮🇹",
        "lbl_location": "ZIP Code / City",
        "ph_location": "E.g. 00100 or Rome (Italian locations only)",
        "btn_search": "Search",
        "title_gps": "Use GPS",
        "lbl_radius": "Distance",
        "lbl_fuel": "Fuel Type",
        "fuel_gasoline": "Gasoline",
        "fuel_diesel": "Diesel",
        "fuel_lpg": "LPG",
        "fuel_methane": "Methane",
        "lbl_service": "Service",
        "service_self": "Self Service",
        "service_served": "Served",
        "service_both": "Both",
        "status_ready": "Data is ready. Search, use GPS, or <strong class=\"text-blue-500\">click directly on the map</strong>.",
        "rp_title": "Recommended Choice",
        "rp_brand": "Brand:",
        "rp_price": "Price:",
        "rp_dist": "📍 Distance:",
        "rp_time": "⏱️ Estimated time:",
        "btn_close": "Close Panel",
        "footer_text": "Educational Project - Data provided by <a href=\"https://www.mimit.gov.it/it/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-bold hover:text-blue-500 transition-colors\">MIMIT</a> (Free Open Data)",
        "table_title": "<span>🏆</span> Best Prices Ranking",
        "th_pos": "Pos.",
        "th_brand": "Gas Station",
        "th_address": "Address",
        "th_dist": "Distance",
        "th_price": "Price",
        // Script.js dynamic translations
        "dyn_error_load": "<div class=\"text-red-600 text-xl font-bold\">Data loading error! Check the 'data' folder.</div>",
        "dyn_not_found": "Location not found.",
        "dyn_enter_valid": "Enter a valid ZIP code or city.",
        "dyn_gps_fetching": "Acquiring location...",
        "dyn_gps_error": "Unable to get GPS location.",
        "dyn_current_pos": "Current Location",
        "dyn_map_point": "Point on map",
        "dyn_start_point": "<div class='font-bold text-center p-1 text-slate-800 dark:text-white'>Starting Point</div>",
        "dyn_no_stations": "No gas stations found in the selected radius.",
        "dyn_found": "Found",
        "dyn_stations": "gas stations.",
        "dyn_showing": "Showing the",
        "dyn_best_fluidity": "most convenient on map for fluidity",
        "dyn_best_price": "Best price in the area:",
        "dyn_results": "results"
    }
};

let currentLang = 'it';
if (navigator.language && !navigator.language.toLowerCase().startsWith('it')) {
    currentLang = 'en';
}

function t(key) {
    return translations[currentLang][key] || key;
}

function applyTranslations() {
    document.title = t("title");
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[currentLang][key]) {
            el.title = translations[currentLang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
