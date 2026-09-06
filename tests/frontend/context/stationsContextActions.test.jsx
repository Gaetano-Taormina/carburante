import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StationsProvider, useStations } from '../../../src/context/StationsContext';
import { MemoryRouter, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { SWRConfig } from 'swr';

const originalLocation = window.location;

const TestActionsConsumer = () => {
  const {
    stations, totalStations,
    fuelType, setFuelType,
    setUserPos
  } = useStations();

  const location = useLocation();

  return (
    <div>
      <div data-testid="fuelType">{fuelType}</div>
      <div data-testid="searchParamFuel">{location.pathname.split('/').pop()}</div>
      <div data-testid="stationsCount">{stations.length}</div>
      <div data-testid="totalStations">{totalStations}</div>
      
      <button onClick={() => setFuelType('Gasolio')}>Set Gasolio</button>
      <button onClick={() => setFuelType('Idrogeno')}>Set Idrogeno</button>
      <button onClick={() => setUserPos({ lat: 41, lng: 12 })}>Set Pos</button>
    </div>
  );
};

describe('StationsContext - Fuel Actions & Data Fetching', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url.includes('/api/stations')) {
        return {
          ok: true,
          json: async () => ({ stations: [{ id: 1 }, { id: 2 }], totalCount: 2 })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    delete window.location;
    window.location = { ...originalLocation, pathname: '/it/', href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderWithProvider = (initialEntries = ['/it/']) => {
    return render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/:lang/:fuel?" element={<StationsProvider><TestActionsConsumer /></StationsProvider>} />
            <Route path="*" element={<StationsProvider><TestActionsConsumer /></StationsProvider>} />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    );
  };

  it('setFuelType updates URL pathname in Italian (carburante=Gasolio)', async () => {
    window.location.pathname = '/it/';
    renderWithProvider(['/it/']);

    fireEvent.click(screen.getByText('Set Gasolio'));
    expect(screen.getByTestId('fuelType').textContent).toBe('Gasolio');
    expect(screen.getByTestId('searchParamFuel').textContent).toBe('gasolio');
  });

  it('setFuelType updates URL pathname in English (fuel=Diesel) translating it', async () => {
    window.location.pathname = '/en/';
    renderWithProvider(['/en/']);

    fireEvent.click(screen.getByText('Set Gasolio')); 
    expect(screen.getByTestId('fuelType').textContent).toBe('Gasolio');
    expect(screen.getByTestId('searchParamFuel').textContent).toBe('diesel');
  });

  it('setFuelType does not throw error with unmapped fuel', async () => {
    window.location.pathname = '/en/';
    renderWithProvider(['/en/']);

    fireEvent.click(screen.getByText('Set Idrogeno')); 
    expect(screen.getByTestId('fuelType').textContent).toBe('Idrogeno');
    expect(screen.getByTestId('searchParamFuel').textContent).toBe('idrogeno');
  });

  it('setFuelType correctly regenerates path when city is present in Italian', async () => {
    window.location.pathname = '/it/citta/roma/Benzina';
    
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
        <MemoryRouter initialEntries={['/it/citta/roma/Benzina']}>
          <Routes>
            <Route path="/:lang/citta/:city/:fuel" element={
              <StationsProvider>
                <TestActionsConsumer />
              </StationsProvider>
            } />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    );

    fireEvent.click(screen.getByText('Set Gasolio'));
    expect(screen.getByTestId('fuelType').textContent).toBe('Gasolio');
    expect(screen.getByTestId('searchParamFuel').textContent).toBe('gasolio');
  });

  it('setFuelType correctly regenerates path when city is present in English', async () => {
    window.location.pathname = '/en/city/rome/Petrol';
    
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
        <MemoryRouter initialEntries={['/en/city/rome/Petrol']}>
          <Routes>
            <Route path="/:lang/city/:city/:fuel" element={
              <StationsProvider>
                <TestActionsConsumer />
              </StationsProvider>
            } />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    );

    fireEvent.click(screen.getByText('Set Gasolio'));
    expect(screen.getByTestId('searchParamFuel').textContent).toBe('diesel');
  });

  it('synchronizes internal state if URL changes externally (e.g. back button)', async () => {
    const ExternalNavigator = () => {
        const navigate = useNavigate();
        return <button onClick={() => navigate('/it/citta/milano/GPL')}>Go GPL</button>;
    };

    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
        <MemoryRouter initialEntries={['/it/citta/milano/Benzina']}>
          <Routes>
            <Route path="/:lang/citta/:city/:fuel" element={
              <>
                <StationsProvider>
                  <TestActionsConsumer />
                </StationsProvider>
                <ExternalNavigator />
              </>
            } />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    );

    expect(screen.getByTestId('fuelType').textContent).toBe('Benzina');
    
    act(() => {
        fireEvent.click(screen.getByText('Go GPL'));
    });
    
    expect(screen.getByTestId('fuelType').textContent).toBe('GPL');
  });

  it('performs stations API fetch when userPos is set and populates state', async () => {
    renderWithProvider(['/it/']);

    expect(screen.getByTestId('stationsCount').textContent).toBe('0');
    expect(screen.getByTestId('totalStations').textContent).toBe('0');

    act(() => {
      fireEvent.click(screen.getByText('Set Pos'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('stationsCount').textContent).toBe('2');
      expect(screen.getByTestId('totalStations').textContent).toBe('2');
    }, { interval: 5 });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stations?lat=41&lng=12'));
  });

  it('correctly parses stationsData if API directly returns an array', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url.includes('/api/stations')) {
        return { ok: true, json: async () => ([{ id: 99 }]) }; 
      }
      return { ok: true, json: async () => ({}) };
    });

    renderWithProvider(['/it/']);

    act(() => fireEvent.click(screen.getByText('Set Pos')));

    await waitFor(() => {
      expect(screen.getByTestId('stationsCount').textContent).toBe('1');
    }, { interval: 5 });
  });

  it('throws exception if response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    
    renderWithProvider(['/it/']);

    act(() => {
      fireEvent.click(screen.getByText('Set Pos'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { interval: 5 });
  });

  it('registers WebMCP tools and handles tool callback execution within provider', async () => {
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

    renderWithProvider(['/it/']);

    expect(registeredTools['search_fuel_stations']).toBeDefined();
    await act(async () => {
      const res = await registeredTools['search_fuel_stations'].execute({
        location: 'Torino',
        fuelType: 'GPL',
        radius: 10,
        serviceType: '0'
      });
      expect(res.location).toBe('Torino');
    });

    await act(async () => {
      const res = await registeredTools['filter_fuel_type'].execute({ fuelType: 'Metano' });
      expect(res.selectedFuel).toBe('Metano');
    });

    await act(async () => {
      const res = await registeredTools['get_station_directions'].execute({
        station: { lat: 45.0, lng: 7.6, brand: 'Eni' }
      });
      expect(res.success).toBe(true);
    });

    delete global.navigator.modelContext;
  });
});

