import { useEffect, useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

const toolbarButtonClass = 'rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900'

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  minHeight = '140px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || syncingRef.current) return
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ''
    }
  }, [value])

  const syncValue = () => {
    const editor = editorRef.current
    if (!editor) return
    syncingRef.current = true
    onChange(editor.innerHTML)
    queueMicrotask(() => {
      syncingRef.current = false
    })
  }

  const exec = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command)
    syncValue()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
      <div className="flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button type="button" title="加粗" onClick={() => exec('bold')} className={toolbarButtonClass}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="斜体" onClick={() => exec('italic')} className={toolbarButtonClass}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="下划线" onClick={() => exec('underline')} className={toolbarButtonClass}>
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-4 w-px bg-gray-300" />
        <button type="button" title="无序列表" onClick={() => exec('insertUnorderedList')} className={toolbarButtonClass}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="有序列表" onClick={() => exec('insertOrderedList')} className={toolbarButtonClass}>
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        data-placeholder={placeholder}
        className="rich-text-editor w-full px-3 py-2 text-sm text-gray-900 outline-none"
        style={{ minHeight }}
      />
    </div>
  )
}

export function RichTextContent({ html, className = '' }: { html?: string; className?: string }) {
  const text = (html || '').trim()
  if (!text) return <span className="text-gray-400">-</span>
  if (!/<[^>]+>/.test(text)) return <span className={className}>{text}</span>
  return (
    <div
      className={`rich-text-content text-sm leading-relaxed text-gray-900 ${className}`}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  )
}
