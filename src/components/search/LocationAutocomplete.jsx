import { useRef, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';

const SuggestionItem = memo(function SuggestionItem({ suggestion, onSuggestionClick }) {
    const handleClick = useCallback(() => onSuggestionClick(suggestion), [onSuggestionClick, suggestion]);
    return (
        <li>
            <button
                type="button"
                onClick={handleClick}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm sm:text-base text-slate-800 dark:text-slate-200 border-b last:border-b-0 border-slate-200 dark:border-slate-600 truncate"
            >
                {suggestion.display_name}
            </button>
        </li>
    );
});

export default function LocationAutocomplete({ 
    value, 
    onChange, 
    onSearch, 
    suggestions, 
    showSuggestions, 
    setShowSuggestions, 
    onSuggestionClick 
}) {
    const { t } = useTranslation();
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowSuggestions]);

    const handleFocus = useCallback(() => setShowSuggestions(suggestions.length > 0), [setShowSuggestions, suggestions.length]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') onSearch();
    }, [onSearch]);

    return (
        <div className="grow relative" ref={wrapperRef}>
            <label htmlFor="location-input" className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('lbl_location')}
            </label>
            <input 
                id="location-input"
                name="location"
                type="text" 
                value={value} 
                onChange={onChange} 
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={t('ph_location')} 
                toolparamdescription="Comune, indirizzo o CAP italiano (es. Roma, Milano, Napoli, Firenze)"
                className="input-field"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                        <SuggestionItem key={s.place_id} suggestion={s} onSuggestionClick={onSuggestionClick} />
                    ))}
                </ul>
            )}
        </div>
    );
}
