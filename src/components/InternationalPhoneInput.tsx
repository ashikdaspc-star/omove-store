import React, { useState, useEffect, useRef } from 'react';
import { Country, COUNTRIES, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
import { Search, ChevronDown, Check, MessageSquare } from 'lucide-react';

interface InternationalPhoneInputProps {
  value: string;
  onChange: (value: string, validation: { isValid: boolean; cleanNumber: string; e164: string; country: Country }) => void;
  touched: boolean;
  onBlur?: () => void;
  errorMessage?: string;
  disabled?: boolean;
  variant?: 'light' | 'dark';
}

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  value,
  onChange,
  touched,
  onBlur,
  errorMessage,
  disabled = false,
  variant = 'light'
}) => {
  const isDark = variant === 'dark';
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => getDefaultCountry());
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Re-run validation whenever value or selectedCountry changes
  useEffect(() => {
    const valResult = validatePhoneNumber(value, selectedCountry);
    onChange(value, { ...valResult, country: selectedCountry });
  }, [selectedCountry]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const validation = validatePhoneNumber(value, selectedCountry);
  const isComplete = validation.isValid;

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cleanQ = q.replace('+', '');
    const cleanDial = c.dialCode.replace('+', '');
    return (
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      cleanDial.includes(cleanQ)
    );
  });

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    const valResult = validatePhoneNumber(value, country);
    onChange(value, { ...valResult, country });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const valResult = validatePhoneNumber(inputVal, selectedCountry);
    onChange(inputVal, { ...valResult, country: selectedCountry });
  };

  return (
    <div className="space-y-1.5 font-sans relative" ref={dropdownRef}>
      <label className={`text-xs font-bold font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        <MessageSquare className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <span>WhatsApp Number <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>*</span></span>
      </label>

      {/* Main Composite Input Box */}
      <div
        className={`flex items-stretch rounded-2xl border transition-all duration-200 ${
          isDark
            ? `bg-slate-950 ${
                touched && !validation.isValid
                  ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30'
                  : isComplete
                  ? 'border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30'
                  : 'border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30'
              }`
            : `bg-slate-50 ${
                touched && !validation.isValid
                  ? 'border-rose-500 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
                  : isComplete
                  ? 'border-emerald-600 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20'
                  : 'border-slate-200 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20'
              }`
        }`}
      >
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select Country Code"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`flex items-center gap-1.5 px-3.5 py-3 rounded-l-2xl text-xs font-mono font-bold transition-colors shrink-0 select-none group focus:outline-none cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800/80 active:bg-slate-800 border-r border-slate-800/80 text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200/70 active:bg-slate-200 border-r border-slate-200 text-slate-900'
          }`}
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className={`font-bold tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
            {selectedCountry.dialCode}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
            } ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
          />
        </button>

        {/* Phone Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            type="tel"
            required
            disabled={disabled}
            placeholder={selectedCountry.placeholder || 'Enter WhatsApp number'}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            className={`w-full px-3.5 py-3 bg-transparent text-xs font-mono focus:outline-none tracking-wide ${
              isDark
                ? 'text-white placeholder-slate-500'
                : 'text-slate-900 placeholder-slate-400 font-medium'
            }`}
          />
          {isComplete && (
            <div className={`pr-3 animate-fadeIn shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 shadow-black/80'
            : 'bg-white border-slate-200 shadow-slate-400/20'
        }`}>
          {/* Search Box */}
          <div className={`p-2.5 border-b flex items-center gap-2 ${
            isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'
          }`}>
            <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries or dialing code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent text-xs focus:outline-none font-sans ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`text-[11px] px-1.5 py-0.5 rounded cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-200'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Country List */}
          <div className={`max-h-60 overflow-y-auto divide-y custom-scrollbar ${
            isDark ? 'divide-slate-800/40' : 'divide-slate-100'
          }`} role="listbox">
            {filteredCountries.length === 0 ? (
              <div className={`p-4 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No matching country found.
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.iso === country.iso && selectedCountry.dialCode === country.dialCode;
                return (
                  <button
                    key={`${country.iso}-${country.dialCode}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors text-xs cursor-pointer ${
                      isDark
                        ? isSelected
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'text-slate-200 hover:bg-slate-800/70'
                        : isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className={`text-[11px] ${
                        isSelected
                          ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold')
                          : (isDark ? 'text-slate-400' : 'text-slate-500')
                      }`}>
                        {country.dialCode}
                      </span>
                      {isSelected && <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Helper / Error Subtext */}
      {touched && !validation.isValid && (
        <p className={`text-[11px] font-mono animate-fadeIn ${isDark ? 'text-rose-400' : 'text-rose-600 font-semibold'}`}>
          {errorMessage || 'Please enter a valid WhatsApp number for the selected country.'}
        </p>
      )}
      {(!touched || validation.isValid) && (
        <p className={`text-[10px] font-mono leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
          Your order details and instant delivery information will be sent to this WhatsApp number.
        </p>
      )}
    </div>
  );
};
