import { useMemo, useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import { cabinShipOptions, initialCabinData, type CabinRecord } from '@/mock/cabinManagement'

export default function CabinPage() {
  const [records, setRecords] = useState<CabinRecord[]>(initialCabinData)
  const [shipFilter, setShipFilter] = useState('all')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editCabinOpen, setEditCabinOpen] = useState(false)
  const [editCabin, setEditCabin] = useState<CabinRecord | null>(null)
  const pageSize = 10

  const filteredData = useMemo(() => {
    if (appliedShipFilter === 'all') return records
    return records.filter((item) => item.shipName === appliedShipFilter)
  }, [appliedShipFilter, records])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page])

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '80px',
      render: (r: CabinRecord) => filteredData.findIndex((item) => item.id === r.id) + 1,
    },
    { key: 'shipName', title: '船舶', dataIndex: 'shipName' as keyof CabinRecord, width: '120px' },
    { key: 'cabinName', title: '船舱名称', dataIndex: 'cabinName' as keyof CabinRecord },
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
            onClick={() => {
              setEditCabin({ ...record })
              setEditCabinOpen(true)
            }}
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
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
