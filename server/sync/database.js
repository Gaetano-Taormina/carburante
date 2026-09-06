/* oxlint-disable no-console */
export const BATCH_SIZE = 2500;

export async function initSchema(db) {
  console.log("Checking tables...");
  await db.batch([
      `CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT);`,
      `CREATE TABLE IF NOT EXISTS stations (
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
        );`,
      `CREATE TABLE IF NOT EXISTS prices (
            id_impianto INTEGER,
            desc_carburante TEXT,
            prezzo REAL,
            is_self INTEGER,
            dt_comunicazione TEXT,
            UNIQUE(id_impianto, desc_carburante, is_self)
        );`,
      `CREATE INDEX IF NOT EXISTS idx_stations_lat_lng ON stations(latitudine, longitudine);`,
      `CREATE INDEX IF NOT EXISTS idx_stations_comune ON stations(comune COLLATE NOCASE);`,
      `CREATE INDEX IF NOT EXISTS idx_prices_impianto ON prices(id_impianto);`,
      `CREATE INDEX IF NOT EXISTS idx_prices_carburante ON prices(desc_carburante);`,
      `CREATE INDEX IF NOT EXISTS idx_prices_fuel_impianto ON prices(desc_carburante, id_impianto, is_self, prezzo);`,
      `CREATE INDEX IF NOT EXISTS idx_prices_carburante_nocase ON prices(desc_carburante COLLATE NOCASE, id_impianto, prezzo);`,
  ], "write");
}

export async function getLastModified(db, localDb) {
    const targetDb = localDb || db;
    try {
        const lastSync = await targetDb.execute(`SELECT value FROM sync_meta WHERE key = 'URL_PREZZI'`);
        return lastSync.rows.length > 0 ? lastSync.rows[0].value : null;
    } catch {
        return null;
    }
}

export async function setLastModified(db, newLastModified, localDb) {
  if (newLastModified) {
    const query = {
      sql: `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
      args: ["URL_PREZZI", newLastModified],
    };
    await db.execute(query);
    if (localDb && localDb !== db) {
      try {
        await localDb.execute(query);
      } catch {}
    }
  }
}

export async function loadExistingData(db, localDb) {
  console.log("Loading current data from local database...");
  const targetDb = localDb || db;
  const existingStations = new Map();
  try {
      const stRes = await targetDb.execute("SELECT id, gestore, bandiera, tipo_impianto, nome_impianto, indirizzo, comune, provincia, latitudine, longitudine FROM stations");
      for (const r of stRes.rows) existingStations.set(r.id, r);
  } catch {}
  
  const existingPrices = new Map();
  try {
      const prRes = await targetDb.execute("SELECT id_impianto, desc_carburante, is_self, prezzo, dt_comunicazione FROM prices");
      for (const r of prRes.rows) existingPrices.set(`${r.id_impianto}_${r.desc_carburante}_${r.is_self}`, r);
  } catch {}

  console.log(`Loaded: ${existingStations.size} stations, ${existingPrices.size} prices (zero remote Turso read cost).`);
  return { existingStations, existingPrices };
}

export async function applyChanges(db, syncOps) {
    const batchedQueries = [];

    // Stations UPSERT (10 vars per row, max 90 rows per query = 900 vars)
    const stationsChunkSize = 90;
    const stationsSqlBase = `INSERT INTO stations (id, gestore, bandiera, tipo_impianto, nome_impianto, indirizzo, comune, provincia, latitudine, longitudine) VALUES `;
    const stationsOnConflict = ` ON CONFLICT(id) DO UPDATE SET gestore=excluded.gestore, bandiera=excluded.bandiera, tipo_impianto=excluded.tipo_impianto, nome_impianto=excluded.nome_impianto, indirizzo=excluded.indirizzo, comune=excluded.comune, provincia=excluded.provincia, latitudine=excluded.latitudine, longitudine=excluded.longitudine`;

    for (let i = 0; i < syncOps.upsertStations.length; i += stationsChunkSize) {
        const chunk = syncOps.upsertStations.slice(i, i + stationsChunkSize);
        const placeholders = chunk.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(", ");
        const args = chunk.flat();
        batchedQueries.push({ sql: stationsSqlBase + placeholders + stationsOnConflict, args });
    }

    // Prices UPSERT (5 vars per row, max 180 rows per query = 900 vars)
    const pricesChunkSize = 180;
    const pricesSqlBase = `INSERT INTO prices (id_impianto, desc_carburante, prezzo, is_self, dt_comunicazione) VALUES `;
    const pricesOnConflict = ` ON CONFLICT(id_impianto, desc_carburante, is_self) DO UPDATE SET prezzo=excluded.prezzo, dt_comunicazione=excluded.dt_comunicazione`;

    for (let i = 0; i < syncOps.upsertPrices.length; i += pricesChunkSize) {
        const chunk = syncOps.upsertPrices.slice(i, i + pricesChunkSize);
        const placeholders = chunk.map(() => `(?, ?, ?, ?, ?)`).join(", ");
        const args = chunk.flat();
        batchedQueries.push({ sql: pricesSqlBase + placeholders + pricesOnConflict, args });
    }

    // Stations DELETE
    for (const idArr of syncOps.deleteStations) {
        batchedQueries.push({ sql: `DELETE FROM stations WHERE id=?`, args: idArr });
    }

    // Prices DELETE
    for (const args of syncOps.deletePrices) {
        batchedQueries.push({ sql: `DELETE FROM prices WHERE id_impianto=? AND desc_carburante=? AND is_self=?`, args });
    }

    console.log(`Sending ${batchedQueries.length} highly-optimized bulk queries to Turso...`);
    if (batchedQueries.length > 0) {
        const TURSO_BATCH_SIZE = 50; 
        for (let i = 0; i < batchedQueries.length; i += TURSO_BATCH_SIZE) {
            const chunk = batchedQueries.slice(i, i + TURSO_BATCH_SIZE);
            // oxlint-disable-next-line no-await-in-loop
            await db.batch(chunk, "write");
        }
        console.log(`Saved successfully.`);
    }
}
