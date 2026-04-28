'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options: string[];
  onValueChange: (value: string) => void;
}

export function AutocompleteInput({ 
  options, 
  value, 
  onValueChange, 
  className,
  ...props 
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stringValue = typeof value === 'string' ? value : '';

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!stringValue) return options;
    return options.filter(opt => opt.toLowerCase().includes(stringValue.toLowerCase()));
  }, [options, stringValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className='relative w-full' ref={containerRef}>
      <input
        {...props}
        value={stringValue}
        onChange={(e) => {
          onValueChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={cn(
          'border-border text-text-main placeholder:text-text-muted bg-background focus:border-primary-400 rounded-md border px-2.5 py-1.5 text-xs outline-none transition w-full',
          className
        )}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className='absolute z-50 mt-1 max-h-[160px] w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg'>
          <ul className='py-1'>
            {filteredOptions.map((option, idx) => (
              <li key={`${option}-${idx}`}>
                <button
                  type="button"
                  className='w-full px-3 py-1.5 text-left text-xs text-text-main hover:bg-surface transition-colors'
                  onClick={() => {
                    onValueChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
