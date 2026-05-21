import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

interface SelectFieldProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: 'default' | 'sm'
}

export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder = '请选择',
  className = '',
  disabled = false,
  size = 'default',
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const buttonSize = size === 'sm' ? 'h-8 rounded px-2 pr-8 text-xs' : 'h-10 rounded-lg px-3 pr-9 text-sm'
  const iconSize = size === 'sm' ? 'right-2 h-3.5 w-3.5' : 'right-3 h-4 w-4'

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`relative w-full border border-gray-300 bg-white text-left text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${buttonSize}`}
      >
        <span className={selected ? 'block truncate' : 'block truncate text-gray-400'}>{selected?.label || placeholder}</span>
        <ChevronDown className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-500 transition-transform ${open ? 'rotate-180' : ''} ${iconSize}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                type="button"
                key={option.value}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="h-4 w-4 text-gray-700" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface MultiCheckFieldProps<T extends string> {
  value: T[]
  options: SelectOption<T>[]
  onChange: (value: T[]) => void
  className?: string
}

export function MultiCheckField<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: MultiCheckFieldProps<T>) {
  const selectedValues = new Set(value)

  const toggleValue = (nextValue: T) => {
    if (selectedValues.has(nextValue)) {
      onChange(value.filter((item) => item !== nextValue))
      return
    }
    onChange([...value, nextValue])
  }

  return (
    <div className={`rounded-lg border border-gray-300 bg-white p-2 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-100 ${className}`}>
      <div className="grid gap-1">
        {options.map((option) => {
          const checked = selectedValues.has(option.value)
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${checked ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="h-4 w-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="truncate">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
