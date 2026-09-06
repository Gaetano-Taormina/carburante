import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchPanel from '../../../src/components/SearchPanel';
import { BrowserRouter } from 'react-router-dom';
import * as StationsContext from '../../../src/context/StationsContext';

// Mock delle traduzioni
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        dyn_found: 'Trovati',
        dyn_stations: 'distributori.',
        status_ready: 'I dati sono pronti.'
      };
      return translations[key] || key;
    }
  })
}));

// Mock dei componenti figli per isolare il test su SearchPanel
vi.mock('../../../src/components/search/LocationInput', () => ({
  default: () => <div data-testid="location-input-mock">Input</div>
}));
vi.mock('../../../src/components/search/Filters', () => ({
  default: () => <div data-testid="filters-mock">Filtri</div>
}));

describe('SearchPanel Component - Test Comportamentale', () => {
  it('mostra il messaggio "I dati sono pronti." quando non ci sono stazioni', () => {
    vi.spyOn(StationsContext, 'useStations').mockReturnValue({
      stations: [],
      totalStations: 0
    });

    render(
      <BrowserRouter>
        <SearchPanel />
      </BrowserRouter>
    );

    expect(screen.getByTestId('location-input-mock')).toBeInTheDocument();
    expect(screen.getByTestId('filters-mock')).toBeInTheDocument();
    expect(screen.getByText('I dati sono pronti.')).toBeInTheDocument();
  });

  it('mostra il numero di stazioni trovate se la ricerca produce risultati', () => {
    vi.spyOn(StationsContext, 'useStations').mockReturnValue({
      stations: [{ id: 1 }, { id: 2 }, { id: 3 }],
      totalStations: 10
    });

    render(
      <BrowserRouter>
        <SearchPanel />
      </BrowserRouter>
    );

    expect(screen.getByText(/Trovati/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/su 10/i)).toBeInTheDocument();
    expect(screen.getByText(/distributori/i)).toBeInTheDocument();
  });

  it('non mostra "su X" se tutte le stazioni sono visualizzate', () => {
    vi.spyOn(StationsContext, 'useStations').mockReturnValue({
      stations: [{ id: 1 }, { id: 2 }],
      totalStations: 2
    });

    render(
      <BrowserRouter>
        <SearchPanel />
      </BrowserRouter>
    );

    expect(screen.getByText(/Trovati/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText(/su/i)).not.toBeInTheDocument();
  });

  it('previene il submit standard del form', () => {
    vi.spyOn(StationsContext, 'useStations').mockReturnValue({
      stations: [],
      totalStations: 0
    });

    render(
      <BrowserRouter>
        <SearchPanel />
      </BrowserRouter>
    );

    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('toolname', 'search_fuel_stations');
    fireEvent.submit(form);
  });
});
