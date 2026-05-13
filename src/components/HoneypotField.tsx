import React from 'react';

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
}

/**
 * A honeypot field that is hidden from real users but visible to bots.
 * If a bot fills this field, the form submission should be rejected.
 */
export function HoneypotField({ value, onChange, name = "website_url" }: HoneypotFieldProps) {
  return (
    <div 
      className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" 
      aria-hidden="true"
    >
      <label htmlFor={name}>Leave this field empty</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
