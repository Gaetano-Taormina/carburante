@echo off
echo =======================================================
echo     FuelFinder Italy - Avvio Server Locale
echo =======================================================
echo.
echo I browser moderni (Chrome, Edge) bloccano per sicurezza (CORS) 
echo il caricamento di file dati (CSV) se apri il sito facendo doppio 
echo click sul file index.html (protocollo file:///).
echo.
echo Questo script avvia un piccolo server locale sicuro per 
echo permettere all'applicazione di leggere correttamente i dati!
echo.
echo Aggiornamento dati in corso (potrebbe richiedere qualche secondo)...
python assets/py/update_mimit.py
echo.
echo Avvio del server sulla porta 8000...
echo.

:: Apre automaticamente il browser predefinito all'indirizzo del server
start http://localhost:8000

:: Avvia il server web integrato di Python
python -m http.server 8000

pause
