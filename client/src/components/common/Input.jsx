import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, error, className = '' }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-foreground text-sm font-medium mb-2">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2.5 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground transition-all ${error ? 'border-destructive focus:ring-destructive/20' : ''} ${className}`}
      />
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default Input;

