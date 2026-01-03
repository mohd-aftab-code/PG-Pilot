import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', closeOnOutsideClick = true }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleBackdropClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80 backdrop-blur-sm p-3 sm:p-4" onClick={handleBackdropClick}>
      <div
        className={`bg-[#0F1720] rounded-lg shadow-xl border border-primary/10 ${sizeClasses[size]} w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-primary/10 bg-[#0B0F14] sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-[#E5E7EB] pr-2 truncate">{title}</h2>
          <button
            onClick={onClose}
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

