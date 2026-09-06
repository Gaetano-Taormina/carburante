/* oxlint-disable no-console */
import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";
import "dotenv/config";

import { URL_ANAGRAFICA, URL_PREZZI, checkUpdates, downloadFile } from "./network.js";
import { initSchema, getLastModified, loadExistingData, applyChanges, setLastModified } from "./database.js";
import { processStationsDiff, processPricesDiff, processDeletions } from "./processor.js";

export async function sync(dbClient, retries = 8, options = {}) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    console.warn("[Sync] Operazione bloccata: Sito in Maintenance Mode per protezione quota Turso.");
    return;
  }

  if (!dbClient) {
    const DB_URL = process.env.TURSO_DATABASE_URL || "file:" + path.join(process.env.DATA_DIR || path.join(process.cwd(), "server"), "database.sqlite");
    const DB_TOKEN = process.env.TURSO_AUTH_TOKEN;
    dbClient = createClient({ url: DB_URL, authToken: DB_TOKEN });
  }

  try {
    await doSync(dbClient, options);
  } catch (error) {
    const errMsg = (error.message || '').toLowerCase();
    
    // Rilevamento Quota Turso esaurita anche durante il sync in background
    if (errMsg.includes('quota') || errMsg.includes('billing') || errMsg.includes('exceeded') || errMsg.includes('payment required') || errMsg.includes('resource_exhausted')) {
        console.warn("[WARN] Turso quota exceeded. Maintenance mode active.");
        process.env.MAINTENANCE_MODE = 'true';
    }

    console.error(`[Sync] Error:`, error.message);
    if (retries > 0) {
      console.log(`[Sync] Retrying in 5m... (Left: ${retries})`);
      await new Promise((res) => setTimeout(res, 5 * 60 * 1000));
      return sync(dbClient, retries - 1);
    }
    throw error;
  }
}

async function doSync(db, options = {}) {
  console.log("Checking MIMIT updates before touching database...");

  const localDbPath = path.join(process.env.DATA_DIR || path.join(process.cwd(), "server"), "database.sqlite");
  let localDb = db;
  if (fs.existsSync(localDbPath)) {
    try {
      localDb = createClient({ url: `file:${localDbPath}` });
    } catch {}
  }

  const lastModifiedHeader = await getLastModified(db, localDb);
  const updateCheck = await checkUpdates(lastModifiedHeader);

  if (!updateCheck.shouldUpdate) {
      console.log("✅ Zero database queries executed: MIMIT data is identical.");
      return;
  }

  console.log("MIMIT updates detected. Loading existing data to compute diff...");
  const { existingStations, existingPrices } = await loadExistingData(db, localDb);

  const syncOps = {
      upsertStations: [],
      upsertPrices: [],
      deleteStations: [],
      deletePrices: []
  };
  const seenStationIds = new Set();
  const seenPriceIds = new Set();

  let anagraficaFile = null;
  let prezziFile = null;

  try {
      console.log(`Downloading ${URL_ANAGRAFICA}...`);
      anagraficaFile = await downloadFile(URL_ANAGRAFICA);
      await processStationsDiff(anagraficaFile, existingStations, syncOps, seenStationIds, options);

      console.log(`Downloading ${URL_PREZZI}...`);
      prezziFile = await downloadFile(URL_PREZZI);
      await processPricesDiff(prezziFile, existingPrices, syncOps, seenPriceIds, options);

      processDeletions(existingStations, existingPrices, seenStationIds, seenPriceIds, syncOps);
      
      const totalChanges = syncOps.upsertStations.length + syncOps.upsertPrices.length + syncOps.deleteStations.length + syncOps.deletePrices.length;

      if (options.dryRun) {
          console.log(`\n[DRY RUN] Sincronizzazione simulata completata.`);
          console.log(`[DRY RUN] Righe totali modificate che verrebbero inviate a Turso: ${totalChanges}`);
          return;
      }
      
      if (totalChanges === 0) {
          console.log("No data modifications found. Updating last modified timestamp only.");
          await setLastModified(db, updateCheck.newLastModified, localDb);
          return;
      }

      await initSchema(db);
      await applyChanges(db, syncOps);
      await setLastModified(db, updateCheck.newLastModified, localDb);
      
      console.log(`✅ DB sync completed successfully (${totalChanges} changes applied).`);

  } finally {
      if (anagraficaFile && fs.existsSync(anagraficaFile)) fs.unlinkSync(anagraficaFile);
      if (prezziFile && fs.existsSync(prezziFile)) fs.unlinkSync(prezziFile);
  }
}
