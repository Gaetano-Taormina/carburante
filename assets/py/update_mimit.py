import urllib.request
import urllib.error
import os
import csv
import json
import time

print("Inizio download dati MIMIT...")

# URL dei file CSV
url_anagrafica = "https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv"
url_prezzi = "https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv"

# Percorsi di destinazione
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, "data")

if not os.path.exists(data_dir):
    os.makedirs(data_dir)

path_anagrafica = os.path.join(data_dir, "anagrafica_impianti_attivi.csv")
path_prezzi = os.path.join(data_dir, "prezzo_alle_8.csv")
path_json = os.path.join(data_dir, "dati.json")

# Header per simulare un browser ed evitare blocchi
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

def ottieni_lista_proxy():
    print("Recupero lista proxy gratuiti...")
    # Recupera una lista di proxy HTTP anonimi
    proxy_url = "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=all"
    try:
        req = urllib.request.Request(proxy_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            proxies = response.read().decode('utf-8').splitlines()
            # Prendiamo i primi 30 proxy
            return [p.strip() for p in proxies if p.strip()][:30]
    except Exception as e:
        print(f"Errore nel recupero proxy: {e}")
        return []

def scarica_file(url, path):
    print(f"Scaricando: {url}")
    
    # 1. Tentativo Diretto (funziona sul tuo PC locale)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Salvato in: {path} ({os.path.getsize(path) / 1024 / 1024:.2f} MB) - [Connessione Diretta]")
        return
    except Exception as e:
        print(f"Tentativo diretto fallito: {e}. Avvio modalità 'Fantasma' con Proxy...")

    # 2. Tentativo con Proxy (per i server GitHub)
    proxies = ottieni_lista_proxy()
    if not proxies:
        raise Exception("Impossibile scaricare: Nessun proxy disponibile e connessione diretta fallita.")
        
    for proxy in proxies:
        print(f"Provo a scaricare tramite il proxy: {proxy}")
        try:
            proxy_handler = urllib.request.ProxyHandler({'http': proxy, 'https': proxy})
            opener = urllib.request.build_opener(proxy_handler)
            req = urllib.request.Request(url, headers=headers)
            with opener.open(req, timeout=15) as response, open(path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Salvato in: {path} ({os.path.getsize(path) / 1024 / 1024:.2f} MB) - [Tramite Proxy {proxy}]")
            return # Successo! Usciamo.
        except Exception as e:
            print(f"Proxy {proxy} fallito o troppo lento.")
            
    # Se arriviamo qui, abbiamo provato 30 proxy e hanno fallito tutti
    raise Exception(f"Impossibile scaricare {url}. Tutti i 30 proxy testati hanno fallito.")

def genera_json():
    print("Inizio generazione file JSON...")
    
    # 1. Carichiamo i prezzi
    # Il CSV prezzi ha: idImpianto|descCarburante|prezzo|isSelf|dtComu
    # Salta le righe vuote o l'intestazione finta (le prime righe di mimit hanno un commento, ma usiamo un approccio robusto)
    prices_dict = {}
    with open(path_prezzi, 'r', encoding='utf-8', errors='ignore') as f:
        # Togliamo le prime due righe se una contiene commenti strani (spesso il ministero mette una riga descrittiva)
        # Troviamo la riga che inizia con idImpianto
        lines = f.readlines()
        start_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('idImpianto'):
                start_idx = i
                break
                
        reader = csv.DictReader(lines[start_idx:], delimiter='|')
        for row in reader:
            if not row or 'idImpianto' not in row: continue
            pid = row['idImpianto']
            if not pid: continue
            
            carb = row.get('descCarburante', '')
            is_self = row.get('isSelf', '0')
            try:
                prezzo = float(row.get('prezzo', '0').replace(',', '.'))
            except ValueError:
                continue
                
            if pid not in prices_dict:
                prices_dict[pid] = {'self': {}, 'servito': {}}
                
            if is_self == '1':
                prices_dict[pid]['self'][carb] = prezzo
            else:
                prices_dict[pid]['servito'][carb] = prezzo

    # 2. Carichiamo le anagrafiche e incrociamo
    # anagrafica: idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine
    stations = []
    with open(path_anagrafica, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        start_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('idImpianto'):
                start_idx = i
                break
                
        reader = csv.DictReader(lines[start_idx:], delimiter='|')
        for row in reader:
            if not row or 'idImpianto' not in row: continue
            pid = row['idImpianto']
            if not pid: continue
            
            lat_str = row.get('Latitudine', '').replace(',', '.')
            lng_str = row.get('Longitudine', '').replace(',', '.')
            
            try:
                lat = float(lat_str)
                lng = float(lng_str)
            except ValueError:
                continue
                
            # Aggiungiamo solo se ci sono prezzi associati
            if pid in prices_dict:
                stations.append({
                    'id': pid,
                    'brand': row.get('Bandiera', ''),
                    'name': row.get('Nome Impianto', ''),
                    'address': f"{row.get('Indirizzo', '')}, {row.get('Comune', '')}",
                    'lat': lat,
                    'lng': lng,
                    'prices': prices_dict[pid]
                })

    # 3. Salvataggio JSON
    with open(path_json, 'w', encoding='utf-8') as f:
        json.dump(stations, f, indent=2) # Formattato su più righe per non far crashare l'editor
    
    print(f"JSON salvato in {path_json} ({os.path.getsize(path_json) / 1024 / 1024:.2f} MB)")
    print(f"Totale distributori attivi: {len(stations)}")


try:
    scarica_file(url_anagrafica, path_anagrafica)
    scarica_file(url_prezzi, path_prezzi)
    genera_json()
    print("Operazione completata con successo!")
except Exception as e:
    print(f"Errore: {e}")
    exit(1)
