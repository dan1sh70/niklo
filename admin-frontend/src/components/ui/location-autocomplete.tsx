/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search city or terminal...',
  required = false,
  className = '',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/bus/locations/autocomplete', {
          params: { query },
        });
        const data = res.data?.data || res.data || [];
        setOptions(Array.isArray(data) ? data : []);
      } catch {
        // Fallback default suggestions
        const defaults = ['Kolkata', 'Siliguri', 'Bangalore', 'Chennai', 'Ahmedabad', 'Diu', 'Mumbai', 'Delhi'];
        const matched = defaults
          .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
          .map((c, i) => ({ id: `loc-${i}`, name: c, type: 'city' }));
        setOptions(matched);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (cityName: string) => {
    setQuery(cityName);
    onChange(cityName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          required={required}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (options.length > 0) setIsOpen(true);
          }}
          className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold focus:bg-white ${className}`}
        />
        {loading && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto py-1">
          {options.map((item: any, i: number) => {
            const name = item.name || item.city || item;
            return (
              <button
                type="button"
                key={item.id || i}
                onClick={() => handleSelect(name)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{name}</span>
                {item.state && <span className="text-[10px] text-slate-400 font-normal">({item.state})</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
