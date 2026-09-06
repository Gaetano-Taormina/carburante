
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useStations } from '../../context/StationsContext';

export default function Filters() {
    const { t } = useTranslation();
    const { radius, setRadius, fuelType, setFuelType, serviceType, setServiceType } = useStations();

    const handleRadiusChange = useCallback((e) => setRadius(Number(e.target.value)), [setRadius]);
    const handleFuelChange = useCallback((e) => setFuelType(e.target.value), [setFuelType]);
    const handleServiceChange = useCallback((e) => setServiceType(e.target.value), [setServiceType]);

    return (
        <div className="w-full grid grid-cols-3 md:col-span-3 gap-2 sm:gap-4">
            <div>
                <label htmlFor="radius-select" className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">{t('lbl_radius')}</label>
                <select id="radius-select" name="radius" value={radius} onChange={handleRadiusChange} toolparamdescription="Raggio di ricerca in km (3, 5, 10, 20)" className="select-field">
                    <option value="3">3 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                </select>
            </div>

            <div>
                <label htmlFor="fuel-select" className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">{t('lbl_fuel')}</label>
                <select id="fuel-select" name="fuelType" value={fuelType} onChange={handleFuelChange} toolparamdescription="Tipo di carburante: Benzina, Gasolio, GPL, Metano, HVO, GNL" className="select-field">
                    <option value="Benzina">{t('fuel_gasoline')}</option>
                    <option value="Gasolio">{t('fuel_diesel')}</option>
                    <option value="GPL">{t('fuel_lpg')}</option>
                    <option value="Metano">{t('fuel_methane')}</option>
                    <option value="HVO">{t('fuel_hvo')}</option>
                    <option value="GNL">{t('fuel_gnl')}</option>
                </select>
            </div>

            <div>
                <label htmlFor="service-select" className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">{t('lbl_service')}</label>
                <select id="service-select" name="serviceType" value={serviceType} onChange={handleServiceChange} toolparamdescription="Modalità di servizio: 1 (Self), 0 (Servito), entrambi" className="select-field">
                    <option value="1">{t('service_self')}</option>
                    <option value="0">{t('service_served')}</option>
                    <option value="entrambi">{t('service_both')}</option>
                </select>
            </div>
        </div>
    );
}
