'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLanguage } from '@/lib/use-language'

type MarkdownComposerProps = {
  value: string
  onChange: (value: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  minHeight?: number
  editorHeight?: number
  onEditorHeightChange?: (height: number) => void
  showHeightControls?: boolean
  placeholder?: string
  disabled?: boolean
}

type ToolbarAction = {
  key: string
  labelEn: string
  labelZh: string
  short: string
  run: (selected: string) => { text: string; cursorOffset: number; selectionLength?: number }
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    key: 'h2',
    labelEn: 'Heading 2',
    labelZh: '\u4e8c\u7ea7\u6807\u9898',
    short: '##',
    run: (selected) => {
      if (selected) return { text: `## ${selected}`, cursorOffset: 3, selectionLength: selected.length }
      return { text: '## ', cursorOffset: 3 }
    },
  },
  {
    key: 'h3',
    labelEn: 'Heading 3',
    labelZh: '\u4e09\u7ea7\u6807\u9898',
    short: '###',
    run: (selected) => {
      if (selected) return { text: `### ${selected}`, cursorOffset: 4, selectionLength: selected.length }
      return { text: '### ', cursorOffset: 4 }
    },
  },
  {
    key: 'bold',
    labelEn: 'Bold',
    labelZh: '\u52a0\u7c97',
    short: 'B',
    run: (selected) => {
      if (selected) return { text: `**${selected}**`, cursorOffset: 2, selectionLength: selected.length }
      return { text: '****', cursorOffset: 2 }
    },
  },
  {
    key: 'italic',
    labelEn: 'Italic',
    labelZh: '\u659c\u4f53',
    short: 'I',
    run: (selected) => {
      if (selected) return { text: `*${selected}*`, cursorOffset: 1, selectionLength: selected.length }
      return { text: '**', cursorOffset: 1 }
    },
  },
  {
    key: 'list',
    labelEn: 'List',
    labelZh: '\u5217\u8868',
    short: '-',
    run: () => ({ text: '\n- ', cursorOffset: 3 }),
  },
  {
    key: 'quote',
    labelEn: 'Quote',
    labelZh: '\u5f15\u7528',
    short: '>"',
    run: () => ({ text: '\n> ', cursorOffset: 3 }),
  },
  {
    key: 'code',
    labelEn: 'Code',
    labelZh: '\u4ee3\u7801',
    short: '</>',
    run: (selected) => {
      if (selected) return { text: `\`${selected}\``, cursorOffset: 1, selectionLength: selected.length }
      return { text: '``', cursorOffset: 1 }
    },
  },
  {
    key: 'codeblock',
    labelEn: 'Code Block',
    labelZh: '\u4ee3\u7801\u5757',
    short: '{}',
    run: () => ({ text: '\n```\n\n```\n', cursorOffset: 5 }),
  },
  {
    key: 'link',
    labelEn: 'Link',
    labelZh: '\u94fe\u63a5',
    short: '[]()',
    run: (selected) => {
      if (selected) return { text: `[${selected}]()`, cursorOffset: selected.length + 3 }
      return { text: '[]()', cursorOffset: 1 }
    },
  },
  {
    key: 'divider',
    labelEn: 'Divider',
    labelZh: '\u5206\u9694\u7ebf',
    short: '---',
    run: () => ({ text: '\n---\n', cursorOffset: 5 }),
  },
  {
    key: 'more',
    labelEn: 'More',
    labelZh: '\u6458\u8981',
    short: '<!>',
    run: () => ({ text: '\n<!--more-->\n', cursorOffset: 12 }),
  },
  {
    key: 'table',
    labelEn: 'Table',
    labelZh: '\u8868\u683c',
    short: '|',
    run: () => ({ text: '\n|  |  |\n| --- | --- |\n|  |  |\n', cursorOffset: 3 }),
  },
]

function detectCoarsePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

function clampEditorHeight(height: number) {
  return Math.min(960, Math.max(180, height))
}

