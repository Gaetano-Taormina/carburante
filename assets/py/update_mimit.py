import urllib.request
import os
import csv
import json

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

def scarica_file(url, path):
    print(f"Scaricando: {url}")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response, open(path, 'wb') as out_file:
        out_file.write(response.read())
    print(f"Salvato in: {path} ({os.path.getsize(path) / 1024 / 1024:.2f} MB)")

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
