import React, { useState, useEffect, useMemo } from 'react'
import { Info, Plus, Upload, Camera, Trash2, ChevronDown, X, BedDouble, Users } from 'lucide-react'
import { defaultRoomReserveData, bookingSegmentOptions } from '@/mock/data'
import {
  calculateGuestBaseTicket,
  parseAgeFromIdCard,
  parseGenderFromIdCard,
  resolveGuestPriceInfo,
  type GuestPriceInfo,
} from '@/components/dealer/booking/guestPricingUtils'
import { formatCurrency } from '@/utils/format'

const comboOptions = ['VIP餐厅', '岸上观光', '酒水套餐', 'WiFi套餐', 'SPA套餐', '摄影套餐']
const defaultRoomTypes = ['标准间', '豪华套房', '总统套房']
const idTypeOptions = ['身份证', '护照', '台胞证', '港澳通行证', '回乡证', '其他']
const nationalityOptions = ['中国', '美国', '日本', '韩国', '英国', '法国', '德国', '加拿大', '澳大利亚', '其他']
const floorFeeOptions = ['不收楼层费', '2楼', '3楼', '4楼', '5楼', '6楼']

interface GuestNameOption {
  name: string
  idType: string
  idNum: string
  phone: string
}

const guestNameOptions: GuestNameOption[] = [
  { name: '张明', idType: '身份证', idNum: '420106198801011234', phone: '13812345678' },
  { name: '李红', idType: '身份证', idNum: '420106199002021235', phone: '13912345679' },
  { name: '王强', idType: '护照', idNum: 'P12345678', phone: '13712345670' },
  { name: '赵丽', idType: '身份证', idNum: '420106199204041237', phone: '13612345671' },
  { name: '陈浩', idType: '身份证', idNum: '420106201006051238', phone: '13512345672' },
  { name: '陈果', idType: '身份证', idNum: '420106202308081240', phone: '' },
  { name: '刘洋', idType: '身份证', idNum: '420106199507071239', phone: '13412345673' },
  { name: '周敏', idType: '护照', idNum: 'E87654321', phone: '13312345674' },
  { name: '吴磊', idType: '身份证', idNum: '420106198503031241', phone: '13212345675' },
  { name: '郑婷', idType: '台胞证', idNum: 'T123456789', phone: '13112345676' },
]

