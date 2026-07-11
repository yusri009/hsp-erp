import { ChevronDown } from 'lucide-react'

function FilterDropdown({ label, value, onChange, options, placeholder = 'All', disabled = false, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="input-field appearance-none pr-9 cursor-pointer disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
      </div>
    </div>
  )
}

export default FilterDropdown
