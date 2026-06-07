# FuelFinder Italy ⛽

![FuelFinder Logo](assets/img/icon-192.png)
*Read this in [Italiano](#italiano-)*

**FuelFinder Italy** is a high-performance, installable Progressive Web Application (PWA) designed for searching, visualizing, and analyzing fuel stations across Italy. Leveraging official Open Data from the Italian Ministry, it guarantees real-time information with a modern UI and a fluid user experience across all devices.

---

## 🚀 Key Features & Technical Highlights

- **Progressive Web App (PWA):** Fully installable on iOS, Android, Windows, and Mac. Functions like a native app with offline caching via Service Workers and a dedicated app icon. It features an advanced dual-icon system to support native Android Adaptive Icons (maskable) alongside standard transparent squircle icons.
- **Default Dark Mode & Glassmorphism:** Ultra-modern UI based on the *Glassmorphism* paradigm. The application features a stunning Dark Mode as the default experience, with a manual toggle for Light Mode. Responsive tables and fluid layouts adapt perfectly from large desktop monitors down to the narrowest mobile screens.
- **Persistent Local Preferences:** Automatically saves and remembers the user's last geographic search, fuel type, search radius, theme preference, and service preferences using local storage.
- **Free Institutional Open Data Integration:** All data displayed by the application comes from the official datasets distributed by [MIMIT (Italian Ministry of Enterprises and Made in Italy)](https://www.mimit.gov.it/it/).
- **Geospatial Rendering & Smart Routing (Leaflet.js & OSRM):** Dynamic real-time mapping utilizing clustering and geospatial bounding boxes. Automatically calculates and draws the most convenient driving route using the OSRM engine.
- **Optimized Data Processing:** Raw CSV data provided by the Ministry is pre-processed locally or via serverless architecture into a single structured `dati.json` file, eliminating heavy browser-side parsing.
- **Integrated Search Engine & Geolocation API:** Advanced navigation through direct ZIP code/City search (via Nominatim) or via real-time hardware GPS positioning (requires HTTPS).
- **Custom CSS 3D Markers:** Uses mathematical logic and 3D CSS transformations to generate geographical flags that dynamically wave in response to animations, without using heavy external graphical frameworks.
- **Internationalization (i18n):** Automatically translates the UI to English or Italian based on the user's browser language.

---

## ⚡ How to Start the Project (IMPORTANT)

Due to security reasons (CORS Policy) and Geolocation API requirements, modern browsers restrict certain functionalities on local `file:///` protocols.

To run the application correctly on your PC:

1. Open the project folder.
2. **Double-click on the `start.bat` file**.
3. This powerful script will automatically perform two operations:
   - **Data Sync & Processing:** Instantly downloads the exact, up-to-date prices from the Ministry's server and processes them directly into JSON for maximum speed.
   - **Local Server:** Starts a very light local server (`localhost:8000`) and opens your browser, allowing you to browse smoothly.

*Note for mobile testing:* To use the hardware GPS feature and to install the PWA on a mobile device, the application must be served over a secure `HTTPS` connection (e.g., publishing to GitHub Pages).

---

## 🛠️ Technology Stack

The application follows strict *Separation of Concerns (SoC)* principles and is entirely structured inside the `assets/` folder.

- **Frontend Core:** HTML5, Vanilla JavaScript (ES6+), CSS3
- **CSS Framework:** Tailwind CSS v4 (Local CLI Compiler)
- **Map Engine & Routing:** OpenStreetMap API (OSM) / Leaflet.js / OSRM
- **Backend Data Processor:** Python 3 (Fetch and transform CSV to optimized JSON)
- **PWA Architecture:** Web App Manifest & Service Worker caching (Network-First strategy for real-time prices)

---

## 📝 Data and Serverless Architecture (Live Updates)

This application is designed to be autonomous and extremely responsive.

Data is automatically updated:

- **Locally:** By running the `start.bat` script, the system automatically downloads the CSVs from the Open Data portal, merging and compressing them into `dati.json`.
- **Remotely (GitHub Pages / Serverless):** The Service Worker uses a Network-First strategy to ensure users always receive the latest fuel prices every time they open the PWA.

*Anagraphic and price data are Italian public Open Data released by the Ministry of Enterprises and Made in Italy (MIMIT) under the IODL 2.0 license.*

---

## ⚖️ License

All source code (Frontend, HTML, CSS, JavaScript, and Python scripts) of this project is released **completely free and open-source** under the **[MIT License](LICENSE)**.

---
---

## Italiano 🇮🇹

**FuelFinder Italy** è una Progressive Web App (PWA) interattiva ad alte prestazioni progettata per la ricerca, visualizzazione e analisi geografica dei distributori di carburante sul territorio italiano. Sfruttando gli Open Data ufficiali del Ministero, garantisce informazioni in tempo reale con una UI moderna e un'esperienza utente fluida su qualsiasi dispositivo.

---

## 🚀 Punti di Forza e Caratteristiche Tecniche

- **Progressive Web App (PWA):** Installabile nativamente su iOS, Android, Windows e Mac. Include caching offline tramite Service Worker e un sistema avanzato a doppia icona per supportare le *Adaptive Icons* di Android senza sbavature grafiche.
- **Dark Mode Predefinita & Glassmorphism:** Interfaccia utente iper-moderna in stile vetro (Glassmorphism). La modalità scura è attiva di default per tutti i nuovi utenti, con un interruttore manuale per passare alla modalità chiara.
- **Salvataggio Preferenze Locali:** Memorizza in modo intelligente l'ultima posizione cercata, il tipo di carburante, il raggio d'azione, la scelta del tema e le preferenze del servizio, ripristinando istantaneamente l'ultima sessione.
- **Integrazione Open Data Istituzionale gratuita:** Tutti i dati derivano dai dataset ufficiali distribuiti dal [MIMIT](https://www.mimit.gov.it/it/).
- **Rendering Geospaziale & Routing Intelligente (Leaflet.js & OSRM):** Mappatura dinamica con calcolo automatico e disegno su mappa del tragitto stradale più rapido per raggiungere il distributore scelto.
- **Elaborazione Dati Ottimizzata:** I dati grezzi in CSV vengono pre-processati in un unico file `dati.json` strutturato per garantire caricamenti istantanei.
- **Motore di Ricerca & Geolocation API:** Navigazione tramite ricerca di CAP/Città o tramite posizionamento GPS hardware (richiede HTTPS).
- **Custom CSS 3D Markers:** Utilizzo di trasformazioni 3D in CSS per generare bandierine geografiche animate al vento in puro CSS.
- **Internazionalizzazione (i18n):** Traduzione automatica dinamica basata sulla lingua nativa del browser dell'utente (Italiano / Inglese).

---

## ⚡ Come Avviare il Progetto (IMPORTANTE)

1. Apri la cartella del progetto.
2. **Fai doppio click sul file `start.bat`**.
3. Questo script scaricherà gli ultimissimi prezzi dal Ministero e avvierà un server locale leggerissimo, aprendo automaticamente il browser.

*Nota per il GPS:* I browser moderni bloccano il GPS se il sito non ha una connessione sicura (il lucchetto verde). Per usare la tua posizione reale e installare l'app su telefono, il progetto deve essere pubblicato online su un dominio HTTPS (es. GitHub Pages).

---

## 📝 Architettura Dati e PWA

Grazie al Service Worker incluso nel progetto (`sw.js`), l'App scaricata sfrutta una strategia **Network-First** per i prezzi. Questo significa che l'app scaricata dal telefono andrà automaticamente a cercare il nuovo `dati.json` ogni giorno quando la apri, garantendoti prezzi sempre in tempo reale. Se sei offline o senza connessione, mostrerà l'ultimo file in memoria tramite il sistema di caching.

---

## 📝 Licenza

Tutto il codice sorgente di questo progetto è rilasciato in formato **completamente gratuito e open-source** sotto **[Licenza MIT](LICENSE)**.
