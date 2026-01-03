import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, error, className = '' }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[#E5E7EB] text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] placeholder:text-[#9CA3AF] text-sm transition-all ${error ? 'border-red-500/50 focus:ring-red-500/20' : ''} ${className}`}
      />
      {error && <p className="mt-1.5 text-xs sm:text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default Input;

