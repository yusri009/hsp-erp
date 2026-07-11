import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value)

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    const term = searchTerm.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(term))
  }, [options, searchTerm])

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions.length])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex]
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm('')
    setHighlightedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (opt) => {
    onChange(opt.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        handleOpen()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  // Highlight matching text
  const highlightMatch = (text, term) => {
    if (!term) return text
    const idx = text.toLowerCase().indexOf(term.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary-400 font-semibold">{text.slice(idx, idx + term.length)}</span>
        {text.slice(idx + term.length)}
      </>
    )
  }

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger / Display */}
        {!isOpen ? (
          <button
            type="button"
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="input-field text-left flex items-center justify-between gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className={selectedOption ? 'text-surface-100' : 'text-surface-500'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {value && (
                <span
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-surface-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-surface-400" />
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </div>
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="input-field pl-9"
              autoComplete="off"
            />
          </div>
        )}

        {/* Dropdown List */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-surface-800 border border-surface-600 rounded-lg shadow-2xl overflow-hidden animate-fade-in">
            <ul
              ref={listRef}
              className="max-h-56 overflow-y-auto py-1"
              role="listbox"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-surface-500 text-center">
                  No results found
                </li>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      px-3 py-2.5 text-sm cursor-pointer transition-colors
                      ${idx === highlightedIndex
                        ? 'bg-primary-500/10 text-primary-300'
                        : opt.value === value
                          ? 'bg-surface-700/50 text-surface-200'
                          : 'text-surface-300 hover:bg-surface-700/40'
                      }
                    `}
                  >
                    {highlightMatch(opt.label, searchTerm)}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchableSelect
