// FILE PATH: components/SearchableSelect.tsx
// Modal-Based Searchable Dropdown Component

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  sublabel?: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sublabel && option.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <>
      {/* Trigger Button */}
      <div className={className}>
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-left flex items-center justify-between ${
            disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white text-slate-900 hover:border-slate-400'
          }`}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <X
                size={16}
                className="text-slate-400 hover:text-slate-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown size={18} className="text-slate-400" />
          </div>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Select Option</h3>
              <button 
                onClick={handleClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                  placeholder="Type to search..."
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-slate-600 mt-2">
                  Found {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-400 mb-2">
                    <Search size={48} className="mx-auto opacity-50" />
                  </div>
                  <p className="text-slate-600 font-medium">No results found</p>
                  <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full px-4 py-3 text-left rounded-lg transition-all ${
                        option.value === value 
                          ? 'bg-teal-100 border-2 border-teal-500 text-teal-900' 
                          : 'hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-slate-900">{option.label}</div>
                      {option.sublabel && (
                        <div className="text-sm text-slate-500 mt-0.5">{option.sublabel}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchableSelect;
