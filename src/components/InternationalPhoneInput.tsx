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
}

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  value,
  onChange,
  touched,
  onBlur,
  errorMessage,
  disabled = false
}) => {
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
  const hasError = touched && !validation.isValid && value.length > 0;
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
      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span>WhatsApp Number *</span>
      </label>

      {/* Main Composite Input Box */}
      <div
        className={`flex items-stretch rounded-2xl bg-slate-950 border transition-all duration-200 ${
          touched && !validation.isValid
            ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30'
            : isComplete
            ? 'border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30'
            : 'border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30'
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
          className="flex items-center gap-1.5 px-3 py-3 rounded-l-2xl bg-slate-900/80 hover:bg-slate-800/80 active:bg-slate-800 border-r border-slate-800/80 text-xs font-mono font-bold text-slate-200 transition-colors shrink-0 select-none group focus:outline-none"
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-slate-300 font-semibold tracking-tight">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
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
            className="w-full px-3.5 py-3 bg-transparent text-xs text-white placeholder-slate-500 font-mono focus:outline-none tracking-wide"
          />
          {isComplete && (
            <div className="pr-3 text-emerald-400 animate-fadeIn shrink-0">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries or dialing code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar" role="listbox">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
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
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-cyan-950/60 text-cyan-300 font-bold'
                        : 'text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className={`text-[11px] ${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                        {country.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
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
        <p className="text-[11px] text-rose-400 font-mono animate-fadeIn">
          {errorMessage || 'Please enter a valid WhatsApp number for the selected country.'}
        </p>
      )}
      {(!touched || validation.isValid) && (
        <p className="text-[10px] text-slate-400 font-mono leading-tight">
          Your order details and instant delivery information will be sent to this WhatsApp number.
        </p>
      )}
    </div>
  );
};
