import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import StatusBadge from '@/components/common/StatusBadge'
import SellRoomTypePricingDialog from '@/components/resources/SellRoomTypePricingDialog'
import { initialCabinData } from '@/mock/cabinManagement'
import {
  createEmptyMapping,
  createEmptySellRoomTypeConfig,
  formatMappingSummary,
  generateSellRoomTypeCode,
  getPhysicalCabinsByShip,
  initialSellRoomTypeConfigs,
  sellRoomTypeShipOptions,
  type PhysicalRoomMapping,
  type SellRoomTypeConfig,
} from '@/mock/sellRoomTypeConfig'
import {
  createDefaultPricingRule,
  type CabinPricingRule,
} from '@/utils/cabinPriceCoefficient'

const floorOptions = ['', '2F', '3F', '4F', '5F']

function getInitialPricingRulesBySellRoomType(): Record<string, CabinPricingRule[]> {
  const sample = initialSellRoomTypeConfigs[0]
  return {
    [sample.id]: [
      createDefaultPricingRule(sample, {
        name: '旺季规则',
        effectiveStart: '2026-04-01',
        effectiveEnd: '2026-10-31',
      }),
      createDefaultPricingRule(sample, {
        name: '淡季规则',
        effectiveStart: '2026-11-01',
        effectiveEnd: '2027-03-31',
      }),
    ],
  }
}

