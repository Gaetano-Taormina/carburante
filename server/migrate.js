/* oxlint-disable no-console */
import { createClient } from '@libsql/client';
import 'dotenv/config';

async function migrate() {
    console.log("[INFO] Inizio migrazione schema database...");
    
    // Connessione DIRETTA al database remoto Turso (senza replica locale)
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS stations (
                id INTEGER PRIMARY KEY,
                gestore TEXT,
                bandiera TEXT,
                tipo_impianto TEXT,
                nome_impianto TEXT,
                indirizzo TEXT,
                comune TEXT,
                provincia TEXT,
                latitudine REAL,
                longitudine REAL
            );
        `);
        console.log("[INFO] Tabella 'stations' verificata/creata con successo.");
        
        // Creazione tabella prices se non esiste
        await client.execute(`
            CREATE TABLE IF NOT EXISTS prices (
                id_impianto INTEGER,
                desc_carburante TEXT,
                prezzo REAL,
                isSelf INTEGER,
                dt_com TEXT,
                PRIMARY KEY (id_impianto, desc_carburante, isSelf)
            );
        `);
        console.log("[INFO] Tabella 'prices' verificata/creata con successo.");

        // Indici per velocizzare ricerche geografiche e azzerare Full Table Scan su Turso
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_stations_coords ON stations(latitudine, longitudine);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_stations_comune ON stations(comune COLLATE NOCASE);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_prices_impianto ON prices(id_impianto);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_prices_fuel_impianto ON prices(desc_carburante, id_impianto, is_self, prezzo);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_prices_carburante_nocase ON prices(desc_carburante COLLATE NOCASE, id_impianto, prezzo);`);
        console.log("[INFO] Indici di performance verificati/creati con successo.");

        console.log("[SUCCESS] Migrazione completata con successo!");
        process.exit(0);
    } catch (error) {
        console.error("[ERROR] Errore durante la migrazione:", error);
        process.exit(1);
    }
}

migrate();
