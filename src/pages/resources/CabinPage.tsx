import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import { cabinShipOptions, initialCabinData, type CabinRecord } from '@/mock/cabinManagement'
import { loadHierarchicalDictOptions, type HierarchicalDictOption } from '@/utils/hierarchicalDict'

const shipFloorOptions: Record<string, string[]> = {
  长江壹号: ['2F', '3F', '4F', '5F'],
  长江叁号: ['2F', '3F', '4F', '5F'],
}

export default function CabinPage() {
  const [records, setRecords] = useState<CabinRecord[]>(initialCabinData)
  const [shipFilter, setShipFilter] = useState('all')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editCabinOpen, setEditCabinOpen] = useState(false)
  const [editCabin, setEditCabin] = useState<CabinRecord | null>(null)
  const [photoInput, setPhotoInput] = useState('')
  const [facilityInput, setFacilityInput] = useState('')
  const [facilityOptions, setFacilityOptions] = useState<HierarchicalDictOption[]>([])
  const pageSize = 10

  useEffect(() => {
    loadHierarchicalDictOptions('CABIN_FACILITY').then(setFacilityOptions)
  }, [])

  const facilityLabelMap = useMemo(
    () => new Map(facilityOptions.map((option) => [option.value, option.label])),
    [facilityOptions],
  )

  const getFacilityLabel = (value: string) => facilityLabelMap.get(value) || value

  const filteredData = useMemo(() => {
    if (appliedShipFilter === 'all') return records
    return records.filter((item) => item.shipName === appliedShipFilter)
  }, [appliedShipFilter, records])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page])

  const openEdit = (record: CabinRecord) => {
    setEditCabin({
      ...record,
      floors: [...(record.floors || [])],
      photos: [...(record.photos || [])],
      facilities: [...(record.facilities || [])],
    })
    setPhotoInput('')
    setFacilityInput('')
    setEditCabinOpen(true)
  }

  const addPhoto = () => {
    if (!editCabin || !photoInput.trim() || editCabin.photos.length >= 5) return
    setEditCabin({
      ...editCabin,
      photos: [...editCabin.photos, photoInput.trim()],
    })
    setPhotoInput('')
  }

  const removePhoto = (index: number) => {
    if (!editCabin) return
    setEditCabin({
      ...editCabin,
      photos: editCabin.photos.filter((_, photoIndex) => photoIndex !== index),
    })
  }

  const addFacility = () => {
    if (!editCabin || !facilityInput) return
    if (editCabin.facilities.includes(facilityInput)) return
    setEditCabin({
      ...editCabin,
      facilities: [...editCabin.facilities, facilityInput],
    })
    setFacilityInput('')
  }

  const removeFacility = (value: string) => {
    if (!editCabin) return
    setEditCabin({
      ...editCabin,
      facilities: editCabin.facilities.filter((item) => item !== value),
    })
  }

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '80px',
      render: (r: CabinRecord) => filteredData.findIndex((item) => item.id === r.id) + 1,
    },
    { key: 'shipName', title: '船舶', dataIndex: 'shipName' as keyof CabinRecord, width: '120px' },
    { key: 'cabinName', title: '船舱名称', dataIndex: 'cabinName' as keyof CabinRecord },
    {
      key: 'floors',
      title: '所在楼层',
      width: '140px',
      render: (record: CabinRecord) => record.floors?.length ? record.floors.join('、') : '-',
    },
    { key: 'photos', title: '照片', width: '90px', render: (record: CabinRecord) => `${record.photos?.length || 0} 张` },
    {
      key: 'facilities',
      title: '船舱设施',
      render: (record: CabinRecord) => {
        if (!record.facilities || record.facilities.length === 0) return '-'
        const labels = record.facilities.slice(0, 2).map(getFacilityLabel)
        const suffix = record.facilities.length > 2 ? ` 等${record.facilities.length}项` : ''
        return `${labels.join('、')}${suffix}`
      },
    },
    { key: 'cabinCount', title: '船舱数量', dataIndex: 'cabinCount' as keyof CabinRecord, width: '120px' },
    { key: 'guestCapacity', title: '客容量', dataIndex: 'guestCapacity' as keyof CabinRecord, width: '100px' },
    { key: 'bedCount', title: '床位数', dataIndex: 'bedCount' as keyof CabinRecord, width: '100px' },
    { key: 'sortNo', title: '排序号', dataIndex: 'sortNo' as keyof CabinRecord, width: '100px' },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof CabinRecord, width: '120px' },
    { key: 'updatedAt', title: '修改时间', dataIndex: 'updatedAt' as keyof CabinRecord, width: '180px' },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (record: CabinRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(record)}
            className="text-base text-blue-600 hover:text-blue-700"
          >
            编辑
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-base text-red-500 hover:text-red-600">删除</button>
          <button className="ml-3 text-sm text-gray-500 hover:text-gray-700">详情</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="船舱管理" />

      <SearchPanel
        onSearch={() => {
          setAppliedShipFilter(shipFilter)
          setPage(1)
        }}
        onReset={() => {
          setShipFilter('all')
          setAppliedShipFilter('all')
          setPage(1)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">船舶</label>
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value)}
            className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {cabinShipOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? '全部' : option}
              </option>
            ))}
          </select>
        </div>
      </SearchPanel>

      <DataTable
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: filteredData.length,
          onChange: setPage,
        }}
      />

      <FormDialog
        open={editCabinOpen}
        title="编辑船舱"
        width="max-w-2xl"
        onCancel={() => setEditCabinOpen(false)}
        onSubmit={() => {
          if (editCabin) {
            setRecords((prev) => prev.map((r) => (r.id === editCabin.id ? editCabin : r)))
          }
          setEditCabinOpen(false)
        }}
      >
        {editCabin && (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舶</label>
                  <input
                    value={editCabin.shipName}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舱名称</label>
                  <input
                    value={editCabin.cabinName}
                    onChange={(e) => setEditCabin({ ...editCabin, cabinName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">船舱数量</label>
                  <input
                    type="number"
                    value={editCabin.cabinCount}
                    onChange={(e) => setEditCabin({ ...editCabin, cabinCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">客容量</label>
                  <input
                    type="number"
                    value={editCabin.guestCapacity}
                    onChange={(e) => setEditCabin({ ...editCabin, guestCapacity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">床位数</label>
                  <input
                    type="number"
                    value={editCabin.bedCount}
                    onChange={(e) => setEditCabin({ ...editCabin, bedCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-2 block text-sm text-gray-700">所在楼层</label>
                  <div className="flex flex-wrap gap-2">
                    {(shipFloorOptions[editCabin.shipName] || []).map((floor) => {
                      const active = editCabin.floors.includes(floor)
                      return (
                        <button
                          key={floor}
                          type="button"
                          onClick={() =>
                            setEditCabin({
                              ...editCabin,
                              floors: active
                                ? editCabin.floors.filter((item) => item !== floor)
                                : [...editCabin.floors, floor].sort(),
                            })
                          }
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            active
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {floor}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">支持多选，表示该船舱定义可分布在多个楼层。</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">排序号</label>
                  <input
                    type="number"
                    value={editCabin.sortNo}
                    onChange={(e) => setEditCabin({ ...editCabin, sortNo: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">照片</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={photoInput}
                    onChange={(event) => setPhotoInput(event.target.value)}
                    placeholder="请输入照片 URL"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={addPhoto}
                    disabled={!photoInput.trim() || editCabin.photos.length >= 5}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {editCabin.photos.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-400">
                      暂无照片
                    </div>
                  ) : editCabin.photos.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img src={photo} alt={`船舱照片 ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">最多可维护 5 张照片，支持 URL 形式预览。</p>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">船舱设施</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={facilityInput}
                    onChange={(event) => setFacilityInput(event.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">请选择设施</option>
                    {facilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addFacility}
                    disabled={!facilityInput}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editCabin.facilities.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400">
                      暂未配置设施
                    </div>
                  ) : editCabin.facilities.map((facility) => (
                    <span
                      key={facility}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700"
                    >
                      {getFacilityLabel(facility)}
                      <button type="button" onClick={() => removeFacility(facility)} className="text-blue-500 hover:text-blue-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">船舱设施复用分级字典中的「船舱设施」分类型。</p>
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