export default function SellRoomTypeConfigPage() {
  const [records, setRecords] = useState<SellRoomTypeConfig[]>(initialSellRoomTypeConfigs)
  const [pricingRulesBySellRoomType, setPricingRulesBySellRoomType] = useState<Record<string, CabinPricingRule[]>>(
    getInitialPricingRulesBySellRoomType,
  )
  const [shipFilter, setShipFilter] = useState('all')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [editing, setEditing] = useState<SellRoomTypeConfig | null>(null)
  const [pricingTarget, setPricingTarget] = useState<SellRoomTypeConfig | null>(null)
  const pageSize = 10

  const filteredData = useMemo(() => {
    if (appliedShipFilter === 'all') return records
    return records.filter((item) => item.shipName === appliedShipFilter)
  }, [appliedShipFilter, records])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page])

  const physicalCabins = useMemo(() => {
    if (!editing) return []
    return getPhysicalCabinsByShip(editing.shipName, initialCabinData)
  }, [editing])

  const openCreate = () => {
    const defaultShip = appliedShipFilter === 'all' ? '长江叁号' : appliedShipFilter
    setEditing(createEmptySellRoomTypeConfig(defaultShip))
    setFormOpen(true)
  }

  const openEdit = (record: SellRoomTypeConfig) => {
    setEditing({ ...record, mappings: record.mappings.map((item) => ({ ...item })) })
    setFormOpen(true)
  }

  const openMapping = (record: SellRoomTypeConfig) => {
    setEditing({ ...record, mappings: record.mappings.map((item) => ({ ...item })) })
    setMappingOpen(true)
  }

  const openPricing = (record: SellRoomTypeConfig) => {
    setPricingTarget({ ...record })
    setPricingOpen(true)
  }

  const savePricingRules = (rules: CabinPricingRule[]) => {
    if (!pricingTarget) return
    setPricingRulesBySellRoomType((prev) => ({
      ...prev,
      [pricingTarget.id]: rules,
    }))
    setPricingOpen(false)
    setPricingTarget(null)
  }

  const saveRecord = () => {
    if (!editing || !editing.sellRoomTypeName.trim()) return
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === editing.id)
      const nextRecord = {
        ...editing,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      return exists ? prev.map((item) => (item.id === editing.id ? nextRecord : item)) : [...prev, nextRecord]
    })
    setFormOpen(false)
    setEditing(null)
  }

  const saveMappings = () => {
    if (!editing) return
    setRecords((prev) =>
      prev.map((item) =>
        item.id === editing.id
          ? {
              ...editing,
              updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            }
          : item,
      ),
    )
    setMappingOpen(false)
    setEditing(null)
  }

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
  }

  const updateEditing = (patch: Partial<SellRoomTypeConfig>) => {
    setEditing((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      if (patch.shipName !== undefined || patch.sellRoomTypeName !== undefined) {
        next.sellRoomTypeCode = generateSellRoomTypeCode(next.shipName, next.sellRoomTypeName || '新房型')
      }
      return next
    })
  }

  const updateMapping = (mappingId: string, patch: Partial<PhysicalRoomMapping>) => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        mappings: prev.mappings.map((item) => (item.id === mappingId ? { ...item, ...patch } : item)),
      }
    })
  }

  const addMapping = () => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        mappings: [...prev.mappings, createEmptyMapping()],
      }
    })
  }

  const removeMapping = (mappingId: string) => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        mappings: prev.mappings.filter((item) => item.id !== mappingId),
      }
    })
  }

  const columns = [
    {
      key: 'index',
      title: '序号',
      width: '70px',
      render: (record: SellRoomTypeConfig) => filteredData.findIndex((item) => item.id === record.id) + 1,
    },
    { key: 'shipName', title: '船舶', dataIndex: 'shipName' as keyof SellRoomTypeConfig, width: '110px' },
    { key: 'sellRoomTypeName', title: '房型名称', dataIndex: 'sellRoomTypeName' as keyof SellRoomTypeConfig, width: '120px' },
    { key: 'sellRoomTypeCode', title: '房型编码', dataIndex: 'sellRoomTypeCode' as keyof SellRoomTypeConfig, width: '120px' },
    {
      key: 'mappings',
      title: '关联物理船舱',
      render: (record: SellRoomTypeConfig) => (
        <div className="max-w-md text-sm leading-6 text-gray-700">{formatMappingSummary(record.mappings)}</div>
      ),
    },
    {
      key: 'ruleStatus',
      title: '价格系数',
      width: '100px',
      render: (record: SellRoomTypeConfig) => {
        const count = pricingRulesBySellRoomType[record.id]?.length || 0
        return (
          <span className={`text-sm ${count > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {count > 0 ? `${count} 条规则` : '默认'}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (record: SellRoomTypeConfig) => <StatusBadge status={record.status} />,
    },
    { key: 'sortNo', title: '排序', dataIndex: 'sortNo' as keyof SellRoomTypeConfig, width: '70px' },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof SellRoomTypeConfig, width: '100px' },
    { key: 'updatedAt', title: '修改时间', dataIndex: 'updatedAt' as keyof SellRoomTypeConfig, width: '170px' },
    {
      key: 'actions',
      title: '操作',
      width: '300px',
      render: (record: SellRoomTypeConfig) => (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => openMapping(record)} className="text-sm text-blue-600 hover:text-blue-700">
            关联配置
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => openPricing(record)} className="text-sm text-blue-600 hover:text-blue-700">
            价格系数
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => openEdit(record)} className="text-sm text-blue-600 hover:text-blue-700">
            编辑
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => removeRecord(record.id)} className="text-sm text-red-500 hover:text-red-600">
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="房型管理"
        description="维护房型与物理船舱关联关系，配置计数维度、库存预警及入住价格系数。"
      >
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          新增房型
        </button>
      </PageHeader>

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
            {sellRoomTypeShipOptions.map((option) => (
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
        open={formOpen}
        title={editing && records.some((item) => item.id === editing.id) ? '编辑房型' : '新增房型'}
        width="max-w-2xl"
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={saveRecord}
      >
        {editing && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">船舶</label>
                <select
                  value={editing.shipName}
                  onChange={(e) => updateEditing({ shipName: e.target.value, mappings: [] })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {sellRoomTypeShipOptions.filter((item) => item !== 'all').map((ship) => (
                    <option key={ship} value={ship}>
                      {ship}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">房型名称</label>
                <input
                  value={editing.sellRoomTypeName}
                  onChange={(e) => updateEditing({ sellRoomTypeName: e.target.value })}
                  placeholder="如：标准间、行政房"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">房型编码</label>
                <input
                  value={editing.sellRoomTypeCode}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">排序号</label>
                <input
                  type="number"
                  value={editing.sortNo}
                  onChange={(e) => updateEditing({ sortNo: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">状态</label>
                <select
                  value={editing.status}
                  onChange={(e) => updateEditing({ status: e.target.value as SellRoomTypeConfig['status'] })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="enabled">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">说明</label>
              <textarea
                value={editing.description}
                onChange={(e) => updateEditing({ description: e.target.value })}
                rows={3}
                placeholder="补充该房型的业务说明"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">计数维度</h4>
              <select
                value={editing.countDimension}
                onChange={(e) => updateEditing({ countDimension: e.target.value as SellRoomTypeConfig['countDimension'] })}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="room">按间计数</option>
                <option value="bed">按床计数</option>
              </select>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">预警设置</h4>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">库存预警</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      开启后，当该房型的剩余库存低于设定阈值时会触发预警
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={editing.alertEnabled}
                      onChange={(e) => updateEditing({ alertEnabled: e.target.checked })}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
                  </label>
                </div>

                {editing.alertEnabled && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-end gap-4">
                      <div className="w-48">
                        <label className="mb-1 block text-sm text-gray-700">预警规则</label>
                        <select
                          value={editing.alertType}
                          onChange={(e) => updateEditing({ alertType: e.target.value as SellRoomTypeConfig['alertType'] })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="percentage">按剩余库存百分比</option>
                          <option value="quantity">按剩余库存数量</option>
                        </select>
                      </div>
                      <div className="w-40">
                        <label className="mb-1 block text-sm text-gray-700">阈值</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={editing.alertValue}
                            onChange={(e) => updateEditing({ alertValue: Number(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            {editing.alertType === 'percentage' ? '%' : '间'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              当前已关联 {editing.mappings.length} 个物理船舱。保存基本信息后，可继续通过“关联配置”维护映射关系。
            </div>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={mappingOpen}
        title={editing ? `关联配置 - ${editing.sellRoomTypeName}` : '关联配置'}
        width="max-w-3xl"
        onCancel={() => {
          setMappingOpen(false)
          setEditing(null)
        }}
        onSubmit={saveMappings}
      >
        {editing && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              配置 <span className="font-medium text-gray-900">{editing.shipName}</span> 下房型
              <span className="font-medium text-gray-900">「{editing.sellRoomTypeName}」</span>
              可占用的物理船舱。
            </div>

            <div className="space-y-3">
              {editing.mappings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  暂未配置物理船舱关联，请点击下方按钮添加。
                </div>
              ) : (
                editing.mappings.map((mapping) => (
                    <div key={mapping.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8">
                          <label className="mb-1 block text-xs text-gray-500">物理船舱</label>
                          <select
                            value={mapping.physicalCabinId}
                            onChange={(e) => {
                              const selected = physicalCabins.find((item) => item.id === e.target.value)
                              updateMapping(mapping.id, {
                                physicalCabinId: e.target.value,
                                physicalCabinName: selected?.cabinName || '',
                              })
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">请选择物理船舱</option>
                            {physicalCabins.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.cabinName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="mb-1 block text-xs text-gray-500">楼层</label>
                          <select
                            value={mapping.floor || ''}
                            onChange={(e) => updateMapping(mapping.id, { floor: e.target.value || undefined })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            {floorOptions.map((floor) => (
                              <option key={floor || 'none'} value={floor}>
                                {floor || '不限'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeMapping(mapping.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              type="button"
              onClick={addMapping}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-400"
            >
              <Plus className="h-4 w-4" />
              添加物理船舱关联
            </button>
          </div>
        )}
      </FormDialog>

      <SellRoomTypePricingDialog
        open={pricingOpen}
        sellRoomType={pricingTarget}
        rules={pricingTarget ? pricingRulesBySellRoomType[pricingTarget.id] || [] : []}
        onClose={() => {
          setPricingOpen(false)
          setPricingTarget(null)
        }}
        onSave={savePricingRules}
      />
    </div>
  )
}