export default function MarkdownComposer({
  value,
  onChange,
  textareaRef,
  minHeight = 320,
  editorHeight,
  onEditorHeightChange,
  showHeightControls = true,
  placeholder,
  disabled = false,
}: MarkdownComposerProps) {
  const { isEnglish } = useLanguage()
  const [isMobileLike, setIsMobileLike] = useState(false)
  const [internalEditorHeight, setInternalEditorHeight] = useState(minHeight)
  const pendingSelectionRef = useRef<{ start: number; end: number; scrollTop: number } | null>(null)
  const resolvedEditorHeight = editorHeight ?? internalEditorHeight

  useEffect(() => {
    const sync = () => setIsMobileLike(detectCoarsePointer())

    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  useEffect(() => {
    const pending = pendingSelectionRef.current
    const textarea = textareaRef.current
    if (!pending || !textarea) return

    requestAnimationFrame(() => {
      textarea.scrollTop = pending.scrollTop
      textarea.setSelectionRange(pending.start, pending.end)
      pendingSelectionRef.current = null
    })
  }, [textareaRef, value])

  function handleChange(nextValue: string) {
    const textarea = textareaRef.current
    if (textarea) {
      pendingSelectionRef.current = {
        start: textarea.selectionStart ?? nextValue.length,
        end: textarea.selectionEnd ?? nextValue.length,
        scrollTop: textarea.scrollTop,
      }
    }
    onChange(nextValue)
  }

  function insertAction(action: ToolbarAction) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    const result = action.run(selected)
    const nextValue = value.slice(0, start) + result.text + value.slice(end)
    const cursorStart = start + result.cursorOffset
    const cursorEnd =
      typeof result.selectionLength === 'number'
        ? cursorStart + result.selectionLength
        : cursorStart

    pendingSelectionRef.current = {
      start: cursorStart,
      end: cursorEnd,
      scrollTop: textarea?.scrollTop ?? 0,
    }

    onChange(nextValue)

    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  function updateEditorHeight(nextHeight: number) {
    const clampedHeight = clampEditorHeight(nextHeight)
    if (typeof onEditorHeightChange === 'function') {
      onEditorHeightChange(clampedHeight)
      return
    }
    setInternalEditorHeight(clampedHeight)
  }

  function adjustHeight(delta: number) {
    updateEditorHeight(resolvedEditorHeight + delta)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  function resetHeight() {
    updateEditorHeight(minHeight)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  const toolbar = (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: '8px',
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--card) 92%, white 8%)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertAction(action)}
            style={{
              minWidth: 42,
              height: 34,
              padding: '0 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label={isEnglish ? action.labelEn : action.labelZh}
            title={isEnglish ? action.labelEn : action.labelZh}
          >
            {action.short}
          </button>
        ))}
      </div>

      {showHeightControls ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => adjustHeight(-80)}
            style={{
              minWidth: 36,
              height: 32,
              padding: '0 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--card-muted)',
              color: 'var(--foreground)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={isEnglish ? 'Shorter' : '\u51cf\u5c0f'}
            aria-label={isEnglish ? 'Shorter' : '\u51cf\u5c0f'}
          >
            -
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={resetHeight}
            style={{
              minWidth: 54,
              height: 32,
              padding: '0 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--card-muted)',
              color: 'var(--foreground)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={isEnglish ? 'Reset height' : '\u6062\u590d\u9ed8\u8ba4\u9ad8\u5ea6'}
            aria-label={isEnglish ? 'Reset height' : '\u6062\u590d\u9ed8\u8ba4\u9ad8\u5ea6'}
          >
            {isEnglish ? 'Fit' : '\u9ed8\u8ba4'}
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => adjustHeight(80)}
            style={{
              minWidth: 36,
              height: 32,
              padding: '0 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--card-muted)',
              color: 'var(--foreground)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={isEnglish ? 'Taller' : '\u589e\u5927'}
            aria-label={isEnglish ? 'Taller' : '\u589e\u5927'}
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: isMobileLike ? 6 : 10 }}>
      {isMobileLike ? null : toolbar}
      <textarea
        className="markdown-composer-textarea"
        ref={textareaRef}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        rows={12}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 14,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--foreground)',
          fontSize: 14,
          lineHeight: 1.7,
          minHeight: resolvedEditorHeight,
          height: resolvedEditorHeight,
          resize: 'none',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarColor: 'var(--composer-scroll-thumb) var(--composer-scroll-track)',
        }}
      />
      {isMobileLike ? toolbar : null}
    </div>
  )
}
