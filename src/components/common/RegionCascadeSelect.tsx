import { regionOptions } from '@/mock/regionData'

interface RegionCascadeSelectProps {
  province: string
  city: string
  district: string
  onChange: (value: { province: string; city: string; district: string }) => void
  selectClassName?: string
  required?: boolean
  /** 允许只选到省或市，不强制选到区县 */
  allowPartial?: boolean
}

export default function RegionCascadeSelect({
  province,
  city,
  district,
  onChange,
  selectClassName = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500',
  required = false,
  allowPartial = false,
}: RegionCascadeSelectProps) {
  const provinceNode = regionOptions.find((item) => item.value === province)
  const cityOptions = provinceNode?.children ?? []
  const cityNode = cityOptions.find((item) => item.value === city)
  const districtOptions = cityNode?.children ?? []

  return (
    <div className="col-span-3 grid grid-cols-3 gap-4">
      <div>
        <label className="mb-1 block text-sm text-gray-700">
          省份 {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={province}
          onChange={(event) => {
            onChange({ province: event.target.value, city: '', district: '' })
          }}
          className={selectClassName}
        >
          <option value="">请选择省份</option>
          {regionOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">
          城市 {required && !allowPartial && <span className="text-red-500">*</span>}
          {allowPartial && <span className="text-gray-400">（选填）</span>}
        </label>
        <select
          value={city}
          disabled={!province}
          onChange={(event) => {
            onChange({ province, city: event.target.value, district: '' })
          }}
          className={`${selectClassName} disabled:cursor-not-allowed disabled:bg-gray-50`}
        >
          <option value="">请选择城市</option>
          {cityOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">
          区县
          {allowPartial && <span className="text-gray-400">（选填）</span>}
        </label>
        <select
          value={district}
          disabled={!city}
          onChange={(event) => {
            onChange({ province, city, district: event.target.value })
          }}
          className={`${selectClassName} disabled:cursor-not-allowed disabled:bg-gray-50`}
        >
          <option value="">请选择区县</option>
          {districtOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
