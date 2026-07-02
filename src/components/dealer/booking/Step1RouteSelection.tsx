import { useMemo, useState } from 'react'
import { voyageList } from '@/mock/data'
import { ChevronDown } from 'lucide-react'

const depPorts = ['重庆', '宜昌', '武汉', '南京', '上海']
const arrPorts = ['宜昌', '重庆', '武汉', '南京']
const cabinTypes = ['标准间', '豪华套房', '总统套房']

type VoyageItem = (typeof voyageList)[number]
type VoyageCabin = VoyageItem['cabins'][number]

function formatRoomStock(count: number) {
  if (count <= 0) return '售罄'
  return count > 20 ? '充足' : `${count}间`
}

function getVoyageRoomStock(cabin: VoyageCabin) {
  if (cabin.status === '售罄') return 0
  return cabin.totalRooms > 45 ? 99 : Math.max(1, Math.ceil(cabin.remainBeds / Math.max(cabin.maxGuests, 1)))
}

export default function Step1RouteSelection({ onNext }: { onNext: () => void }) {
  const [searchParams, setSearchParams] = useState({
    depPort: '',
    arrPort: '',
    dateFrom: '',
    dateTo: '',
    ship: '',
    cabinType: [] as string[],
  })

  const [showCabinDropdown, setShowCabinDropdown] = useState(false)

  const toggleCabinType = (type: string) => {
    setSearchParams((prev) => ({
      ...prev,
      cabinType: prev.cabinType.includes(type) ? prev.cabinType.filter((c) => c !== type) : [...prev.cabinType, type],
    }))
  }

  const resetFilters = () => {
    setSearchParams({ depPort: '', arrPort: '', dateFrom: '', dateTo: '', ship: '', cabinType: [] })
  }

  const shipOptions = useMemo(
    () => Array.from(new Set(voyageList.map((voyage) => voyage.ship))),
    [],
  )

  const filteredVoyages = useMemo(() => {
    let list = [...voyageList]
    if (searchParams.depPort) list = list.filter((v) => v.route.startsWith(searchParams.depPort))
    if (searchParams.arrPort) list = list.filter((v) => v.route.endsWith(searchParams.arrPort))
    if (searchParams.dateFrom) list = list.filter((v) => v.date >= searchParams.dateFrom)
    if (searchParams.dateTo) list = list.filter((v) => v.date <= searchParams.dateTo)
    if (searchParams.ship) list = list.filter((v) => v.ship === searchParams.ship)

    if (searchParams.cabinType.length) {
      list = list.filter((v) => v.cabin && v.cabin.some((c: string) => searchParams.cabinType.includes(c)))
    }
    return list
  }, [searchParams])

  const roomTypes = useMemo(() => {
    const types = new Set<string>()
    filteredVoyages.forEach((voyage) => {
      voyage.cabins.forEach((cabin) => types.add(cabin.type))
    })
    return types.size > 0 ? [...types] : cabinTypes
  }, [filteredVoyages])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-800">航次检索</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4 px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">航线</span>
            <div className="flex items-center gap-2">
              <select
                className="h-9 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={searchParams.depPort}
                onChange={(e) => setSearchParams({ ...searchParams, depPort: e.target.value })}
              >
                <option value="">出发港</option>
                {depPorts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-400">→</span>
              <select
                className="h-9 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={searchParams.arrPort}
                onChange={(e) => setSearchParams({ ...searchParams, arrPort: e.target.value })}
              >
                <option value="">到达港</option>
                {arrPorts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">出发日期</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={searchParams.dateFrom}
                onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })}
              />
              <span className="text-sm text-gray-400">至</span>
              <input
                type="date"
                className="h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={searchParams.dateTo}
                onChange={(e) => setSearchParams({ ...searchParams, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">船舶</span>
            <select
              className="h-9 w-44 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              value={searchParams.ship}
              onChange={(e) => setSearchParams({ ...searchParams, ship: e.target.value })}
            >
              <option value="">全部船舶</option>
              {shipOptions.map((ship) => (
                <option key={ship} value={ship}>
                  {ship}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex flex-col gap-1">
            <span className="text-xs text-gray-500">舱位类型</span>
            <button
              type="button"
              className="flex h-9 min-w-[140px] items-center justify-between rounded-md border border-gray-300 px-3 text-sm"
              onClick={() => setShowCabinDropdown(!showCabinDropdown)}
            >
              {searchParams.cabinType.length ? (
                <span className="truncate text-gray-900">{searchParams.cabinType.join('、')}</span>
              ) : (
                <span className="text-gray-400">请选择</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
            </button>
            {showCabinDropdown && (
              <div className="absolute top-[60px] left-0 z-10 min-w-[160px] rounded-md border border-gray-200 bg-white p-2 shadow-lg">
                {cabinTypes.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 p-2 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={searchParams.cabinType.includes(c)}
                      onChange={() => toggleCabinType(c)}
                      className="rounded text-blue-600"
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50"
              onClick={resetFilters}
            >
              重置
            </button>
            <button type="button" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-800">可选航次</h3>
          <span className="text-xs text-gray-500">共 {filteredVoyages.length} 条</span>
        </div>

        {filteredVoyages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  {['开航日期', '游轮', ...roomTypes, '操作'].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap ${
                        roomTypes.includes(col) || col === '操作' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVoyages.map((voyage) => {
                  return (
                    <tr key={`${voyage.date}-${voyage.ship}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-top font-medium text-gray-900 whitespace-nowrap">
                        {voyage.date}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-900 whitespace-nowrap">
                        <div>{voyage.ship}</div>
                        <div className="mt-0.5 text-xs text-gray-400">{voyage.route} · {voyage.days}</div>
                      </td>
                      {roomTypes.map((roomType) => {
                        const cabin = voyage.cabins.find((item) => item.type === roomType)
                        const stock = cabin ? getVoyageRoomStock(cabin) : 0
                        return (
                          <td
                            key={roomType}
                            className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
                              stock <= 0 ? 'text-gray-400' : stock <= 3 ? 'text-amber-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {cabin ? formatRoomStock(stock) : '-'}
                          </td>
                        )
                      })}
                      <td className="w-24 p-2 align-middle">
                        <button
                          type="button"
                          onClick={() => onNext()}
                          className="flex h-full min-h-[88px] w-full items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-3 text-base font-medium text-blue-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-100"
                        >
                          选择
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-gray-400">未找到匹配航次，请调整筛选条件后重试</div>
        )}
      </div>
    </div>
  )
}
