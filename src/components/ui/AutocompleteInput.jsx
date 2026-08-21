import { useEffect, useRef, useState } from 'react';

/**
 * Simple text autocomplete dropdown.
 * options: [{ id, label, subLabel?, raw? }]
 */
export default function AutocompleteInput({
  label,
  required = false,
  placeholder = '',
  value,
  displayValue,
  onChange,
  onSelect,
  onFocus,
  options = [],
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{required ? ' *' : ''}
        </label>
      )}
      <input
        type="text"
        value={displayValue ?? value ?? ''}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          onFocus?.();
        }}
        onChange={(e) => {
          onChange?.(e.target.value);
          setOpen(true);
        }}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none disabled:bg-gray-100"
        autoComplete="off"
      />

      {open && options.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-gray-100 last:border-b-0"
              onClick={() => {
                onSelect?.(opt);
                setOpen(false);
              }}
            >
              <div className="font-medium text-gray-800 text-sm">{opt.label}</div>
              {opt.subLabel && (
                <div className="text-xs text-gray-500 mt-0.5">{opt.subLabel}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