function NameCombobox({
  value,
  onChange,
  onSelectGuest,
}: {
  value: string
  onChange: (name: string) => void
  onSelectGuest: (guest: GuestNameOption) => void
}) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    const keyword = value.trim()
    if (!keyword) return guestNameOptions
    return guestNameOptions.filter((option) => option.name.includes(keyword))
  }, [value])

  const selectGuest = (option: GuestNameOption) => {
    onSelectGuest(option)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex h-8 w-full items-center overflow-hidden rounded border border-gray-300 bg-white focus-within:border-blue-500">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent px-2 text-xs outline-none"
          placeholder="请选择或输入姓名"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-full shrink-0 items-center border-l border-gray-200 px-1.5 text-gray-400 hover:bg-gray-50"
          onMouseDown={(e) => {
            e.preventDefault()
            setOpen((prev) => !prev)
          }}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <ul className="absolute left-0 right-0 top-9 z-20 max-h-44 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-400">无匹配游客，可继续手动输入</li>
          ) : (
            filtered.map((option) => (
              <li key={`${option.name}-${option.idNum}`}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-blue-50 ${
                    value.trim() === option.name ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectGuest(option)
                  }}
                >
                  <span className="font-medium">{option.name}</span>
                  <span className="ml-2 truncate text-gray-400">{option.idNum}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function ReadOnlyCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex min-h-8 items-center rounded border border-gray-100 bg-gray-50 px-2 text-xs text-gray-700 ${className}`}
      title="系统自动识别，不可修改"
    >
      {children}
    </div>
  )
}

interface TouristGuest {
  id: number
  ageGroup: string
  stayType: string
  name: string
  gender: string
  age: string
  nationality: string
  floorFeeFloor: string
  province: string
  idType: string
  idNum: string
  phone: string
  transfer: boolean
  saleType: string
  comboProducts: string[]
  guestType: string
  paymentSource: string
}

interface TourTeam {
  id: string
  name: string
  remark: string
}

interface RoomGroup {
  id: string
  roomSeq: string
  roomType: string
  teamId: string
  segmentId: string
  segmentLabel: string
  guests: TouristGuest[]
}

interface EscortTicket {
  id: string
  name: string
  idType: string
  idNum: string
  phone: string
  remark: string
}

function getSegmentLabel(segmentId: string) {
  const segment = bookingSegmentOptions.find((item) => item.id === segmentId) ?? bookingSegmentOptions[0]
  return `${segment.startPort} → ${segment.endPort}`
}

function createTeam(name: string, remark = ''): TourTeam {
  return { id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, remark }
}

function defaultGuestCount(roomType: string) {
  return roomType === '标准间' ? 2 : 1
}

function defaultStayType(roomType: string) {
  return roomType === '标准间' ? '标准' : '单间'
}

function createGuest(id: number, stayType = '标准'): TouristGuest {
  return {
    id,
    ageGroup: '成人',
    stayType,
    name: '',
    gender: '男',
    age: '',
    nationality: '中国',
    floorFeeFloor: '不收楼层费',
    province: '',
    idType: '身份证',
    idNum: '',
    phone: '',
    transfer: false,
    saleType: '正价',
    comboProducts: [],
    guestType: '内宾',
    paymentSource: '自付',
  }
}

function createRoomGroup(
  roomSeq: string,
  roomType: string,
  guestCount?: number,
  teamId = '',
  segmentId = bookingSegmentOptions[0].id,
): RoomGroup {
  const count = guestCount ?? defaultGuestCount(roomType)
  const stayType = defaultStayType(roomType)
  const baseId = Date.now()
  return {
    id: `room-${roomSeq}-${baseId}`,
    roomSeq,
    roomType,
    teamId,
    segmentId,
    segmentLabel: getSegmentLabel(segmentId),
    guests: Array.from({ length: count }, (_, index) => createGuest(baseId + index, stayType)),
  }
}

function buildInitialRoomGroups(roomData: Record<string, { count?: number }>): RoomGroup[] {
  const groups: RoomGroup[] = []
  let roomSeqCounter = 1

  const stdCount = roomData['标准间']?.count || 0
  for (let i = 0; i < stdCount; i++) {
    groups.push(createRoomGroup(String(roomSeqCounter++), '标准间'))
  }

  const suiteCount = roomData['豪华套房']?.count || 0
  for (let i = 0; i < suiteCount; i++) {
    groups.push(createRoomGroup(String(roomSeqCounter++), '豪华套房', 1))
  }

  const presidentCount = roomData['总统套房']?.count || 0
  for (let i = 0; i < presidentCount; i++) {
    groups.push(createRoomGroup(String(roomSeqCounter++), '总统套房', 1))
  }

  return groups
}

function flattenRoomGroups(roomGroups: RoomGroup[], teams: TourTeam[]) {
  const teamMap = new Map(teams.map((team) => [team.id, team]))
  return roomGroups.flatMap((room) =>
    room.guests.map((guest) => ({
      ...guest,
      roomType: room.roomType,
      roomSeq: room.roomSeq,
      segmentId: room.segmentId,
      segmentLabel: room.segmentLabel,
      teamName: teamMap.get(room.teamId)?.name || '',
      teamRemark: teamMap.get(room.teamId)?.remark || '',
    })),
  )
}

function buildMockImportRoomGroups(teamIds: { team1: string; team2: string }): RoomGroup[] {
  const baseId = Date.now()
  const guest = (
    id: number,
    name: string,
    idNum: string,
    phone: string,
    gender: string,
    stayType: string,
    ageGroup = '成人',
    guestType = '内宾',
    idType = '身份证',
  ): TouristGuest => enrichGuestFromId({
    ...createGuest(id, stayType),
    name,
    idNum,
    phone,
    gender,
    ageGroup,
    guestType,
    idType,
    nationality: guestType === '外宾' ? '美国' : '中国',
  }, idNum, idType)

  return [
    {
      id: `room-1-${baseId}`,
      roomSeq: '1',
      roomType: '标准间',
      teamId: teamIds.team1,
      segmentId: bookingSegmentOptions[0].id,
      segmentLabel: getSegmentLabel(bookingSegmentOptions[0].id),
      guests: [
        guest(baseId, '张明', '420106198801011234', '13812345678', '男', '标准'),
        guest(baseId + 1, '李红', '420106199002021235', '13912345679', '女', '标准'),
      ],
    },
    {
      id: `room-2-${baseId}`,
      roomSeq: '2',
      roomType: '豪华套房',
      teamId: teamIds.team1,
      segmentId: bookingSegmentOptions[1]?.id ?? bookingSegmentOptions[0].id,
      segmentLabel: getSegmentLabel(bookingSegmentOptions[1]?.id ?? bookingSegmentOptions[0].id),
      guests: [
        guest(baseId + 2, '王强', 'P12345678', '13712345670', '男', '单间', '成人', '外宾', '护照'),
      ],
    },
    {
      id: `room-3-${baseId}`,
      roomSeq: '3',
      roomType: '标准间',
      teamId: teamIds.team2,
      segmentId: bookingSegmentOptions[2]?.id ?? bookingSegmentOptions[0].id,
      segmentLabel: getSegmentLabel(bookingSegmentOptions[2]?.id ?? bookingSegmentOptions[0].id),
      guests: [
        guest(baseId + 3, '赵丽', '420106199204041237', '13612345671', '女', '标准'),
        guest(baseId + 4, '陈浩', '420106201006051238', '13512345672', '男', '儿童不占床', '儿童'),
        guest(baseId + 5, '陈果', '420106202308081240', '', '女', '不占床', '婴儿'),
      ],
    },
  ]
}

function buildMockOcrRoomGroups(existing: RoomGroup[]): RoomGroup[] {
  const baseId = Date.now()
  const nextSeq = String(
    (existing.map((r) => Number.parseInt(r.roomSeq, 10)).filter((n) => !Number.isNaN(n)).pop() ?? 0) + 1,
  )
  const ocrRoom = createRoomGroup(nextSeq, '标准间', 1)
  ocrRoom.guests[0] = enrichGuestFromId({
    ...ocrRoom.guests[0],
    name: '刘洋',
    idNum: '420106199507071239',
    phone: '13412345673',
    gender: '男',
  }, '420106199507071239')
  return [...existing, ocrRoom]
}

interface ImportPreviewGuest {
  id: number
  name: string
  idNum: string
  phone: string
  guestType: string
  ageGroup: string
  gender: string
  age: string
  ticketPrice: number
  priceTypeLabel: string
  roomLabel: string
  source: 'import' | 'ocr'
}

function flattenPreviewGuests(
  roomGroups: RoomGroup[],
  roomData: Record<string, { price?: number }>,
  source: 'import' | 'ocr',
): ImportPreviewGuest[] {
  return roomGroups.flatMap((room) => {
    const baseP = getRoomBasePrice(room.roomType, roomData)
    return room.guests
      .filter((guest) => guest.name)
      .map((guest, index) => {
        const priceInfo = resolveGuestPriceInfo(guest, room, index, baseP)
        return {
          id: guest.id,
          name: guest.name,
          idNum: guest.idNum,
          phone: guest.phone,
          guestType: guest.guestType,
          ageGroup: guest.ageGroup,
          gender: guest.gender,
          age: guest.age,
          ticketPrice: priceInfo.ticketPrice,
          priceTypeLabel: priceInfo.priceTypeLabel,
          roomLabel: `房间${room.roomSeq} · ${room.roomType}`,
          source,
        }
      })
  })
}

interface RoomPriceLine {
  desc: string
  price: number
  priceTypeLabel: string
}

interface RoomPriceResult {
  total: number
  lines: RoomPriceLine[]
}

function getRoomBasePrice(roomType: string, roomData: Record<string, { price?: number }>) {
  return roomData?.[roomType]?.price ?? defaultRoomReserveData[roomType as keyof typeof defaultRoomReserveData]?.price ?? 2980
}

function enrichGuestFromId(guest: TouristGuest, idNum: string, idType?: string) {
  const next = { ...guest, idNum }
  const type = idType ?? guest.idType
  if (type === '身份证' && idNum.trim()) {
    const age = parseAgeFromIdCard(idNum)
    const gender = parseGenderFromIdCard(idNum)
    if (age) next.age = age
    if (gender) next.gender = gender
  }
  return next
}

function calculateRoomPrice(room: RoomGroup, roomData: Record<string, { price?: number }>): RoomPriceResult {
  const baseP = getRoomBasePrice(room.roomType, roomData)
  const lines = room.guests.map((guest, index) => {
    const priceInfo = resolveGuestPriceInfo(guest, room, index, baseP)
    const { desc } = calculateGuestBaseTicket(room, index, baseP)
    return {
      desc,
      price: priceInfo.ticketPrice ?? 0,
      priceTypeLabel: priceInfo.priceTypeLabel,
    }
  })
  const total = lines.reduce((sum, line) => sum + line.price, 0)
  return { total, lines }
}

export default function Step3TouristInfo({
  roomData,
  onNext,
  onPrev,
  mode = 'booking',
  orderNo,
  initialGroupName,
}: {
  roomData: any
  onNext: (data: any) => void
  onPrev: () => void
  mode?: 'booking' | 'order-edit'
  orderNo?: string
  initialGroupName?: string
}) {
  const [teams, setTeams] = useState<TourTeam[]>([])
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([])
  const [comboOpenKey, setComboOpenKey] = useState<string | null>(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [newRoomType, setNewRoomType] = useState('标准间')
  const [newRoomTeamId, setNewRoomTeamId] = useState('')
  const [newRoomSegmentId, setNewRoomSegmentId] = useState(bookingSegmentOptions[0].id)
  const [newTeamName, setNewTeamName] = useState('')
  const [importPreview, setImportPreview] = useState<ImportPreviewGuest[]>([])
  const [importTip, setImportTip] = useState('')
  const [escortTickets, setEscortTickets] = useState<EscortTicket[]>([])

  const roomTypeOptions = useMemo(() => {
    const types = Object.keys(roomData || {}).filter((key) => roomData[key])
    return types.length > 0 ? types : defaultRoomTypes
  }, [roomData])

  const totalPaxFromRooms = useMemo(() => {
    let total = 0
    Object.entries(roomData || {}).forEach(([roomType, room]: [string, any]) => {
      if (!room || room.count <= 0) return
      total += room.count * (roomType === '标准间' ? 2 : 1)
    })
    return total
  }, [roomData])

  const nextRoomSeq = useMemo(() => {
    const seqs = roomGroups.map((room) => Number.parseInt(room.roomSeq, 10)).filter((n) => !Number.isNaN(n))
    return String((seqs.length ? Math.max(...seqs) : 0) + 1)
  }, [roomGroups])

  const touristList = useMemo(() => flattenRoomGroups(roomGroups, teams), [roomGroups, teams])

  const roomsByTeam = useMemo(() => {
    return teams.map((team) => ({
      team,
      rooms: roomGroups.filter((room) => room.teamId === team.id),
    }))
  }, [teams, roomGroups])

  const displayRoomOrder = useMemo(
    () => roomsByTeam.flatMap(({ rooms }) => rooms),
    [roomsByTeam],
  )

  const roomPriceMap = useMemo(() => {
    const map = new Map<string, RoomPriceResult>()
    roomGroups.forEach((room) => {
      map.set(room.id, calculateRoomPrice(room, roomData || {}))
    })
    return map
  }, [roomGroups, roomData])

  const guestPriceMap = useMemo(() => {
    const map = new Map<string, GuestPriceInfo>()
    roomGroups.forEach((room) => {
      const baseP = getRoomBasePrice(room.roomType, roomData || {})
      room.guests.forEach((guest, index) => {
        map.set(`${room.id}-${guest.id}`, resolveGuestPriceInfo(guest, room, index, baseP))
      })
    })
    return map
  }, [roomGroups, roomData])

  const orderTotal = useMemo(
    () => roomGroups.reduce((sum, room) => sum + (roomPriceMap.get(room.id)?.total ?? 0), 0),
    [roomGroups, roomPriceMap],
  )

  useEffect(() => {
    if (roomGroups.length === 0 && teams.length === 0) {
      const initial = buildInitialRoomGroups(roomData || {})
      if (initial.length > 0) {
        const defaultTeam = createTeam(initialGroupName?.trim() || '默认团')
        setTeams([defaultTeam])
        setRoomGroups(initial.map((room) => ({ ...room, teamId: defaultTeam.id })))
      }
    }
  }, [roomData, roomGroups.length, teams.length, initialGroupName])

  const rowOffsets = useMemo(() => {
    let offset = 0
    return displayRoomOrder.map((room) => {
      const start = offset
      offset += room.guests.length
      return { roomId: room.id, start }
    })
  }, [displayRoomOrder])

  const getRowOffset = (roomId: string) => rowOffsets.find((item) => item.roomId === roomId)?.start ?? 0

  const incompleteTip = useMemo(() => {
    if (touristList.length === 0) return '请先添加房型与游客信息'
    const incomplete: number[] = []
    let rowNo = 0
    roomGroups.forEach((room) => {
      room.guests.forEach((guest) => {
        rowNo += 1
        if (!guest.name?.trim() || !guest.idNum?.trim()) incomplete.push(rowNo)
      })
    })
    if (incomplete.length > 0) return `第 ${incomplete.join('、')} 行信息未补全（姓名/证件号码必填）`
    const escortIncomplete = escortTickets
      .map((ticket, index) => (!ticket.name.trim() || !ticket.idNum.trim() ? index + 1 : null))
      .filter((value): value is number => value !== null)
    if (escortIncomplete.length > 0) return `全陪票第 ${escortIncomplete.join('、')} 行信息未补全（姓名/证件号码必填）`
    return ''
  }, [escortTickets, roomGroups, touristList.length])

  const canProceed = touristList.length > 0 && incompleteTip === ''

  const updateRoomType = (roomId: string, roomType: string) => {
    setRoomGroups((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              roomType,
              guests: room.guests.map((guest) => ({
                ...guest,
                stayType: defaultStayType(roomType),
              })),
            }
          : room,
      ),
    )
  }

  const addGuestToRoom = (roomId: string) => {
    setRoomGroups((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, guests: [...room.guests, createGuest(Date.now(), defaultStayType(room.roomType))] }
          : room,
      ),
    )
  }

  const removeGuestFromRoom = (roomId: string, guestId: number) => {
    setRoomGroups((prev) =>
      prev
        .map((room) =>
          room.id === roomId
            ? { ...room, guests: room.guests.filter((guest) => guest.id !== guestId) }
            : room,
        )
        .filter((room) => room.guests.length > 0),
    )
  }

  const addRoomGroup = () => {
    const teamId = newRoomTeamId || teams[0]?.id
    if (!teamId) {
      alert('请先新增团名')
      return
    }
    setRoomGroups((prev) => [...prev, createRoomGroup(nextRoomSeq, newRoomType, undefined, teamId, newRoomSegmentId)])
    setAddRoomOpen(false)
  }

  const addTeam = () => {
    const name = newTeamName.trim()
    if (!name) return
    const team = createTeam(name)
    setTeams((prev) => [...prev, team])
    setNewTeamName('')
    setAddTeamOpen(false)
  }

  const updateTeamName = (teamId: string, name: string) => {
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, name } : team)))
  }

  const updateTeamRemark = (teamId: string, remark: string) => {
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, remark } : team)))
  }

  const removeTeam = (teamId: string) => {
    const roomCount = roomGroups.filter((room) => room.teamId === teamId).length
    if (roomCount > 0) {
      alert('该团下仍有房间，请先移出或删除房间后再删除团')
      return
    }
    if (!window.confirm('确定删除该团吗？')) return
    setTeams((prev) => prev.filter((team) => team.id !== teamId))
  }

  const updateRoomTeam = (roomId: string, teamId: string) => {
    setRoomGroups((prev) => prev.map((room) => (room.id === roomId ? { ...room, teamId } : room)))
  }

  const updateRoomSegment = (roomId: string, segmentId: string) => {
    setRoomGroups((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, segmentId, segmentLabel: getSegmentLabel(segmentId) }
          : room,
      ),
    )
  }

  const openAddRoom = (teamId?: string) => {
    setNewRoomType(roomTypeOptions[0] || '标准间')
    setNewRoomTeamId(teamId || teams[0]?.id || '')
    setNewRoomSegmentId(bookingSegmentOptions[0].id)
    setAddRoomOpen(true)
  }

  const removeRoomGroup = (roomId: string) => {
    if (!window.confirm('确定删除该房型及全部入住人吗？')) return
    setRoomGroups((prev) => prev.filter((room) => room.id !== roomId))
  }

  const updateGuestField = (roomId: string, guestId: number, field: string, value: unknown) => {
    setRoomGroups((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room
        return {
          ...room,
          guests: room.guests.map((guest) => {
            if (guest.id !== guestId) return guest
            let nextGuest = { ...guest, [field]: value } as TouristGuest
            if (field === 'nationality') {
              nextGuest.guestType = value === '中国' || !value ? '内宾' : '外宾'
            }
            if (field === 'idNum') {
              nextGuest = enrichGuestFromId(nextGuest, String(value))
            }
            if (field === 'idType' && nextGuest.idNum) {
              nextGuest = enrichGuestFromId(nextGuest, nextGuest.idNum, String(value))
            }
            return nextGuest
          }),
        }
      }),
    )
  }

  const applyGuestSuggestion = (roomId: string, guestId: number, option: GuestNameOption) => {
    setRoomGroups((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room
        return {
          ...room,
          guests: room.guests.map((guest) =>
            guest.id === guestId
              ? enrichGuestFromId({
                  ...guest,
                  name: option.name,
                  idType: option.idType,
                  idNum: option.idNum,
                  phone: option.phone,
                }, option.idNum, option.idType)
              : guest,
          ),
        }
      }),
    )
  }

  const toggleComboProduct = (roomId: string, guestId: number, product: string) => {
    setRoomGroups((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room
        return {
          ...room,
          guests: room.guests.map((guest) => {
            if (guest.id !== guestId) return guest
            const comboProducts = guest.comboProducts.includes(product)
              ? guest.comboProducts.filter((item) => item !== product)
              : [...guest.comboProducts, product]
            return { ...guest, comboProducts }
          }),
        }
      }),
    )
  }

  const addEscortTicket = () => {
    if (escortTickets.length >= 2) return
    setEscortTickets((prev) => [
      ...prev,
      {
        id: `escort-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        idType: '身份证',
        idNum: '',
        phone: '',
        remark: '',
      },
    ])
  }

  const updateEscortTicket = (id: string, field: keyof EscortTicket, value: string) => {
    setEscortTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, [field]: value } : ticket)))
  }

  const removeEscortTicket = (id: string) => {
    setEscortTickets((prev) => prev.filter((ticket) => ticket.id !== id))
  }

  const handleImportList = () => {
    const team1 = createTeam('华东旅行社一团', '靠窗优先')
    const team2 = createTeam('散客自组', '含儿童，需安排婴儿床')
    const mock = buildMockImportRoomGroups({ team1: team1.id, team2: team2.id })
    setTeams([team1, team2])
    setRoomGroups(mock)
    setImportPreview(flattenPreviewGuests(mock, roomData || {}, 'import'))
    setImportTip(`已导入 ${mock.reduce((sum, room) => sum + room.guests.length, 0)} 位游客，${mock.length} 间房，${2} 个团`)
  }

  const handleOcrRecognize = () => {
    setRoomGroups((prev) => {
      const fallbackTeam = teams[0] ?? createTeam('默认团')
      if (teams.length === 0) setTeams([fallbackTeam])
      const next = buildMockOcrRoomGroups(prev.length > 0 ? prev : buildMockImportRoomGroups({ team1: fallbackTeam.id, team2: fallbackTeam.id }).slice(0, 1))
      const ocrRoom = next[next.length - 1]
      if (ocrRoom && !ocrRoom.teamId) {
        ocrRoom.teamId = fallbackTeam.id
      }
      const newGuests = flattenPreviewGuests(next, roomData || {}, 'ocr').slice(-1)
      setImportPreview((old) => [...old.filter((g) => g.source !== 'ocr' || !newGuests.some((n) => n.id === g.id)), ...newGuests])
      setImportTip('OCR 识别成功，新增 1 位游客')
      return next
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
        <span>
          {mode === 'order-edit' && orderNo ? `订单号 ${orderNo} · ` : ''}
          可按团名分组录入，同一团下可包含多种房型；团备注对该团下全部房间生效。姓名和证件号码为必填项；性别、年龄、票价、价格类型根据证件自动识别，不可手动修改。
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-9 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm text-blue-700 transition hover:bg-blue-100"
            onClick={() => {
              setNewTeamName('')
              setAddTeamOpen(true)
            }}
          >
            <Users className="h-4 w-4" /> 新增团名
          </button>
          <button
            className="flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 transition hover:bg-gray-50"
            onClick={() => openAddRoom()}
            disabled={teams.length === 0}
          >
            <BedDouble className="h-4 w-4" /> 新增房型
          </button>
        </div>
        <div className="text-sm text-gray-600">
          按占舱应录入 <strong className="mx-1 text-blue-600">{totalPaxFromRooms}</strong> 人 <span className="mx-2 text-gray-300">|</span>
          已填 <strong className="mx-1 text-blue-600">{touristList.length}</strong> 人 <span className="mx-2 text-gray-300">|</span>
          已分配房间 <strong className="mx-1 text-blue-600">{roomGroups.length}</strong> 间
          {teams.length > 0 && (
            <>
              <span className="mx-2 text-gray-300">|</span>
              团 <strong className="mx-1 text-blue-600">{teams.length}</strong> 个
            </>
          )}
          {roomGroups.length > 0 && (
            <>
              <span className="mx-2 text-gray-300">|</span>
              订单合计 <strong className="mx-1 text-red-500">¥{orderTotal.toLocaleString()}</strong>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start gap-5">
        <div className="min-w-0 w-[75%] space-y-4">
        {teams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
            请先点击「新增团名」创建团，再添加房型与游客
          </div>
        ) : (
          roomsByTeam.map(({ team, rooms }) => {
            const teamPax = rooms.reduce((sum, room) => sum + room.guests.length, 0)
            const teamTotal = rooms.reduce((sum, room) => sum + (roomPriceMap.get(room.id)?.total ?? 0), 0)
            return (
              <section key={team.id} className="rounded-lg border border-blue-100 bg-blue-50/20 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-blue-600" />
                    <input
                      className="min-w-[120px] max-w-[240px] rounded border border-transparent bg-white/80 px-2 py-1 text-sm font-semibold text-gray-900 outline-none focus:border-blue-400"
                      value={team.name}
                      onChange={(e) => updateTeamName(team.id, e.target.value)}
                      placeholder="团名"
                    />
                    <span className="text-xs text-gray-500">
                      {rooms.length} 间房 · {teamPax} 人
                      {teamTotal > 0 && <> · ¥{teamTotal.toLocaleString()}</>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAddRoom(team.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-blue-200 bg-white px-3 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> 新增房型
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTeam(team.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 删除团
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                  <input
                    className="h-8 w-full rounded border border-gray-200 px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
                    placeholder="团备注，如：靠窗优先、含儿童需婴儿床"
                    value={team.remark}
                    onChange={(e) => updateTeamRemark(team.id, e.target.value)}
                  />
                </div>

                {rooms.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white py-8 text-center text-xs text-gray-400">
                    该团暂无房间，点击「新增房型」开始录入
                  </div>
                ) : (
                  rooms.map((room) => {
            const roomPrice = roomPriceMap.get(room.id)
            return (
            <div key={room.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">房间 {room.roomSeq}</span>
                  <select
                    value={room.roomType}
                    onChange={(e) => updateRoomType(room.id, e.target.value)}
                    className="h-8 min-w-[120px] rounded border border-gray-300 bg-white px-2 text-sm outline-none focus:border-blue-500"
                  >
                    {roomTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={room.teamId}
                    onChange={(e) => updateRoomTeam(room.id, e.target.value)}
                    className="h-8 min-w-[100px] rounded border border-gray-300 bg-white px-2 text-xs text-gray-600 outline-none focus:border-blue-500"
                    title="所属团"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={room.segmentId || bookingSegmentOptions[0].id}
                    onChange={(e) => updateRoomSegment(room.id, e.target.value)}
                    className="h-8 min-w-[140px] rounded border border-gray-300 bg-white px-2 text-xs text-gray-600 outline-none focus:border-blue-500"
                    title="航段"
                  >
                    {bookingSegmentOptions.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.startPort} → {segment.endPort}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500">{room.guests.length} 人</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addGuestToRoom(room.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs text-blue-600 hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> 新增游客
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRoomGroup(room.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 text-xs text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 删除房型
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1420px] text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-gray-100 bg-white text-gray-600">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">序</th>
                      <th className="w-24 px-3 py-3">入住类型</th>
                      <th className="w-28 px-3 py-3">姓名 <span className="text-red-500">*</span></th>
                      <th className="w-24 px-3 py-3">国籍</th>
                      <th className="w-24 px-3 py-3">楼层费</th>
                      <th className="w-24 px-3 py-3">证件类型</th>
                      <th className="w-32 px-3 py-3">证件号码 <span className="text-red-500">*</span></th>
                      <th className="w-16 px-3 py-3 text-gray-400">性别</th>
                      <th className="w-16 px-3 py-3 text-gray-400">年龄</th>
                      <th className="w-24 px-3 py-3 text-right text-gray-400">票价</th>
                      <th className="w-20 px-3 py-3 text-gray-400">价格类型</th>
                      <th className="w-28 px-3 py-3">手机号</th>
                      <th className="w-32 px-3 py-3">组合产品</th>
                      <th className="w-12 px-3 py-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {room.guests.map((guest, guestIndex) => {
                      const rowNo = getRowOffset(room.id) + guestIndex + 1
                      const comboKey = `${room.id}-${guest.id}`
                      const priceInfo = guestPriceMap.get(`${room.id}-${guest.id}`)
                      return (
                        <tr key={guest.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center text-gray-500">{rowNo}</td>
                          <td className="px-3 py-2">
                            <select
                              className="h-8 w-full rounded border border-gray-300 px-1 text-xs outline-none focus:border-blue-500"
                              value={guest.stayType}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'stayType', e.target.value)}
                            >
                              <option value="标准">标准</option>
                              <option value="单间">单间</option>
                              <option value="儿童不占床">儿童不占床</option>
                              <option value="加床">加床</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <NameCombobox
                              value={guest.name}
                              onChange={(name) => updateGuestField(room.id, guest.id, 'name', name)}
                              onSelectGuest={(option) => applyGuestSuggestion(room.id, guest.id, option)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="h-8 w-full rounded border border-gray-300 px-1 text-xs outline-none focus:border-blue-500"
                              value={guest.nationality}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'nationality', e.target.value)}
                            >
                              {nationalityOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="h-8 w-full rounded border border-gray-300 px-1 text-xs outline-none focus:border-blue-500"
                              value={guest.floorFeeFloor}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'floorFeeFloor', e.target.value)}
                            >
                              {floorFeeOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="h-8 w-full rounded border border-gray-300 px-1 text-xs outline-none focus:border-blue-500"
                              value={guest.idType}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'idType', e.target.value)}
                            >
                              {idTypeOptions.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                              placeholder="证件号码"
                              value={guest.idNum}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'idNum', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <ReadOnlyCell>{guest.gender || '-'}</ReadOnlyCell>
                          </td>
                          <td className="px-3 py-2">
                            <ReadOnlyCell>{guest.age ? `${guest.age}岁` : '-'}</ReadOnlyCell>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <ReadOnlyCell className="justify-end tabular-nums font-medium text-gray-900">
                              {formatCurrency(priceInfo?.ticketPrice ?? 0)}
                            </ReadOnlyCell>
                          </td>
                          <td className="px-3 py-2">
                            <ReadOnlyCell>
                              <span
                                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  priceInfo?.priceType === 'regional'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {priceInfo?.priceTypeLabel ?? '口岸价'}
                              </span>
                            </ReadOnlyCell>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                              placeholder="手机号"
                              value={guest.phone}
                              onChange={(e) => updateGuestField(room.id, guest.id, 'phone', e.target.value)}
                            />
                          </td>
                          <td className="relative px-3 py-2">
                            <div
                              className="flex h-8 cursor-pointer items-center justify-between rounded border border-gray-300 bg-white px-2 text-xs"
                              onClick={() => setComboOpenKey(comboOpenKey === comboKey ? null : comboKey)}
                            >
                              <span className="max-w-[80px] truncate">
                                {guest.comboProducts.length ? `已选${guest.comboProducts.length}项` : <span className="text-gray-400">请选择</span>}
                              </span>
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            </div>
                            {comboOpenKey === comboKey && (
                              <div
                                className="absolute right-0 top-10 z-10 w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                                onMouseLeave={() => setComboOpenKey(null)}
                              >
                                {comboOptions.map((opt) => (
                                  <label key={opt} className="flex cursor-pointer items-center gap-2 p-1.5 text-xs hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={guest.comboProducts.includes(opt)}
                                      onChange={() => toggleComboProduct(room.id, guest.id, opt)}
                                      className="rounded"
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100"
                              onClick={() => removeGuestFromRoom(room.id, guest.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {roomPrice && (
                <div className="border-t border-gray-200 bg-gray-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {roomPrice.lines.map((line) => (
                        <span key={`${line.desc}-${line.priceTypeLabel}`} className="text-xs text-gray-500">
                          {line.desc}
                          <span
                            className={`ml-1 rounded px-1 py-0.5 text-[10px] ${
                                line.priceTypeLabel === '区域价'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {line.priceTypeLabel}
                          </span>
                          <span className="ml-1 tabular-nums font-medium text-gray-700">
                            {line.price > 0 ? formatCurrency(line.price) : '-'}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="shrink-0 text-sm text-gray-700">
                      房间总价
                      <span className="ml-2 text-base font-semibold tabular-nums text-red-500">
                        {roomPrice.total > 0 ? formatCurrency(roomPrice.total) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          })
                )}
              </section>
            )
          })
        )}
        </div>

        <aside className="w-[25%] shrink-0 min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-medium text-gray-800">快捷录入</div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleImportList}
              className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 text-sm text-blue-700 transition hover:bg-blue-100"
            >
              <Upload className="h-4 w-4" /> 导入名单
            </button>
            <button
              type="button"
              onClick={handleOcrRecognize}
              className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 transition hover:bg-gray-100"
            >
              <Camera className="h-4 w-4" /> OCR 识别
            </button>
          </div>

          {importTip && (
            <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">{importTip}</p>
          )}

          {importPreview.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-gray-500">游客信息</div>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {importPreview.map((guest) => (
                  <div key={`${guest.source}-${guest.id}`} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{guest.name}</div>
                        <div className="mt-0.5 truncate text-[10px] text-gray-400">{guest.roomLabel}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{guest.guestType}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{guest.gender}</span>
                          {guest.age && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{guest.age}岁</span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              guest.priceTypeLabel === '区域价'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {guest.priceTypeLabel}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${guest.source === 'ocr' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {guest.source === 'ocr' ? 'OCR' : '导入'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <div className="truncate font-mono">{guest.idNum}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span>{guest.phone || '-'}</span>
                        <span className="shrink-0 font-medium tabular-nums text-gray-900">
                          {formatCurrency(guest.ticketPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-8 text-center text-xs text-gray-400">
              导入名单或 OCR 识别后，将在此显示游客卡片
            </div>
          )}
        </aside>
      </div>

      {incompleteTip && (
        <div className="mt-3 flex items-center justify-end gap-1 text-right text-sm text-red-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {incompleteTip}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">全陪票信息</div>
            <div className="mt-1 text-xs text-gray-500">用于录入团队全陪票，最多可添加 2 张，不占用房间旅客名额。</div>
          </div>
          <button
            type="button"
            onClick={addEscortTicket}
            disabled={escortTickets.length >= 2}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> 新增全陪票
          </button>
        </div>
        {escortTickets.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">当前未添加全陪票</div>
        ) : (
          <div className="space-y-3 p-4">
            {escortTickets.map((ticket, index) => (
              <div key={ticket.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800">全陪票 {index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeEscortTicket(ticket.id)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 删除
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <label className="space-y-1">
                    <span className="block text-xs text-gray-500">姓名 <span className="text-red-500">*</span></span>
                    <input
                      value={ticket.name}
                      onChange={(e) => updateEscortTicket(ticket.id, 'name', e.target.value)}
                      className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="请输入姓名"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-gray-500">证件类型</span>
                    <select
                      value={ticket.idType}
                      onChange={(e) => updateEscortTicket(ticket.id, 'idType', e.target.value)}
                      className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                    >
                      {idTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-gray-500">证件号码 <span className="text-red-500">*</span></span>
                    <input
                      value={ticket.idNum}
                      onChange={(e) => updateEscortTicket(ticket.id, 'idNum', e.target.value)}
                      className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="请输入证件号码"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-gray-500">手机号</span>
                    <input
                      value={ticket.phone}
                      onChange={(e) => updateEscortTicket(ticket.id, 'phone', e.target.value)}
                      className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="请输入手机号"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-gray-500">备注</span>
                    <input
                      value={ticket.remark}
                      onChange={(e) => updateEscortTicket(ticket.id, 'remark', e.target.value)}
                      className="h-9 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="如：领队/导游"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddTeamOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">新增团名</h3>
              <button onClick={() => setAddTeamOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-500">同一团下可包含多种房型，便于按旅行团分组管理游客。</p>
            <label className="mb-2 block text-sm text-gray-600">团名</label>
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="如：华东旅行社一团"
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && addTeam()}
            />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setAddTeamOpen(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={addTeam} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">确认新增</button>
            </div>
          </div>
        </div>
      )}

      {addRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddRoomOpen(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">新增房型</h3>
              <button onClick={() => setAddRoomOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-500">新增一间房，并自动生成该房型的默认入住人空行。</p>
            <label className="mb-2 block text-sm text-gray-600">所属团</label>
            <select
              value={newRoomTeamId}
              onChange={(e) => setNewRoomTeamId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <label className="mb-2 block text-sm text-gray-600">航段</label>
            <select
              value={newRoomSegmentId}
              onChange={(e) => setNewRoomSegmentId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {bookingSegmentOptions.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.startPort} → {segment.endPort}
                </option>
              ))}
            </select>
            <label className="mb-2 block text-sm text-gray-600">房型</label>
            <select
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {roomTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              将新增房间 <strong className="text-gray-900">{nextRoomSeq}</strong>，
              航段 <strong className="text-gray-900">{getSegmentLabel(newRoomSegmentId)}</strong>，
              默认添加 <strong className="text-gray-900">{defaultGuestCount(newRoomType)}</strong> 位游客
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setAddRoomOpen(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={addRoomGroup} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">确认新增</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <button className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50" onClick={onPrev}>
          {mode === 'order-edit' ? '← 返回订单列表' : '← 上一步：占舱'}
        </button>
        {mode === 'order-edit' ? (
          <button
            className={`rounded-md px-6 py-2 font-medium shadow-sm transition-colors ${canProceed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}
            disabled={!canProceed}
            onClick={() => onNext({ touristList, teams, roomGroups, escortTickets })}
          >
            提交信息
          </button>
        ) : (
          <button
            className={`rounded-md px-6 py-2 font-medium shadow-sm transition-colors ${canProceed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}
            disabled={!canProceed}
            onClick={() => onNext({ touristList, teams, roomGroups, escortTickets })}
          >
            下一步：订单确认 →
          </button>
        )}
      </div>
    </div>
  )
}
