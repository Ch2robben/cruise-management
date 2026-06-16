import React, { useState, useMemo } from 'react'
import { voyageList } from '@/mock/data'
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

const depPorts = ['重庆', '宜昌', '武汉', '南京', '上海']
const arrPorts = ['宜昌', '重庆', '武汉', '南京']
const cabinTypes = ['标准间', '豪华套房', '总统套房']

export default function Step1RouteSelection({ onNext }: { onNext: () => void }) {
  const [searchParams, setSearchParams] = useState({
    depPort: '', arrPort: '', dateFrom: '', dateTo: '', priceMin: '', priceMax: '', cabinType: [] as string[]
  })
  
  const [selectedVoyage, setSelectedVoyage] = useState<any>(null)
  const [expandedVoyage, setExpandedVoyage] = useState<string | null>(null)
  const [showCabinDropdown, setShowCabinDropdown] = useState(false)

  const toggleCabinType = (type: string) => {
    setSearchParams(prev => ({
      ...prev,
      cabinType: prev.cabinType.includes(type) ? prev.cabinType.filter(c => c !== type) : [...prev.cabinType, type]
    }))
  }

  const resetFilters = () => {
    setSearchParams({ depPort: '', arrPort: '', dateFrom: '', dateTo: '', priceMin: '', priceMax: '', cabinType: [] })
    setSelectedVoyage(null)
  }

  const filteredVoyages = useMemo(() => {
    let list = [...voyageList]
    if (searchParams.depPort) list = list.filter(v => v.route.startsWith(searchParams.depPort))
    if (searchParams.arrPort) list = list.filter(v => v.route.endsWith(searchParams.arrPort))
    if (searchParams.dateFrom) list = list.filter(v => v.date >= searchParams.dateFrom)
    if (searchParams.dateTo) list = list.filter(v => v.date <= searchParams.dateTo)
    
    const pMin = Number(searchParams.priceMin) || 0
    const pMax = Number(searchParams.priceMax) || Infinity
    list = list.filter(v => Number(v.price) >= pMin && Number(v.price) <= pMax)
    
    if (searchParams.cabinType.length) {
      list = list.filter(v => v.cabin && v.cabin.some((c: string) => searchParams.cabinType.includes(c)))
    }
    return list
  }, [searchParams])

  return (
    <div>
      {/* Search Card */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          <h3 className="font-semibold text-gray-900">智能检索</h3>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">航线</span>
            <div className="flex items-center gap-2">
              <select className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none w-28" value={searchParams.depPort} onChange={e => setSearchParams({...searchParams, depPort: e.target.value})}>
                <option value="">出发港</option>
                {depPorts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="text-blue-500 font-bold">→</span>
              <select className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none w-28" value={searchParams.arrPort} onChange={e => setSearchParams({...searchParams, arrPort: e.target.value})}>
                <option value="">到达港</option>
                {arrPorts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">出发日期</span>
            <div className="flex items-center gap-2">
              <input type="date" className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none" value={searchParams.dateFrom} onChange={e => setSearchParams({...searchParams, dateFrom: e.target.value})} />
              <span className="text-gray-400 text-sm">至</span>
              <input type="date" className="h-9 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none" value={searchParams.dateTo} onChange={e => setSearchParams({...searchParams, dateTo: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">价格区间</span>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="最低价" className="h-9 w-24 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none" value={searchParams.priceMin} onChange={e => setSearchParams({...searchParams, priceMin: e.target.value})} />
              <span className="text-gray-400 text-sm">—</span>
              <input type="number" placeholder="最高价" className="h-9 w-24 border border-gray-300 rounded-md px-3 text-sm focus:border-blue-500 outline-none" value={searchParams.priceMax} onChange={e => setSearchParams({...searchParams, priceMax: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1 relative">
            <span className="text-xs text-gray-500 font-medium">舱位类型</span>
            <div className="h-9 border border-gray-300 rounded-md px-3 text-sm flex items-center justify-between min-w-[140px] cursor-pointer" onClick={() => setShowCabinDropdown(!showCabinDropdown)}>
              {searchParams.cabinType.length ? <span className="text-blue-600">{searchParams.cabinType.join('、')}</span> : <span className="text-gray-400">请选择</span>}
              <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
            </div>
            {showCabinDropdown && (
              <div className="absolute top-[60px] left-0 bg-white border border-gray-200 shadow-lg rounded-md p-2 z-10 min-w-[160px]">
                {cabinTypes.map(c => (
                  <label key={c} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={searchParams.cabinType.includes(c)} onChange={() => toggleCabinType(c)} className="rounded text-blue-600" />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <button className="h-9 px-4 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700 transition"><Search className="w-4 h-4" /> 搜索</button>
            <button className="h-9 px-4 bg-white border border-gray-300 text-gray-600 rounded-md text-sm flex items-center gap-1 hover:bg-gray-50 transition" onClick={resetFilters}><RotateCcw className="w-4 h-4" /> 重置</button>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <h3 className="font-semibold text-gray-900">可选航次</h3>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">共{filteredVoyages.length}个航次</span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredVoyages.length > 0 ? filteredVoyages.map(v => {
            const isSelected = selectedVoyage?.date === v.date && selectedVoyage?.ship === v.ship
            const isExpanded = expandedVoyage === v.date + v.ship
            return (
              <div key={v.date + v.ship} className={`border-2 rounded-lg transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-center p-4 cursor-pointer" onClick={() => setSelectedVoyage(v)}>
                  <div className="w-24 text-center shrink-0">
                    <div className="text-xl font-bold text-blue-600">{v.date.substring(5).replace('-', '/')}</div>
                    <div className="text-xs text-gray-400 mt-1">{v.date.substring(0,4)}</div>
                  </div>
                  <div className="flex-1 min-w-0 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-bold text-gray-900">{v.ship}</h4>
                      {v.hot && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm">热门</span>}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{v.route}</span> <span className="text-gray-300">|</span> <span>{v.days}</span> <span className="text-gray-300">|</span> <span>{v.deck}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {v.cabin.map((c: string) => <span key={c} className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{c}</span>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 min-w-[120px] px-4">
                    <div className="text-[11px] text-gray-500">起售价/人</div>
                    <div className="text-2xl font-bold text-red-500 leading-tight">¥{v.price}</div>
                    <div className="text-xs text-green-600 mt-1">标间{v.stock.std}间 · 套房{v.stock.suite}间</div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center border-l border-gray-100 pl-4">
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition" onClick={(e) => { e.stopPropagation(); setExpandedVoyage(isExpanded ? null : v.date + v.ship) }}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-200">
                          <th className="pb-2 font-medium">舱位类型</th>
                          <th className="pb-2 font-medium">床型</th>
                          <th className="pb-2 font-medium text-center">可加床</th>
                          <th className="pb-2 font-medium text-center">剩余床位</th>
                          <th className="pb-2 font-medium text-center">最大容客</th>
                          <th className="pb-2 font-medium text-center">状态</th>
                          <th className="pb-2 font-medium">面积</th>
                          <th className="pb-2 font-medium text-right">价格</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {v.cabins.map((c: any) => (
                          <tr key={c.type} className={c.status === '售罄' ? 'opacity-50' : ''}>
                            <td className="py-2 font-semibold text-gray-800">{c.type}</td>
                            <td className="py-2 text-gray-600">{c.bedType}</td>
                            <td className="py-2 text-gray-600 text-center">{c.extraBed}</td>
                            <td className={`py-2 text-center font-medium ${c.remainBeds < 10 ? 'text-red-500' : 'text-gray-600'}`}>{c.remainBeds > 30 ? '>30' : c.remainBeds}</td>
                            <td className="py-2 text-gray-600 text-center">{c.maxGuests}</td>
                            <td className="py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${c.status === '开放' ? 'bg-green-100 text-green-600' : c.status === '紧张' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-2 text-gray-600">{c.roomArea}</td>
                            <td className="py-2 text-right font-semibold text-blue-600">¥{c.price.toLocaleString()}起</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="py-12 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>未找到匹配航次，请尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button 
          className={`px-8 py-2.5 rounded-md font-medium text-sm transition-colors ${selectedVoyage ? 'bg-blue-600 text-white hover:bg-blue-700 shadow' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          onClick={() => selectedVoyage && onNext()}
          disabled={!selectedVoyage}
        >
          下一步：房型配置 →
        </button>
      </div>
    </div>
  )
}
