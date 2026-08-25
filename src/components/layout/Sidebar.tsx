import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { findGroupKeyByPath, findModuleByPath, isMenuPathMatch } from '@/config/adminMenu'

export default function Sidebar() {
  const location = useLocation()
  const currentModule = findModuleByPath(location.pathname)
  const activeGroupKey = findGroupKeyByPath(currentModule, location.pathname)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpanded({})
  }, [currentModule.key])

  const isGroupOpen = useMemo(() => {
    return (groupKey: string) => expanded[groupKey] ?? (activeGroupKey ? groupKey === activeGroupKey : true)
  }, [expanded, activeGroupKey])

  const toggle = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? (activeGroupKey ? key === activeGroupKey : true)),
    }))
  }

  return (
    <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0 h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-800 text-xs font-medium tracking-wide text-gray-500 uppercase">
        {currentModule.label}
      </div>
      <nav className="flex-1 py-2">
        {currentModule.groups.map((group) => {
          const open = isGroupOpen(group.key)
          const groupActive = group.children.some((c) => isMenuPathMatch(location.pathname, c.path))
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors ${
                  groupActive ? 'text-white' : ''
                }`}
              >
                <span className="flex-1 text-left font-medium">{group.label}</span>
                {open ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                )}
              </button>
              {open && (
                <div className="bg-gray-950/50">
                  {group.children.map((child) => (
                    <NavLink
                      key={child.key}
                      to={child.path}
                      className={() =>
                        `block pl-8 pr-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                          isMenuPathMatch(location.pathname, child.path)
                            ? 'text-white bg-blue-600/20 border-r-2 border-blue-500'
                            : ''
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
