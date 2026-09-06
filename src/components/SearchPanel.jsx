
import { useTranslation } from 'react-i18next';
import { useStations } from '../context/StationsContext';
import LocationInput from './search/LocationInput';
import Filters from './search/Filters';
import { useMemo, useCallback } from 'react';

export default function SearchPanel() {
    const { t } = useTranslation();
    const { stations, totalStations } = useStations();
    const statusReadyProps = useMemo(() => ({ __html: t('status_ready') }), [t]);
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
    }, []);

    return (
        <search className="card-panel">
            <form 
                aria-label="Cerca distributori carburante"
                toolname="search_fuel_stations"
                tooldescription="Cerca i prezzi dei distributori di carburante più economici in Italia per posizione, raggio e tipo di carburante"
                onSubmit={handleFormSubmit}
            >
                <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-6 gap-3 sm:gap-4 items-end">
                    <LocationInput />
                    <Filters />
                </div>
                
                <div className="max-w-7xl mx-auto mt-2 sm:mt-4 text-[10px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center sm:text-left">
                    {stations && stations.length > 0 ? (
                        <span>{t('dyn_found')} <strong className="text-blue-700 dark:text-blue-400 text-base">{stations.length}</strong>{totalStations > stations.length ? <span className="text-sm font-normal text-slate-600 dark:text-slate-300"> (su {totalStations})</span> : ''} {t('dyn_stations')}</span>
                    ) : (
                        <span dangerouslySetInnerHTML={statusReadyProps} />
                    )}
                </div>
            </form>
        </search>
    );
}
