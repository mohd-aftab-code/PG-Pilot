import React, { useState, useRef, useEffect } from 'react';

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  displayKey = "name",
  valueKey = "id",
  required = false,
  disabled = false,
  className = "",
  customDisplay = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => {
        const displayText = customDisplay ? customDisplay(option) : String(option[displayKey]);
        return displayText.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options, displayKey, customDisplay]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt[valueKey] === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption
            ? (customDisplay ? customDisplay(selectedOption) : selectedOption[displayKey])
            : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option[valueKey]}
                  onClick={() => {
                    onChange(option[valueKey]);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {customDisplay ? customDisplay(option) : option[displayKey]}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

