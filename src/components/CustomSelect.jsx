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
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const selectedOption = options.find((option) =>
    typeof option === 'object' ? option.value === value || option.id === value : option === value
  );
  const displayLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label || selectedOption.name || selectedOption.value
      : selectedOption
    : value || placeholder;

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm shadow-blue-950/[0.025] transition hover:border-blue-300 hover:bg-blue-50/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-slate-800 ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-blue-600 transition-transform duration-200 dark:text-blue-400 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={typeof displayLabel === 'string' ? displayLabel : 'Options'}
          className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-blue-100 bg-white/95 p-1.5 shadow-[0_18px_44px_-18px_rgba(30,64,175,.32)] ring-1 ring-slate-900/5 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40 dark:ring-white/10"
        >
          {options.map((option) => {
            const optionValue = typeof option === 'object'
              ? option.value !== undefined ? option.value : option.id
              : option;
            const optionLabel = typeof option === 'object'
              ? option.label || option.name || option.value
              : option;
            const isSelected = optionValue === value;

            return (
              <button
                key={optionValue}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  isSelected
                    ? 'bg-blue-700 font-semibold text-white shadow-sm shadow-blue-900/20'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="min-w-0 truncate">{optionLabel}</span>
                {isSelected && (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
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
