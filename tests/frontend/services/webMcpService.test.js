import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebMcpSupported, registerWebMcpTools } from '../../../src/services/webMcpService';

describe('WebMCP Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete global.navigator.modelContext;
    });

    afterEach(() => {
        delete global.navigator.modelContext;
    });

    it('returns false when modelContext is not supported on navigator', () => {
        delete global.navigator.modelContext;
        expect(isWebMcpSupported()).toBe(false);
        expect(registerWebMcpTools()).toBe(false);
    });

    it('registers all tools and handles executions when WebMCP is supported', async () => {
        const registeredTools = {};
        const mockRegisterTool = vi.fn((toolDef) => {
            registeredTools[toolDef.name] = toolDef;
        });

        Object.defineProperty(global.navigator, 'modelContext', {
            value: { registerTool: mockRegisterTool },
            configurable: true,
            writable: true
        });

        expect(isWebMcpSupported()).toBe(true);

        const onSearchLocation = vi.fn().mockResolvedValue({ lat: 41.9, lng: 12.5 });
        const onSetFuel = vi.fn();
        const onSetRadius = vi.fn();
        const onSetService = vi.fn();
        const onNavigateStation = vi.fn();

        const success = registerWebMcpTools({
            onSearchLocation,
            onSetFuel,
            onSetRadius,
            onSetService,
            onNavigateStation
        });

        expect(success).toBe(true);
        expect(mockRegisterTool).toHaveBeenCalledTimes(3);

        // 1. Test search_fuel_stations execution
        const searchTool = registeredTools['search_fuel_stations'];
        expect(searchTool).toBeDefined();
        const searchRes = await searchTool.execute({
            location: 'Milano',
            fuelType: 'Diesel',
            radius: 10,
            serviceType: '1'
        });

        expect(onSetFuel).toHaveBeenCalledWith('Diesel');
        expect(onSetRadius).toHaveBeenCalledWith(10);
        expect(onSetService).toHaveBeenCalledWith('1');
        expect(onSearchLocation).toHaveBeenCalledWith('Milano');
        expect(searchRes).toEqual({
            success: true,
            location: 'Milano',
            result: { lat: 41.9, lng: 12.5 }
        });

        // 2. Test filter_fuel_type execution
        const filterTool = registeredTools['filter_fuel_type'];
        expect(filterTool).toBeDefined();
        const filterRes = await filterTool.execute({ fuelType: 'Metano' });
        expect(onSetFuel).toHaveBeenCalledWith('Metano');
        expect(filterRes).toEqual({ success: true, selectedFuel: 'Metano' });

        // 3. Test get_station_directions execution
        const navTool = registeredTools['get_station_directions'];
        expect(navTool).toBeDefined();
        const sampleStation = { lat: 45.4, lng: 9.1, brand: 'Eni', address: 'Via Roma 1' };
        const navRes = await navTool.execute({ station: sampleStation });
        expect(onNavigateStation).toHaveBeenCalledWith(sampleStation);
        expect(navRes).toEqual({ success: true, station: sampleStation });
    });

    it('handles fallback executions when optional callbacks are omitted', async () => {
        const registeredTools = {};
        Object.defineProperty(global.navigator, 'modelContext', {
            value: {
                registerTool: vi.fn((toolDef) => {
                    registeredTools[toolDef.name] = toolDef;
                })
            },
            configurable: true,
            writable: true
        });

        registerWebMcpTools({});

        // Execute without callbacks
        const searchRes = await registeredTools['search_fuel_stations'].execute({ location: 'Roma' });
        expect(searchRes).toEqual({ success: true, params: { location: 'Roma' } });

        const filterRes = await registeredTools['filter_fuel_type'].execute({ fuelType: 'GPL' });
        expect(filterRes).toEqual({ success: false, error: 'Handler not available' });

        const navRes = await registeredTools['get_station_directions'].execute({ station: { lat: 40, lng: 14 } });
        expect(navRes).toEqual({ success: false, error: 'Handler not available' });
    });

    it('catches and returns false if registerTool throws an error', () => {
        Object.defineProperty(global.navigator, 'modelContext', {
            value: {
                registerTool: () => {
                    throw new Error('Registration failed');
                }
            },
            configurable: true,
            writable: true
        });

        expect(registerWebMcpTools()).toBe(false);
    });
});
