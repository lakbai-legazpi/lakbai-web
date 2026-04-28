'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { icons, Search, X, MapPin } from 'lucide-react';
import { Chapel } from '@/components/icons/Chapel';
import { Mosque } from '@/components/icons/Mosque';
import { Monument } from '@/components/icons/Monument';
import { Beach } from '@/components/icons/Beach';
import { cn } from '@/lib/cn';

const customIcons: Record<string, React.ElementType> = {
  Chapel,
  Mosque,
  Monument,
  Beach,
};

const customIconNames = Object.keys(customIcons);
// We will only use standard lucide icons that are valid React components.
// To avoid rendering issues, we will just use the keys of the `icons` object.
const lucideIconNames = Object.keys(icons).filter(name => typeof (icons as any)[name] === 'function' || typeof (icons as any)[name] === 'object');

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Resolve the current icon component
  let CurrentIcon: React.ElementType = MapPin;
  let isCustom = false;
  if (value) {
    if (value.startsWith('custom:')) {
      const customName = value.replace('custom:', '');
      if (customIcons[customName]) {
        CurrentIcon = customIcons[customName];
        isCustom = true;
      }
    } else if ((icons as any)[value]) {
      CurrentIcon = (icons as any)[value];
    }
  } else {
      // no value, defaults to MapPin but let's visually show it's empty
  }

  // Filter icons based on search
  const filteredCustomIcons = useMemo(() => {
    if (!search) return customIconNames;
    return customIconNames.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredLucideIcons = useMemo(() => {
    // limit results to prevent UI freezing if search is empty
    if (!search) return lucideIconNames.slice(0, 100); 
    return lucideIconNames.filter(name => name.toLowerCase().includes(search.toLowerCase())).slice(0, 100);
  }, [search]);

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <label className='text-text-main text-xs font-semibold'>
        Location Icon
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className='border-border flex items-center justify-between bg-background focus:border-primary-400 rounded-lg border px-3 py-2 text-sm outline-none transition w-full hover:bg-surface'
      >
        <div className='flex items-center gap-2'>
          <div className='flex h-5 w-5 items-center justify-center text-primary-500'>
            {value ? <CurrentIcon className='h-4 w-4' /> : <MapPin className='h-4 w-4 text-text-muted' />}
          </div>
          <span className={value ? 'text-text-main' : 'text-text-muted'}>
            {value ? (isCustom ? value.replace('custom:', '') : value) : 'Select an Icon...'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className='absolute top-full mt-1 z-50 flex max-h-[320px] w-[280px] flex-col rounded-xl border border-border bg-background shadow-xl'
        >
          {/* Search Bar */}
          <div className='flex items-center border-b border-border p-2'>
            <Search className='h-4 w-4 text-text-muted ml-1 mr-2 shrink-0' />
            <input 
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted"
            />
            {search && (
              <button onClick={() => setSearch('')} className='p-1 hover:bg-surface rounded-md text-text-muted transition-colors'>
                <X className='h-3 w-3' />
              </button>
            )}
          </div>

          {/* Icon Grid */}
          <div className='flex-1 overflow-y-auto p-2'>
            
            {/* Custom Icons Section */}
            {(filteredCustomIcons.length > 0 || !search) && (
              <div className='mb-3'>
                <p className='text-xs font-semibold text-text-muted mb-2 ml-1'>Custom Icons</p>
                <div className='grid grid-cols-5 gap-1'>
                  {filteredCustomIcons.map(name => {
                    const IconComp = customIcons[name];
                    const isSelected = value === `custom:${name}`;
                    return (
                      <button
                        key={`custom-${name}`}
                        onClick={() => {
                          onChange(`custom:${name}`);
                          setIsOpen(false);
                        }}
                        title={name}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
                          isSelected ? 'bg-primary-100 text-primary-600' : 'text-text-main hover:bg-surface-light hover:text-primary-500'
                        )}
                      >
                        <IconComp className='h-5 w-5' />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Standard Icons Section */}
            <div className='mb-2'>
              <div className='flex justify-between items-center mb-2 ml-1 pr-1'>
                 <p className='text-xs font-semibold text-text-muted'>Standard Icons</p>
                 {!search && <p className='text-[10px] text-text-muted'>Showing Top 100</p>}
              </div>
              <div className='grid grid-cols-5 gap-1'>
                {filteredLucideIcons.map(name => {
                  const IconComp = (icons as any)[name];
                  const isSelected = value === name;
                  return (
                    <button
                      key={`lucide-${name}`}
                      onClick={() => {
                        onChange(name);
                        setIsOpen(false);
                      }}
                      title={name}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
                        isSelected ? 'bg-primary-100 text-primary-600' : 'text-text-main hover:bg-surface-light hover:text-primary-500'
                      )}
                    >
                      <IconComp className='h-5 w-5' />
                    </button>
                  )
                })}
              </div>
              {filteredLucideIcons.length === 0 && (
                  <p className='text-center text-xs text-text-muted py-4'>No standard icons found.</p>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
