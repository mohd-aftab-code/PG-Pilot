import React from 'react';

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-accent shadow-sm hover:shadow',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm',
    outline: 'border border-border text-foreground hover:bg-secondary hover:border-primary/50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

