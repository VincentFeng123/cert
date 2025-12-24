import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'

interface CustomSelectOption {
  value: string
  label: string
  description?: string
}

interface CustomSelectProps {
  value: string
  options: CustomSelectOption[]
  onChange: (value: string) => void
}

const CustomSelect = ({ value, options, onChange }: CustomSelectProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeOption = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center justify-between gap-3 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors min-w-[180px]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">{activeOption?.label ?? value}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 animate-fadeIn p-1">
          <ul className="space-y-0.5" role="listbox">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm transition-all flex items-center justify-between gap-2 rounded-md ${
                    option.value === value
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <FontAwesomeIcon icon={faCheck} className="text-xs text-slate-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CustomSelect
