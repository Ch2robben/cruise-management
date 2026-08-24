import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import {
  domesticRegionTree,
  overseasRegionTree,
  type PolicyRegionNode,
  type RegionScopeKind,
} from '@/mock/pricePolicyRegions'

export interface SelectedPolicyRegion {
  code: string
  label: string
  pathLabel: string
  path: string[]
  scope: RegionScopeKind
}

interface PolicyRegionPickerProps {
  /** regions：完整树勾选；scopes：仅勾选境内/境外根节点（全域价） */
  variant?: 'regions' | 'scopes'
  value: SelectedPolicyRegion[]
  onChange: (next: SelectedPolicyRegion[]) => void
}

interface TreeNode {
  key: string
  code: string
  label: string
  path: string[]
  pathLabel: string
  scope: RegionScopeKind
  children: TreeNode[]
}

function buildNodes(
  nodes: PolicyRegionNode[],
  scope: RegionScopeKind,
  parentPath: string[] = [],
): TreeNode[] {
  return nodes.map((node) => {
    const path = [...parentPath, node.label]
    return {
      key: `${scope}:${node.code}:${path.join('/')}`,
      code: node.code,
      label: node.label,
      path,
      pathLabel: path.join(' / '),
      scope,
      children: node.children?.length ? buildNodes(node.children, scope, path) : [],
    }
  })
}

function toSelected(node: TreeNode): SelectedPolicyRegion {
  return {
    code: node.code,
    label: node.label,
    pathLabel: node.pathLabel,
    path: node.path,
    scope: node.scope,
  }
}

function nodeMatches(node: TreeNode, kw: string): boolean {
  if (!kw) return true
  const hay = `${node.label} ${node.pathLabel} ${node.code}`.toLowerCase()
  if (hay.includes(kw)) return true
  return node.children.some((child) => nodeMatches(child, kw))
}

function filterTree(nodes: TreeNode[], kw: string): TreeNode[] {
  if (!kw) return nodes
  return nodes
    .map((node) => {
      if (!nodeMatches(node, kw)) return null
      return { ...node, children: filterTree(node.children, kw) }
    })
    .filter(Boolean) as TreeNode[]
}

function findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    const found = findNodeByKey(node.children, key)
    if (found) return found
  }
  return null
}

/** 搜索命中时，取第一条路径作为默认横向展开路径 */
function firstMatchPath(nodes: TreeNode[], kw: string, trail: TreeNode[] = []): TreeNode[] | null {
  for (const node of nodes) {
    const next = [...trail, node]
    const selfHit = `${node.label} ${node.pathLabel} ${node.code}`.toLowerCase().includes(kw)
    if (selfHit) return next
    const childPath = firstMatchPath(node.children, kw, next)
    if (childPath) return childPath
  }
  return null
}

const SCOPE_ROOTS: TreeNode[] = [
  {
    key: 'scope:domestic',
    code: 'domestic',
    label: '境内',
    path: ['境内'],
    pathLabel: '境内',
    scope: 'domestic',
    children: [],
  },
  {
    key: 'scope:overseas',
    code: 'overseas',
    label: '境外',
    path: ['境外'],
    pathLabel: '境外',
    scope: 'overseas',
    children: [],
  },
]

