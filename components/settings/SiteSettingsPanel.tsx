'use client'

import { useState } from 'react'
import type { SiteSettings } from '@/lib/site-settings'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  saveSiteSettingsToStorage,
} from '@/lib/site-settings'

type Props = {
  onSaved?: () => void
}

export default function SiteSettingsPanel({ onSaved }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SITE_SETTINGS
    }

    return loadSiteSettingsFromStorage()
  })
  const [status, setStatus] = useState('')

  function updateSettings(patch: Partial<SiteSettings>) {
    setSettings((prev) => {
      const nextSettings = {
        ...prev,
        ...patch,
      }
      saveSiteSettingsToStorage(nextSettings)
      setStatus('设置已保存')
      onSaved?.()
      return nextSettings
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    fontSize: 16,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        background: 'var(--card)',
        display: 'grid',
        gap: 14,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>发布偏好</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
          {settings.imageConversionEnabled
            ? `默认压缩并转 webp，宽度 ${settings.imageMaxWidth}px，质量 ${settings.imageQuality}`
            : '默认保留原图格式'}
          ，{settings.autoImageNamingEnabled ? '自动编号命名' : '保留原始文件名'}。
        </div>
        {status ? (
          <div style={{ marginTop: 6, fontSize: 13, color: '#1677ff' }}>{status}</div>
        ) : null}
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: 12,
          borderRadius: 12,
          background: 'var(--card-muted)',
        }}
      >
        <span style={{ fontWeight: 600 }}>默认开启图片转换压缩</span>
        <input
          type="checkbox"
          checked={settings.imageConversionEnabled}
          onChange={(e) => updateSettings({ imageConversionEnabled: e.target.checked })}
        />
      </label>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>图片最大宽度</span>
          <input
            type="number"
            min={320}
            step={10}
            value={settings.imageMaxWidth}
            onChange={(e) =>
              updateSettings({
                imageMaxWidth: Number(e.target.value || DEFAULT_SITE_SETTINGS.imageMaxWidth),
              })
            }
            disabled={!settings.imageConversionEnabled}
            style={{
              ...inputStyle,
              opacity: settings.imageConversionEnabled ? 1 : 0.6,
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>转换质量（0.1 - 1.0）</span>
          <input
            type="number"
            min={0.1}
            max={1}
            step={0.01}
            value={settings.imageQuality}
            onChange={(e) =>
              updateSettings({
                imageQuality: Number(e.target.value || DEFAULT_SITE_SETTINGS.imageQuality),
              })
            }
            disabled={!settings.imageConversionEnabled}
            style={{
              ...inputStyle,
              opacity: settings.imageConversionEnabled ? 1 : 0.6,
            }}
          />
        </label>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: 12,
          borderRadius: 12,
          background: 'var(--card-muted)',
        }}
      >
        <span style={{ fontWeight: 600 }}>图片名称自动编号</span>
        <input
          type="checkbox"
          checked={settings.autoImageNamingEnabled}
          onChange={(e) => updateSettings({ autoImageNamingEnabled: e.target.checked })}
        />
      </label>
    </section>
  )
}
