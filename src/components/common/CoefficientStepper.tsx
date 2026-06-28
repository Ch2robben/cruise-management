interface CoefficientStepperProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  label?: string
}

export default function CoefficientStepper({
  value,
  onChange,
  step = 0.1,
  min = 0,
  label,
}: CoefficientStepperProps) {
  const bump = (delta: number) => {
    onChange(Math.max(min, Math.round((value + delta) * 100) / 100))
  }

  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex items-center rounded border border-gray-300 bg-white">
        <button
          type="button"
          onClick={() => bump(-step)}
          className="px-1.5 py-0.5 text-sm text-gray-500 hover:bg-gray-50"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-12 border-x border-gray-300 py-0.5 text-center text-xs font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => bump(step)}
          className="px-1.5 py-0.5 text-sm text-gray-500 hover:bg-gray-50"
        >
          +
        </button>
      </div>
      {label && <span className="whitespace-nowrap text-xs font-mono text-gray-600">{label}</span>}
    </div>
  )
}
