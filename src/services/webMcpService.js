/**
 * WebMCP (Web Model Context Protocol) Service
 * Standard W3C / Google Chrome 146+ AI Agent Integration
 * Allows AI agents (Gemini in Chrome, autonomous browser agents)
 * to interact with FuelFinder via structured tools.
 */

export const isWebMcpSupported = () => {
    return (
        typeof navigator !== 'undefined' &&
        'modelContext' in navigator &&
        typeof navigator.modelContext?.registerTool === 'function'
    );
};

export const registerWebMcpTools = ({
    onSearchLocation,
    onSetFuel,
    onSetRadius,
    onSetService,
    onNavigateStation
} = {}) => {
    if (!isWebMcpSupported()) {
        return false;
    }

    try {
        // 1. Tool: Cerca distributori carburante per località e filtri
        navigator.modelContext.registerTool({
            name: 'search_fuel_stations',
            description: 'Cerca i distributori di carburante più economici in Italia per città/indirizzo, tipologia di carburante e raggio di ricerca.',
            inputSchema: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'Nome del comune o indirizzo italiano (es. Roma, Milano, Napoli, Firenze).'
                    },
                    fuelType: {
                        type: 'string',
                        enum: ['Benzina', 'Gasolio', 'GPL', 'Metano', 'HVO', 'GNL'],
                        description: 'Tipo di carburante desiderato.'
                    },
                    radius: {
                        type: 'number',
                        enum: [3, 5, 10, 20],
                        description: 'Raggio di ricerca in chilometri.'
                    },
                    serviceType: {
                        type: 'string',
                        enum: ['1', '0', 'entrambi'],
                        description: 'Modalità di rifornimento: 1 (Self), 0 (Servito), entrambi.'
                    }
                },
                required: ['location']
            },
            readOnlyHint: true,
            execute: async (params) => {
                if (params.fuelType && onSetFuel) onSetFuel(params.fuelType);
                if (params.radius && onSetRadius) onSetRadius(params.radius);
                if (params.serviceType && onSetService) onSetService(params.serviceType);
                if (onSearchLocation) {
                    const result = await onSearchLocation(params.location);
                    return { success: true, location: params.location, result };
                }
                return { success: true, params };
            }
        });

        // 2. Tool: Imposta filtro carburante
        navigator.modelContext.registerTool({
            name: 'filter_fuel_type',
            description: 'Filtra la visualizzazione della mappa e i prezzi per una determinata tipologia di carburante.',
            inputSchema: {
                type: 'object',
                properties: {
                    fuelType: {
                        type: 'string',
                        enum: ['Benzina', 'Gasolio', 'GPL', 'Metano', 'HVO', 'GNL'],
                        description: 'Il tipo di carburante da selezionare.'
                    }
                },
                required: ['fuelType']
            },
            readOnlyHint: true,
            execute: async ({ fuelType }) => {
                if (onSetFuel) {
                    onSetFuel(fuelType);
                    return { success: true, selectedFuel: fuelType };
                }
                return { success: false, error: 'Handler not available' };
            }
        });

        // 3. Tool: Ottieni indicazioni stradali per un distributore
        navigator.modelContext.registerTool({
            name: 'get_station_directions',
            description: 'Avvia la navigazione o ottieni indicazioni verso un distributore specifico.',
            inputSchema: {
                type: 'object',
                properties: {
                    station: {
                        type: 'object',
                        properties: {
                            lat: { type: 'number' },
                            lng: { type: 'number' },
                            brand: { type: 'string' },
                            address: { type: 'string' }
                        },
                        required: ['lat', 'lng']
                    }
                },
                required: ['station']
            },
            readOnlyHint: true,
            execute: async ({ station }) => {
                if (onNavigateStation) {
                    onNavigateStation(station);
                    return { success: true, station };
                }
                return { success: false, error: 'Handler not available' };
            }
        });

        return true;
    } catch {
        return false;
    }
};
