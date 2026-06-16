import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Info, Plus, Upload, Camera, Trash2, ChevronDown } from 'lucide-react'

const comboOptions = ['VIP餐厅', '岸上观光', '酒水套餐', 'WiFi套餐', 'SPA套餐', '摄影套餐']
const provinceList = ['北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '内蒙古', '香港', '澳门', '台湾', '其他']

export default function Step3TouristInfo({ roomData, onNext, onPrev }: { roomData: any, onNext: (data: any) => void, onPrev: () => void }) {
  const [touristList, setTouristList] = useState<any[]>([])
  const [comboOpenIndex, setComboOpenIndex] = useState<number | null>(null)
  
  const totalPaxFromRooms = useMemo(() => {
    let total = 0
    Object.entries(roomData || {}).forEach(([roomType, room]: [string, any]) => {
      if (!room || room.count <= 0) return
      if (roomType === '标准间') {
        total += room.count * 2
      } else {
        total += room.count * 1
      }
    })
    return total
  }, [roomData])

  useEffect(() => {
    if (totalPaxFromRooms > 0 && touristList.length === 0) {
      const list: any[] = []
      let idCounter = 1
      let roomSeqCounter = 1

      const stdCount = roomData['标准间']?.count || 0
      for (let i = 0; i < stdCount; i++) {
        const seq = String(roomSeqCounter++)
        for (let j = 0; j < 2; j++) {
          list.push(createTourist(idCounter++, '标准间', seq, j === 0 ? '男' : '女'))
        }
      }

      const suiteCount = roomData['豪华套房']?.count || 0
      for (let i = 0; i < suiteCount; i++) {
        list.push(createTourist(idCounter++, '豪华套房', String(roomSeqCounter++), '男', '单间'))
      }

      const presidentCount = roomData['总统套房']?.count || 0
      for (let i = 0; i < presidentCount; i++) {
        list.push(createTourist(idCounter++, '总统套房', String(roomSeqCounter++), '男', '单间'))
      }

      setTouristList(list)
    }
  }, [totalPaxFromRooms, roomData])

  function createTourist(id: number, roomType: string, roomSeq: string = '', gender: string = '男', stayType: string = '标准') {
    return {
      id, roomType, ageGroup: '成人', stayType, name: '', gender, age: '', nationality: '中国',
      province: '', idType: '身份证', idNum: '', phone: '', roomSeq, transfer: false, saleType: '正价',
      comboProducts: [], guestType: '内宾', paymentSource: '自付'
    }
  }

  const assignedRooms = useMemo(() => {
    const rooms = new Set(touristList.map(t => t.roomSeq).filter(Boolean))
    return rooms.size
  }, [touristList])

  const incompleteTip = useMemo(() => {
    if (touristList.length === 0) return '请先添加游客信息'
    const incomplete: number[] = []
    touristList.forEach((t, idx) => {
      if (!t.name || !t.name.trim()) incomplete.push(idx + 1)
      else if (!t.idNum || !t.idNum.trim()) incomplete.push(idx + 1)
    })
    if (incomplete.length > 0) return `第 ${incomplete.join('、')} 行信息未补全（姓名/证件号码必填）`
    return ''
  }, [touristList])

  const canProceed = touristList.length > 0 && incompleteTip === ''

  const addTouristRow = () => {
    setTouristList(prev => [...prev, createTourist(Date.now(), '标准间')])
  }

  const deleteTouristRow = (index: number) => {
    setTouristList(prev => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, field: string, value: any) => {
    setTouristList(prev => {
      const newList = [...prev]
      const t = { ...newList[index], [field]: value }
      if (field === 'ageGroup') {
        t.stayType = value === '成人' ? '标准' : value === '儿童' ? '儿童不占床' : '婴儿'
      }
      if (field === 'nationality') {
        t.guestType = (value === '中国' || !value) ? '内宾' : '外宾'
      }
      newList[index] = t
      return newList
    })
  }

  const toggleComboProduct = (index: number, product: string) => {
    setTouristList(prev => {
      const newList = [...prev]
      const t = { ...newList[index] }
      if (t.comboProducts.includes(product)) {
        t.comboProducts = t.comboProducts.filter((p: string) => p !== product)
      } else {
        t.comboProducts = [...t.comboProducts, product]
      }
      newList[index] = t
      return newList
    })
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-blue-500 rounded-full" />
        <h3 className="font-semibold text-gray-900">录入旅客名单</h3>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
        <Info className="w-5 h-5 shrink-0" />
        <span>录入所有游客信息，系统将自动分配同房序号。支持手动调整同房序号。姓名和证件号码为必填项。</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="h-9 px-4 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700 transition" onClick={addTouristRow}>
            <Plus className="w-4 h-4" /> 新增游客
          </button>
          <button className="h-9 px-4 bg-white border border-gray-300 text-gray-600 rounded-md text-sm flex items-center gap-1 hover:bg-gray-50 transition" onClick={() => alert('开发中')}>
            <Upload className="w-4 h-4" /> 批量导入
          </button>
          <button className="h-9 px-4 bg-white border border-gray-300 text-gray-600 rounded-md text-sm flex items-center gap-1 hover:bg-gray-50 transition" onClick={() => alert('开发中')}>
            <Camera className="w-4 h-4" /> OCR 识别
          </button>
        </div>
        <div className="text-sm text-gray-600">
          按占舱应录入 <strong className="text-blue-600 mx-1">{totalPaxFromRooms}</strong> 人 <span className="mx-2 text-gray-300">|</span>
          已填 <strong className="text-blue-600 mx-1">{touristList.length}</strong> 人 <span className="mx-2 text-gray-300">|</span>
          已分配房间 <strong className="text-blue-600 mx-1">{assignedRooms}</strong> 间
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10 text-center">序</th>
              <th className="px-3 py-3 w-28">房型 <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-20">年龄段</th>
              <th className="px-3 py-3 w-24">入住类型</th>
              <th className="px-3 py-3 w-24">姓名 <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-16">性别</th>
              <th className="px-3 py-3 w-16">年龄</th>
              <th className="px-3 py-3 w-32">证件号码 <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-28">手机号</th>
              <th className="px-3 py-3 w-16 text-center">同房</th>
              <th className="px-3 py-3 w-32">组合产品</th>
              <th className="px-3 py-3 w-12 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {touristList.map((t, idx) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2">
                  <select className="w-full h-8 border border-gray-300 rounded text-xs px-1 outline-none focus:border-blue-500" value={t.roomType} onChange={e => updateField(idx, 'roomType', e.target.value)}>
                    <option value="标准间">标准间</option>
                    <option value="豪华套房">豪华套房</option>
                    <option value="总统套房">总统套房</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select className="w-full h-8 border border-gray-300 rounded text-xs px-1 outline-none focus:border-blue-500" value={t.ageGroup} onChange={e => updateField(idx, 'ageGroup', e.target.value)}>
                    <option value="成人">成人</option>
                    <option value="儿童">儿童</option>
                    <option value="婴儿">婴儿</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select className="w-full h-8 border border-gray-300 rounded text-xs px-1 outline-none focus:border-blue-500" value={t.stayType} onChange={e => updateField(idx, 'stayType', e.target.value)}>
                    <option value="标准">标准</option>
                    <option value="单间">单间</option>
                    <option value="儿童不占床">儿童不占床</option>
                    <option value="加床">加床</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className="w-full h-8 border border-gray-300 rounded text-xs px-2 outline-none focus:border-blue-500" placeholder="姓名" value={t.name} onChange={e => updateField(idx, 'name', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <select className="w-full h-8 border border-gray-300 rounded text-xs px-1 outline-none focus:border-blue-500" value={t.gender} onChange={e => updateField(idx, 'gender', e.target.value)}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className="w-full h-8 border border-gray-300 rounded text-xs px-2 outline-none focus:border-blue-500 text-center" placeholder="年龄" value={t.age} onChange={e => updateField(idx, 'age', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input className="w-full h-8 border border-gray-300 rounded text-xs px-2 outline-none focus:border-blue-500" placeholder="证件号码" value={t.idNum} onChange={e => updateField(idx, 'idNum', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input className="w-full h-8 border border-gray-300 rounded text-xs px-2 outline-none focus:border-blue-500" placeholder="手机号" value={t.phone} onChange={e => updateField(idx, 'phone', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input className="w-full h-8 border border-gray-300 rounded text-xs px-2 outline-none focus:border-blue-500 text-center" placeholder="序号" value={t.roomSeq} onChange={e => updateField(idx, 'roomSeq', e.target.value)} />
                </td>
                <td className="px-3 py-2 relative">
                  <div className="h-8 border border-gray-300 rounded text-xs px-2 flex items-center justify-between cursor-pointer bg-white" onClick={() => setComboOpenIndex(comboOpenIndex === idx ? null : idx)}>
                    <span className="truncate max-w-[80px]">{t.comboProducts.length ? `已选${t.comboProducts.length}项` : <span className="text-gray-400">请选择</span>}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  {comboOpenIndex === idx && (
                    <div className="absolute top-10 right-0 w-40 bg-white border border-gray-200 shadow-lg rounded-md p-1 z-10" onMouseLeave={() => setComboOpenIndex(null)}>
                      {comboOptions.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                          <input type="checkbox" checked={t.comboProducts.includes(opt)} onChange={() => toggleComboProduct(idx, opt)} className="rounded" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button className="w-6 h-6 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 mx-auto" onClick={() => deleteTouristRow(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incompleteTip && (
        <div className="mt-3 text-right text-sm text-red-500 flex items-center justify-end gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          {incompleteTip}
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" onClick={onPrev}>
          ← 上一步：占舱
        </button>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-sm font-medium" onClick={() => onNext({ touristList })}>
            未实名下单
          </button>
          <button className={`px-6 py-2 rounded-md transition-colors shadow-sm font-medium ${canProceed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} disabled={!canProceed} onClick={() => onNext({ touristList })}>
            下一步：订单确认 →
          </button>
        </div>
      </div>
    </div>
  )
}
