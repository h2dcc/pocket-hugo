'use client'

import { useState } from 'react'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  saveSiteSettingsToStorage,
  type SiteSettings,
} from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'

type Props = {
  onSaved?: () => void
}

function ChoiceButton(props: {
  active: boolean
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        textAlign: 'left',
        padding: '14px 14px',
        borderRadius: 14,
        border: props.active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: props.active ? 'var(--accent)' : 'var(--card)',
        color: props.active ? 'var(--accent-contrast)' : 'var(--foreground)',
        cursor: 'pointer',
        display: 'grid',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700 }}>{props.label}</span>
      <span style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>{props.description}</span>
    </button>
  )
}

export default function SiteSettingsPanel({ onSaved }: Props) {
  const { isEnglish } = useLanguage()
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SITE_SETTINGS
    }

    return loadSiteSettingsFromStorage()
  })
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)

  function updateSettings(patch: Partial<SiteSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setStatus('')
  }

  function handleSave() {
    saveSiteSettingsToStorage(settings)
    setDirty(false)
    setStatus(isEnglish ? 'Preferences saved.' : '偏好已保存。')
    onSaved?.()
  }

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        background: 'var(--card)',
        display: 'grid',
        gap: 16,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>
          {isEnglish ? 'Publishing Preferences' : '发布偏好'}
        </h2>
        <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          {settings.imageConversionEnabled
            ? isEnglish
              ? `Convert to WebP by default, max width ${settings.imageMaxWidth}px, quality ${settings.imageQuality}.`
              : `默认压缩并转 WebP，最大宽度 ${settings.imageMaxWidth}px，质量 ${settings.imageQuality}。`
            : isEnglish
              ? 'Keep the original image format by default.'
              : '默认保留原图格式。'}{' '}
          {settings.autoImageNamingEnabled
            ? isEnglish
              ? 'Auto-number file names.'
              : '自动编号命名。'
            : isEnglish
              ? 'Keep original file names.'
              : '保留原始文件名。'}
        </div>
        {status ? <div style={{ marginTop: 6, fontSize: 13, color: '#1677ff' }}>{status}</div> : null}
      </div>

      <section
        style={{
          display: 'grid',
          gap: 10,
          padding: 14,
          borderRadius: 16,
          border: '1px solid var(--border)',
          background: 'var(--card-muted)',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {isEnglish ? 'Image Conversion' : '图片转换压缩'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Better for Hugo page bundles and lighter mobile uploads.'
              : '更适合 Hugo page bundle，也更适合手机上传。'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ChoiceButton
            active={settings.imageConversionEnabled}
            label={isEnglish ? 'Enabled' : '开启'}
            description={
              isEnglish ? 'Convert and compress uploads into WebP' : '上传时自动压缩并转为 WebP'
            }
            onClick={() => updateSettings({ imageConversionEnabled: true })}
          />
          <ChoiceButton
            active={!settings.imageConversionEnabled}
            label={isEnglish ? 'Disabled' : '关闭'}
            description={
              isEnglish ? 'Keep original format and dimensions' : '保留原图格式和原始尺寸'
            }
            onClick={() => updateSettings({ imageConversionEnabled: false })}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            opacity: settings.imageConversionEnabled ? 1 : 0.55,
          }}
        >
          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{isEnglish ? 'Max Width' : '最大宽度'}</span>
              <span>{settings.imageMaxWidth}px</span>
            </div>
            <input
              type="range"
              min={640}
              max={4096}
              step={1}
              value={settings.imageMaxWidth}
              disabled={!settings.imageConversionEnabled}
              onChange={(e) => updateSettings({ imageMaxWidth: Number(e.target.value) })}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{isEnglish ? 'Quality' : '转换质量'}</span>
              <span>{settings.imageQuality.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.01}
              value={settings.imageQuality}
              disabled={!settings.imageConversionEnabled}
              onChange={(e) => updateSettings({ imageQuality: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 10,
          padding: 14,
          borderRadius: 16,
          border: '1px solid var(--border)',
          background: 'var(--card-muted)',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {isEnglish ? 'Auto Image Naming' : '图片自动命名'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Useful when uploading multiple images from a phone.'
              : '适合手机连续上传图片时减少手动整理文件名。'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ChoiceButton
            active={settings.autoImageNamingEnabled}
            label={isEnglish ? 'Auto Numbering' : '自动编号'}
            description={
              isEnglish ? 'Use names like 1.webp and 2.webp' : '使用 1.webp、2.webp 这类名称'
            }
            onClick={() => updateSettings({ autoImageNamingEnabled: true })}
          />
          <ChoiceButton
            active={!settings.autoImageNamingEnabled}
            label={isEnglish ? 'Keep Original' : '保留原名'}
            description={
              isEnglish
                ? 'Reuse original file names and avoid collisions automatically'
                : '尽量沿用原始文件名并自动避重'
            }
            onClick={() => updateSettings({ autoImageNamingEnabled: false })}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            marginTop: 4,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: dirty ? 'var(--accent)' : 'var(--card)',
            color: dirty ? 'var(--accent-contrast)' : 'var(--foreground)',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {isEnglish ? 'Save Preferences' : '保存偏好'}
        </button>
      </section>
    </section>
  )
}
