import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Find currently selected label
  const selectedOption = options.find((opt) =>
    typeof opt === 'object' ? opt.value === value || opt.id === value : opt === value
  );

  const displayLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label || selectedOption.name || selectedOption.value
      : selectedOption
    : value || placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 ${buttonClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`ml-2 h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-blue-500' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white/95 p-1 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 scrollbar-thin">
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? (opt.value !== undefined ? opt.value : opt.id) : opt;
            const optLabel = typeof opt === 'object' ? opt.label || opt.name || opt.value : opt;
            const isSelected = optVal === value;

            return (
              <button
                key={optVal}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="truncate">{optLabel}</span>
                {isSelected && (
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
