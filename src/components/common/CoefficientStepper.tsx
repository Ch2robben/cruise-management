interface CoefficientStepperProps {
  value: number
  onChange: (value: number) => void
}

export default function CoefficientStepper({
  value,
  onChange,
}: CoefficientStepperProps) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : ''}
      onChange={(event) => {
        const raw = event.target.value.trim()
        if (raw === '' || raw === '-' || raw === '.') {
          onChange(0)
          return
        }
        const parsed = Number(raw)
        onChange(Number.isFinite(parsed) ? parsed : 0)
      }}
      className="w-12 rounded border border-gray-300 px-1.5 py-0.5 text-center text-xs font-mono"
    />
  )
}
