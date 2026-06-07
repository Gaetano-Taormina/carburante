# FuelFinder Italy ⛽

![FuelFinder Logo](assets/libs/images/marker-icon-2x.png)

*Read this in [Italiano](#italiano) 🇮🇹*

**FuelFinder Italy** is a high-performance interactive Web Application designed for searching, visualizing, and analyzing fuel stations across Italy. Leveraging official Open Data from the Italian Ministry, it guarantees real-time information with a modern UI and a fluid user experience.

---

## 🚀 Key Features & Technical Highlights

- **Free Institutional Open Data Integration:** All data displayed by the application comes from the official datasets distributed by [MIMIT (Italian Ministry of Enterprises and Made in Italy)](https://www.mimit.gov.it/it/).
- **Geospatial Rendering (Leaflet.js):** Dynamic real-time mapping utilizing clustering and geospatial bounding boxes to ensure the rendering of thousands of points without any framerate drop (60fps).
- **Optimized Data Processing:** Raw CSV data provided by the Ministry is pre-processed locally or via serverless architecture into a single structured `dati.json` file. This eliminates the need for heavy browser-side parsing, guaranteeing almost instantaneous loading.
- **"Glassmorphism" Design System with Tailwind CSS:** Ultra-modern UI based on the *Glassmorphism* paradigm, fully supporting dynamic **Dark Mode**. The project uses a local JIT (Just-In-Time) Tailwind CSS compiler for maximum lightness.
- **Integrated Search Engine & Geolocation API:** Advanced navigation through direct ZIP code/City search (via Nominatim) or via real-time hardware GPS positioning.
- **Custom CSS 3D Markers:** Uses mathematical logic and 3D CSS transformations (`rotateY`, `skewY`, `perspective`) to generate geographical flags that dynamically wave in response to animations, without using external frameworks.
- **Internationalization (i18n):** Automatically translates the UI to English or Italian based on the user's browser language.

---

## ⚡ How to Start the Project (IMPORTANT)

Due to security reasons (CORS Policy), modern browsers prevent local JavaScript applications from reading local data files via simple double-click (`file:///` protocol).

To run the application correctly on your PC:

1. Open the project folder.
2. **Double-click on the `start.bat` file**.
3. This powerful script will automatically perform two operations:
   - **Data Sync & Processing:** It will instantly download the exact, up-to-date prices from the Ministry's server and process them directly into JSON for maximum speed.
   - **Local Server:** It will start a very light local server (`localhost:8000`) and open your browser, allowing you to browse smoothly and without blocks.

---

## 🛠️ Technology Stack

The application follows strict *Separation of Concerns (SoC)* principles and is entirely structured inside the `assets/` folder.

- **Frontend Core:** HTML5, Vanilla JavaScript (ES6+), CSS3
- **CSS Framework:** Tailwind CSS v4 (Local CLI Compiler)
- **Map Engine:** OpenStreetMap API (OSM) / Leaflet.js
- **Data Processor Backend:** Python 3 (Fetch and transform CSV to optimized JSON)

---

## 📝 Data and Serverless Architecture (Live Updates)

This application is designed to be autonomous and extremely responsive.

Data is automatically updated:

- **Locally:** By running the `start.bat` script, the system automatically downloads the CSVs from the Open Data portal, merging and compressing them into `dati.json`.
- **Remotely (GitHub Pages / Serverless):** If hosted online, you can use a free infrastructure (e.g., GitHub Actions) to trigger a bot that autonomously updates the `dati.json` file every morning at 6:00 AM.

*Anagraphic and price data are Italian public Open Data released by the Ministry of Enterprises and Made in Italy (MIMIT) under the IODL 2.0 license.*

---

## ⚖️ License

All source code (Frontend, HTML, CSS, JavaScript, and Python scripts) of this project is released **completely free and open-source** under the **[MIT License](LICENSE)**.

---
---

<a name="italiano"></a>
# FuelFinder Italy (Italiano) 🇮🇹

**FuelFinder Italy** è una Web Application interattiva ad alte prestazioni progettata per la ricerca, visualizzazione e analisi geografica dei distributori di carburante sul territorio italiano. Sfruttando gli Open Data ufficiali del Ministero, garantisce informazioni in tempo reale con una UI moderna e un'esperienza utente fluida.

---

## 🚀 Punti di Forza e Caratteristiche Tecniche

- **Integrazione Open Data Istituzionale gratuita:** Tutti i dati derivano dai dataset ufficiali distribuiti dal [MIMIT](https://www.mimit.gov.it/it/).
- **Rendering Geospaziale (Leaflet.js):** Mappatura dinamica in tempo reale sfruttando clusterizzazioni e bounding box geospaziali a 60fps.
- **Elaborazione Dati Ottimizzata:** I dati grezzi in CSV vengono pre-processati in un unico file `dati.json` strutturato. Questo elimina pesanti elaborazioni lato browser, garantendo un caricamento istantaneo.
- **Design System "Glassmorphism" con Tailwind CSS:** Interfaccia utente iper-moderna con pieno supporto alla **Dark Mode** dinamica. Tailwind CSS compilato localmente.
- **Motore di Ricerca & Geolocation API:** Navigazione tramite ricerca di CAP/Città o tramite posizionamento GPS hardware.
- **Custom CSS 3D Markers:** Utilizzo di trasformazioni 3D in CSS per generare bandierine geografiche animate al vento.
- **Internazionalizzazione (i18n):** Traduzione automatica dinamica basata sulla lingua nativa del browser dell'utente (Italiano / Inglese).

---

## ⚡ Come Avviare il Progetto (IMPORTANTE)

Per via delle regole di sicurezza (CORS Policy), apri l'app in questo modo:

1. Apri la cartella del progetto.
2. **Fai doppio click sul file `start.bat`**.
3. Questo script scaricherà gli ultimissimi prezzi dal Ministero e avvierà un server locale leggerissimo, aprendo automaticamente il browser.

---

## 📝 Licenza

Tutto il codice sorgente di questo progetto è rilasciato in formato **completamente gratuito e open-source** sotto **[Licenza MIT](LICENSE)**.