export default function PolicyRegionPicker({
  variant = 'regions',
  value,
  onChange,
}: PolicyRegionPickerProps) {
  const [keyword, setKeyword] = useState('')
  /** 每一列当前高亮/展开的节点 key（横向级联路径） */
  const [activePath, setActivePath] = useState<string[]>([])

  const regionTree = useMemo<TreeNode[]>(() => [
    {
      key: 'root:domestic',
      code: '__domestic_root__',
      label: '境内',
      path: ['境内'],
      pathLabel: '境内',
      scope: 'domestic',
      children: buildNodes(domesticRegionTree, 'domestic'),
    },
    {
      key: 'root:overseas',
      code: '__overseas_root__',
      label: '境外',
      path: ['境外'],
      pathLabel: '境外',
      scope: 'overseas',
      children: buildNodes(overseasRegionTree, 'overseas'),
    },
  ], [])

  const sourceTree = variant === 'scopes' ? SCOPE_ROOTS : regionTree
  const kw = keyword.trim().toLowerCase()
  const visibleTree = useMemo(() => filterTree(sourceTree, kw), [sourceTree, kw])

  useEffect(() => {
    if (!kw) return
    const path = firstMatchPath(visibleTree, kw)
    if (path) setActivePath(path.map((node) => node.key))
  }, [kw, visibleTree])

  const selectedCodes = useMemo(
    () => new Set(value.map((item) => `${item.scope}:${item.code}`)),
    [value],
  )

  const columns = useMemo(() => {
    const cols: TreeNode[][] = [visibleTree]
    let levelNodes = visibleTree
    for (const key of activePath) {
      const current = levelNodes.find((node) => node.key === key) ?? findNodeByKey(visibleTree, key)
      if (!current || current.children.length === 0) break
      cols.push(current.children)
      levelNodes = current.children
    }
    return cols
  }, [visibleTree, activePath])

  const isChecked = (node: TreeNode) => selectedCodes.has(`${node.scope}:${node.code}`)

  const canCheck = (node: TreeNode) => {
    if (variant === 'scopes') return true
    return node.code !== '__domestic_root__' && node.code !== '__overseas_root__'
  }

  const toggle = (node: TreeNode) => {
    if (!canCheck(node)) return
    if (isChecked(node)) {
      onChange(value.filter((item) => !(item.scope === node.scope && item.code === node.code)))
      return
    }
    onChange([...value, toSelected(node)])
  }

  const activate = (columnIndex: number, node: TreeNode) => {
    setActivePath((prev) => [...prev.slice(0, columnIndex), node.key])
  }

  const remove = (item: SelectedPolicyRegion) => {
    onChange(value.filter((row) => !(row.scope === item.scope && row.code === item.code)))
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={
            variant === 'scopes'
              ? '搜索境内 / 境外'
              : '搜索省市区或洲/国家，支持拼音首字母（如 cq、rb）'
          }
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={`${item.scope}-${item.code}`}
              className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700"
            >
              {variant === 'regions' && (
                <span className="font-mono text-[10px] text-purple-500">{item.code}</span>
              )}
              {item.pathLabel}
              <button
                type="button"
                onClick={() => remove(item)}
                className="rounded-full p-0.5 hover:bg-purple-100"
                aria-label={`移除 ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-100">
        {visibleTree.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-gray-400">无匹配区域</div>
        ) : (
          <div className="flex min-h-[220px] w-max min-w-full">
            {columns.map((nodes, columnIndex) => (
              <ul
                key={`col-${columnIndex}-${activePath[columnIndex - 1] || 'root'}`}
                className="max-h-64 w-44 shrink-0 overflow-y-auto border-r border-gray-100 last:border-r-0"
              >
                {nodes.map((node) => {
                  const hasChildren = node.children.length > 0
                  const active = activePath[columnIndex] === node.key
                  const checked = isChecked(node)
                  const checkable = canCheck(node)
                  return (
                    <li key={node.key}>
                      <div
                        className={`flex items-center gap-1.5 px-2 py-2 text-sm ${
                          active ? 'bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {checkable ? (
                          <button
                            type="button"
                            onClick={() => toggle(node)}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                              checked
                                ? 'border-purple-600 bg-purple-600 text-white'
                                : 'border-gray-300 bg-white text-transparent'
                            }`}
                            aria-label={`${checked ? '取消选择' : '选择'} ${node.label}`}
                          >
                            ✓
                          </button>
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            activate(columnIndex, node)
                            if (!hasChildren && checkable) toggle(node)
                          }}
                          className="flex min-w-0 flex-1 items-center gap-1 text-left"
                        >
                          <span className={`min-w-0 flex-1 truncate ${columnIndex === 0 ? 'font-semibold text-gray-800' : 'text-gray-900'}`}>
                            {node.label}
                          </span>
                          {hasChildren && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        {variant === 'scopes'
          ? '勾选境内/境外即可覆盖对应属地全部游客。'
          : '点选节点向右展开下一级；可勾选任意级。境内按身份证前六位、境外按证件属地匹配。'}
      </p>
    </div>
  )
}
