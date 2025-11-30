import React, { useState, useRef, useEffect } from 'react';
import { BiSearch, BiChevronDown, BiX } from 'react-icons/bi';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Search and select...",
    label,
    required = false,
    disabled = false,
    getOptionLabel = (option) => option.label || option.title || option.name,
    getOptionValue = (option) => option.value || option.id || option.proposalID,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter((option) => {
        const label = getOptionLabel(option).toLowerCase();
        const search = searchTerm.toLowerCase();
        return label.includes(search);
    });

    // Get selected option
    const selectedOption = options.find(
        (option) => getOptionValue(option) === value
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(getOptionValue(option));
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;
        }
    };

    return (
        <div className="mb-6">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div ref={wrapperRef} className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
                        w-full px-3 py-2 border border-gray-300 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-red-500
                        cursor-pointer bg-white
                        flex items-center justify-between
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedOption
                            ? getOptionLabel(selectedOption)
                            : placeholder}
                    </span>
                    <div className="flex items-center gap-2">
                        {value && !disabled && (
                            <BiX
                                onClick={handleClear}
                                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                            />
                        )}
                        <BiChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                                isOpen ? 'transform rotate-180' : ''
                            }`}
                        />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setHighlightedIndex(-1);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search projects..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No projects found
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const optionValue = getOptionValue(option);
                                    const optionLabel = getOptionLabel(option);
                                    const isSelected = optionValue === value;
                                    const isHighlighted = index === highlightedIndex;

                                    return (
                                        <div
                                            key={optionValue}
                                            onClick={() => handleSelect(option)}
                                            onMouseEnter={() =>
                                                setHighlightedIndex(index)
                                            }
                                            className={`
                                                px-4 py-2 cursor-pointer text-sm
                                                ${isSelected ? 'bg-red-50 text-red-700 font-medium' : ''}
                                                ${isHighlighted && !isSelected ? 'bg-gray-100' : ''}
                                                ${!isSelected && !isHighlighted ? 'hover:bg-gray-50' : ''}
                                            `}
                                        >
                                            {optionLabel}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;

