import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  min: number;
  max: number;
}

const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', min: 10, max: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', min: 10, max: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', min: 10, max: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', min: 10, max: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', min: 9, max: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', min: 9, max: 9 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', min: 9, max: 9 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', min: 9, max: 9 },
];

const inferCountry = () => {
  const locale = typeof navigator !== 'undefined' ? navigator.language.toUpperCase() : '';
  return COUNTRIES.find((country) => locale.includes(`-${country.code}`)) || COUNTRIES[0];
};

const digits = (value: string) => value.replace(/\D/g, '');

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required = false,
  label,
  placeholder = '812 345 6789',
  className = '',
}) => {
  const initialCountry = useMemo(() => {
    const match = COUNTRIES.find((country) => value.startsWith(country.dialCode));
    return match || inferCountry();
  }, []);
  const [country, setCountry] = useState(initialCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const localValue = value.startsWith(country.dialCode) ? value.slice(country.dialCode.length) : value.replace(/^\+/, '');
  const filteredCountries = COUNTRIES.filter((item) =>
    `${item.name} ${item.dialCode}`.toLowerCase().includes(search.toLowerCase()),
  );
  const isValid = !localValue || (digits(localValue).length >= country.min && digits(localValue).length <= country.max);

  useEffect(() => {
    const matchedCountry = COUNTRIES.find((item) => value.startsWith(item.dialCode));
    if (matchedCountry && matchedCountry.code !== country.code) setCountry(matchedCountry);
  }, [value, country.code]);

  const selectCountry = (nextCountry: Country) => {
    setCountry(nextCountry);
    setIsOpen(false);
    setSearch('');
    onChange(`${nextCountry.dialCode}${digits(localValue)}`);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && <label className="block text-zinc-400 mb-1">{label}</label>}
      <div className={`flex rounded-lg bg-zinc-900 border ${isValid ? 'border-zinc-700' : 'border-red-500'} focus-within:border-purple-500`}>
        <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex items-center gap-1.5 px-3 border-r border-zinc-700 text-sm shrink-0" aria-label="Select country code">
          <span>{country.flag}</span><span>{country.dialCode}</span><ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </button>
        <input
          type="tel"
          inputMode="tel"
          required={required}
          value={localValue}
          onChange={(event) => onChange(`${country.dialCode}${digits(event.target.value)}`)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-white outline-none"
          aria-invalid={!isValid}
        />
      </div>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-700 bg-[#18181e] p-2 shadow-2xl">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
            <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search country or dial code" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-8 pr-2 text-xs text-white outline-none focus:border-purple-500" />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredCountries.map((item) => (
              <button type="button" key={item.code} onClick={() => selectCountry(item)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800">
                <span className="text-base">{item.flag}</span><span className="flex-1">{item.name}</span><span className="text-zinc-500">{item.dialCode}</span>{item.code === country.code && <Check className="w-3.5 h-3.5 text-purple-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {!isValid && <p className="mt-1 text-[10px] text-red-400">Enter a valid {country.name} phone number.</p>}
    </div>
  );
};
