import React, { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', closeOnOutsideClick = true, position = 'right' }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleBackdropClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      setIsAnimating(false);
      setTimeout(() => onClose(), 300); // Wait for animation to complete
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300); // Wait for animation to complete
  };

  // Right side slide-in modal
  if (position === 'right') {
    return (
      <div 
        className={`fixed inset-0 z-50 bg-[#0B0F14]/80 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`fixed right-0 top-0 h-full bg-[#0F1720] shadow-xl border-l border-primary/10 ${sizeClasses[size]} w-full sm:w-auto min-w-[90vw] sm:min-w-[500px] max-w-[90vw] sm:max-w-[600px] transform transition-transform duration-300 ease-out ${
            isAnimating ? 'translate-x-0' : 'translate-x-full'
          } overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-primary/10 bg-[#0B0F14] sticky top-0 z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-[#E5E7EB] pr-2 truncate">{title}</h2>
            <button
              onClick={handleClose}
              className="text-[#9CA3AF] hover:text-[#E5E7EB] text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-[#0F1720] rounded transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    );
  }

  // Center modal (default)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80 backdrop-blur-sm p-3 sm:p-4" onClick={handleBackdropClick}>
      <div
        className={`bg-[#0F1720] rounded-lg shadow-xl border border-primary/10 ${sizeClasses[size]} w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-primary/10 bg-[#0B0F14] sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-[#E5E7EB] pr-2 truncate">{title}</h2>
          <button
            onClick={handleClose}
            className="text-[#9CA3AF] hover:text-[#E5E7EB] text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-[#0F1720] rounded transition-colors flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

