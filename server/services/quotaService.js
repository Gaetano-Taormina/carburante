/* oxlint-disable no-console */
import 'dotenv/config';

export const TURSO_LIMITS = {
    ROWS_READ: 500_000_000,
    ROWS_WRITTEN: 10_000_000,
    STORAGE_BYTES: 9_000_000_000, // 9 GB
    BYTES_SYNCED: 3_221_225_472   // 3 GiB
};

export async function fetchTursoUsage() {
    const token = process.env.TURSO_PLATFORM_API_TOKEN;
    const orgSlug = process.env.TURSO_ORG_SLUG || 'gaetano-taormina';

    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`https://api.turso.tech/v1/organizations/${orgSlug}/usage`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'FuelFinder-QuotaService/1.0'
            },
            signal: AbortSignal.timeout(6000)
        });

        if (!response.ok) {
            console.warn(`[QuotaService] Turso API returned status ${response.status}`);
            return null;
        }

        const data = await response.json();
        const usage = data.total || data.organization?.usage || {};

        const rowsRead = usage.rows_read || 0;
        const rowsWritten = usage.rows_written || 0;
        const bytesSynced = usage.bytes_synced || 0;
        const storageBytes = usage.storage_bytes || 0;

        const pctRead = Number(((rowsRead / TURSO_LIMITS.ROWS_READ) * 100).toFixed(2));
        const pctWritten = Number(((rowsWritten / TURSO_LIMITS.ROWS_WRITTEN) * 100).toFixed(2));
        const pctSynced = Number(((bytesSynced / TURSO_LIMITS.BYTES_SYNCED) * 100).toFixed(2));

        return {
            rowsRead,
            rowsWritten,
            bytesSynced,
            storageBytes,
            pctRead,
            pctWritten,
            pctSynced,
            isCritical: pctRead >= 80 || pctWritten >= 80,
            isEmergency: pctSynced >= 95 || pctRead >= 95 || pctWritten >= 95
        };
    } catch (error) {
        console.warn(`[QuotaService] Error querying Turso Platform API: ${error.message}`);
        return null;
    }
}
