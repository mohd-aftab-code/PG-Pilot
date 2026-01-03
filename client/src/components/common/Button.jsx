import React from 'react';

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {
  const variants = {
    primary: 'bg-[#14B8A6] text-white hover:bg-[#2DD4BF] shadow-md hover:shadow-lg',
    secondary: 'bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] border border-primary/20',
    destructive: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 shadow-sm',
    outline: 'border border-primary/20 text-[#E5E7EB] hover:bg-[#0B0F14] hover:border-primary/40 bg-[#0F1720]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

