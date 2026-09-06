import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTursoUsage, TURSO_LIMITS } from '../../server/services/quotaService.js';

describe('QuotaService - Turso Platform API Monitoring', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.restoreAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns null if TURSO_PLATFORM_API_TOKEN is missing', async () => {
        delete process.env.TURSO_PLATFORM_API_TOKEN;
        const result = await fetchTursoUsage();
        expect(result).toBeNull();
    });

    it('fetches and computes normal quota usage accurately', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';
        process.env.TURSO_ORG_SLUG = 'test-org';

        const mockResponse = {
            total: {
                rows_read: 50_000_000,
                rows_written: 1_000_000,
                bytes_synced: 100_000_000,
                storage_bytes: 20_000_000
            }
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse
        });

        const usage = await fetchTursoUsage();
        expect(usage).not.toBeNull();
        expect(usage.rowsRead).toBe(50_000_000);
        expect(usage.rowsWritten).toBe(1_000_000);
        expect(usage.pctRead).toBe(10);
        expect(usage.pctWritten).toBe(10);
        expect(usage.isCritical).toBe(false);
        expect(usage.isEmergency).toBe(false);
    });

    it('flags isCritical when read or write exceeds 80%', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';

        const mockResponse = {
            organization: {
                usage: {
                    rows_read: 410_000_000,
                    rows_written: 500_000,
                    bytes_synced: 500_000_000,
                    storage_bytes: 20_000_000
                }
            }
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse
        });

        const usage = await fetchTursoUsage();
        expect(usage.isCritical).toBe(true);
        expect(usage.isEmergency).toBe(false);
        expect(usage.pctRead).toBe(82);
    });

    it('flags isEmergency when sync exceeds 95%', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';

        const mockResponse = {
            total: {
                rows_read: 100_000_000,
                rows_written: 500_000,
                bytes_synced: TURSO_LIMITS.BYTES_SYNCED * 0.96,
                storage_bytes: 20_000_000
            }
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse
        });

        const usage = await fetchTursoUsage();
        expect(usage.isEmergency).toBe(true);
        expect(usage.pctSynced).toBeGreaterThanOrEqual(95);
    });

    it('uses default org slug and handles empty usage payload gracefully', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';
        delete process.env.TURSO_ORG_SLUG;

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({})
        });

        const usage = await fetchTursoUsage();
        expect(usage).not.toBeNull();
        expect(usage.rowsRead).toBe(0);
        expect(usage.rowsWritten).toBe(0);
        expect(usage.bytesSynced).toBe(0);
        expect(usage.storageBytes).toBe(0);
    });

    it('handles non-OK responses gracefully returning null', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 403
        });

        const result = await fetchTursoUsage();
        expect(result).toBeNull();
    });

    it('handles fetch exceptions gracefully returning null', async () => {
        process.env.TURSO_PLATFORM_API_TOKEN = 'test-token';

        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

        const result = await fetchTursoUsage();
        expect(result).toBeNull();
    });
});

