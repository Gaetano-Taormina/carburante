/* oxlint-disable no-console */
import * as readline from 'node:readline/promises';
import crypto from 'crypto';
import 'dotenv/config';
import { createClient } from '@libsql/client';
import path from 'path';

const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY;

if (!ADMIN_PASSKEY) {
    console.error("[Error] Missing ADMIN_PASSKEY in .env");
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const inputKey = await rl.question('Inserisci la Passkey Admin: ');
    const cleanKey = inputKey.trim();

    if (cleanKey.length !== ADMIN_PASSKEY.length) {
        console.error("\n[Error] Access Denied: Invalid passkey length.\n");
        process.exit(1);
    }
    
    try {
        if (!crypto.timingSafeEqual(Buffer.from(cleanKey), Buffer.from(ADMIN_PASSKEY))) {
            console.error("\n[Error] Access Denied: Wrong passkey.\n");
            process.exit(1);
        }
    } catch {
        console.error("\n[Error] Access Denied: Validation error.\n");
        process.exit(1);
    }

    const daysInput = await rl.question('Quanti giorni indietro vuoi analizzare? (es. 7, premi Invio per tutti): ');
    const daysLimit = parseInt(daysInput.trim(), 10) || Infinity;
    
    rl.close();

    console.log('\n=============================================');
    console.log('   FUEL STATISTICS DASHBOARD');
    console.log('=============================================\n');

    const DB_URL = process.env.TURSO_DATABASE_URL || 'file:' + path.join(process.cwd(), 'server', 'database.sqlite');
    const DB_TOKEN = process.env.TURSO_AUTH_TOKEN;
    
    try {
        const db = createClient({ url: DB_URL, authToken: DB_TOKEN });
        const res = await db.execute('SELECT * FROM app_analytics ORDER BY date DESC');

        if (res.rows.length === 0) {
            console.log('Stats DB is empty.');
        } else {
            const rowsToShow = res.rows.slice(0, daysLimit);
            
            let totalVisits = 0;
            let totalUnique = 0;
            let totalSearches = 0;

            rowsToShow.forEach(row => {
                const uniqueUsers = row.uniqueIps ? JSON.parse(row.uniqueIps).length : 0;
                totalVisits += (row.visits || 0);
                totalUnique += uniqueUsers;
                totalSearches += (row.searches || 0);
                
                console.log(`  Date: ${row.date}`);
                console.log(`    Total Visits:    ${row.visits || 0}`);
                console.log(`    Unique Visitors: ${uniqueUsers}`);
                console.log(`    Searches:   ${row.searches || 0}`);
                console.log('---------------------------------------------');
            });
            
            console.log(`\nSOMMARIO TOTALI (Ultimi ${rowsToShow.length} giorni registrati)`);
            console.log(`=============================================`);
            console.log(`    Visite Totali:    ${totalVisits}`);
            console.log(`    Visitatori Unici: ${totalUnique} (stimati)`);
            console.log(`    Total Searches:  ${totalSearches}`);
            console.log(`=============================================\n`);
        }

        const { fetchTursoUsage, TURSO_LIMITS } = await import('./services/quotaService.js');
        const tursoUsage = await fetchTursoUsage();
        if (tursoUsage) {
            console.log(`=============================================`);
            console.log(`   TURSO CLOUD QUOTA LIVE USAGE`);
            console.log(`=============================================`);
            console.log(`  Rows Read:    ${tursoUsage.rowsRead.toLocaleString()} / ${TURSO_LIMITS.ROWS_READ.toLocaleString()} (${tursoUsage.pctRead}%)`);
            console.log(`  Rows Written: ${tursoUsage.rowsWritten.toLocaleString()} / ${TURSO_LIMITS.ROWS_WRITTEN.toLocaleString()} (${tursoUsage.pctWritten}%)`);
            console.log(`  Storage Sync: ${(tursoUsage.bytesSynced / 1024 / 1024).toFixed(1)} MB / 3.0 GB (${tursoUsage.pctSynced}%)`);
            console.log(`  Status:       ${tursoUsage.isCritical ? '⚠️ SOGLIA CRITICA (>80%)' : '✅ NORMALE (Entro i limiti)'}`);
            console.log(`=============================================\n`);
        }
    } catch (e) {
        console.error('DB Read Error:', e.message);
    }
    
    process.exit(0);
})();
