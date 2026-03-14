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
      <span style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>
        {props.description}
      </span>
    </button>
  )
}

function StepButton(props: {
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--foreground)',
        fontWeight: 800,
        fontSize: 18,
        lineHeight: 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
      }}
      aria-label={props.label}
      title={props.label}
    >
      {props.label}
    </button>
  )
}

export default function SiteSettingsPanel({ onSaved }: Props) {
  const { isEnglish } = useLanguage()
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SITE_SETTINGS
    return loadSiteSettingsFromStorage()
  })
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const [extraFieldsOpen, setExtraFieldsOpen] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')

  function updateSettings(patch: Partial<SiteSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setStatus('')
  }

  function updateFrontmatterPreference(
    patch: Partial<SiteSettings['frontmatterPreferences']>,
  ) {
    setSettings((prev) => ({
      ...prev,
      frontmatterPreferences: {
        ...prev.frontmatterPreferences,
        ...patch,
      },
    }))
    setDirty(true)
    setStatus('')
  }

  function handleSave() {
    saveSiteSettingsToStorage(settings)
    setDirty(false)
    setStatus(isEnglish ? 'Preferences saved.' : '偏好已保存。')
    onSaved?.()
  }

  function addExtraBasicField() {
    const nextId = `extra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    updateFrontmatterPreference({
      extraBasicInfoFields: [
        ...settings.frontmatterPreferences.extraBasicInfoFields,
        { id: nextId, key: '', type: 'text' },
      ],
    })
  }

  function updateExtraBasicField(
    fieldId: string,
    patch: Partial<(typeof settings.frontmatterPreferences.extraBasicInfoFields)[number]>,
  ) {
    updateFrontmatterPreference({
      extraBasicInfoFields: settings.frontmatterPreferences.extraBasicInfoFields.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field,
      ),
    })
  }

  function removeExtraBasicField(fieldId: string) {
    updateFrontmatterPreference({
      extraBasicInfoFields: settings.frontmatterPreferences.extraBasicInfoFields.filter(
        (field) => field.id !== fieldId,
      ),
    })
  }

  function adjustWidth(delta: number) {
    updateSettings({
      imageMaxWidth: Math.min(4096, Math.max(640, settings.imageMaxWidth + delta)),
    })
  }

  function adjustQuality(delta: number) {
    const next = Math.min(1, Math.max(0.4, settings.imageQuality + delta))
    updateSettings({ imageQuality: Number(next.toFixed(2)) })
  }

  function adjustTimezone(delta: number) {
    updateSettings({
      timezoneOffsetHours: Math.min(14, Math.max(-12, settings.timezoneOffsetHours + delta)),
    })
  }

  function addCategoryPreset() {
    const next = categoryInput.trim()
    if (!next) return
    const exists = settings.categoriesPreset.some(
      (item) => item.toLowerCase() === next.toLowerCase(),
    )
    if (exists) {
      setCategoryInput('')
      return
    }
    updateSettings({
      categoriesPreset: [...settings.categoriesPreset, next],
    })
    setCategoryInput('')
  }

  function removeCategoryPreset(value: string) {
    updateSettings({
      categoriesPreset: settings.categoriesPreset.filter(
        (item) => item.toLowerCase() !== value.toLowerCase(),
      ),
    })
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
      <div style={{ order: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>
          {isEnglish ? 'Publishing Preferences' : '发布偏好'}
        </h2>
        <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          {settings.imageConversionEnabled
            ? isEnglish
              ? `Convert to WebP by default, max width ${settings.imageMaxWidth}px, quality ${settings.imageQuality.toFixed(2)}.`
              : `默认压缩并转 WebP，最大宽度 ${settings.imageMaxWidth}px，质量 ${settings.imageQuality.toFixed(2)}。`
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
        {status ? (
          <div style={{ marginTop: 6, fontSize: 13, color: '#1677ff' }}>{status}</div>
        ) : null}
      </div>

      <section
        style={{
          order: 1,
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
            {isEnglish ? '1. Image Conversion' : '1. 图片转换压缩'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 34px', gap: 8, alignItems: 'center' }}>
              <StepButton
                disabled={!settings.imageConversionEnabled}
                label="-"
                onClick={() => adjustWidth(-1)}
              />
              <input
                type="range"
                min={640}
                max={4096}
                step={1}
                value={settings.imageMaxWidth}
                disabled={!settings.imageConversionEnabled}
                onChange={(e) => updateSettings({ imageMaxWidth: Number(e.target.value) })}
              />
              <StepButton
                disabled={!settings.imageConversionEnabled}
                label="+"
                onClick={() => adjustWidth(1)}
              />
            </div>
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{isEnglish ? 'Quality' : '转换质量'}</span>
              <span>{settings.imageQuality.toFixed(2)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 34px', gap: 8, alignItems: 'center' }}>
              <StepButton
                disabled={!settings.imageConversionEnabled}
                label="-"
                onClick={() => adjustQuality(-0.01)}
              />
              <input
                type="range"
                min={0.4}
                max={1}
                step={0.01}
                value={settings.imageQuality}
                disabled={!settings.imageConversionEnabled}
                onChange={(e) => updateSettings({ imageQuality: Number(e.target.value) })}
              />
              <StepButton
                disabled={!settings.imageConversionEnabled}
                label="+"
                onClick={() => adjustQuality(0.01)}
              />
            </div>
          </label>
        </div>
      </section>

      <section
        style={{
          order: 5,
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
            {isEnglish ? '5. Categories Preset' : '5. 固定分类设置'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Define reusable categories here. Editor will provide a multi-select dropdown.'
              : '在这里维护常用分类。编辑器里会提供可多选下拉。'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
          <input
            type="text"
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCategoryPreset()
              }
            }}
            placeholder={isEnglish ? 'Add category, e.g. notes' : '添加分类，例如 notes'}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
            }}
          />
          <button
            type="button"
            onClick={addCategoryPreset}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isEnglish ? 'Add' : '添加'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {settings.categoriesPreset.length ? (
            settings.categoriesPreset.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeCategoryPreset(item)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
                title={isEnglish ? 'Tap to remove' : '点击删除'}
              >
                {item} ×
              </button>
            ))
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {isEnglish ? 'No preset categories yet.' : '还没有固定分类。'}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          order: 4,
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
            {isEnglish ? '4. Frontmatter Timezone' : '4. Frontmatter时区设置'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Used for the fixed `date` field when creating a new post.'
              : '用于新建文章时 frontmatter 固定 date 字段。'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 34px', gap: 8, alignItems: 'center' }}>
          <StepButton label="-" onClick={() => adjustTimezone(-1)} />
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            {`UTC${settings.timezoneOffsetHours >= 0 ? '+' : ''}${settings.timezoneOffsetHours}`}
          </div>
          <StepButton label="+" onClick={() => adjustTimezone(1)} />
        </div>
      </section>

      <section
        style={{
          order: 2,
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
            {isEnglish ? '2. Auto Image Naming' : '2. 图片自动命名'}
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
      </section>

      <section
        style={{
          order: 3,
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
            {isEnglish ? '3. Basic Info Fields' : '3. Basic info 字段设置'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Title, Date, and Draft are fixed in editor. Configure optional fields below.'
              : 'Title、Date、Draft 在编辑器中固定显示。以下仅配置可选字段。'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {isEnglish ? 'Slug field name' : 'Slug 字段名'}
            </div>
            <input
              type="text"
              value={settings.frontmatterPreferences.slugFieldName}
              onChange={(event) =>
                updateFrontmatterPreference({ slugFieldName: event.target.value })
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
            />
            <ChoiceButton
              active={settings.frontmatterPreferences.slugFieldEnabled}
              label={settings.frontmatterPreferences.slugFieldEnabled ? (isEnglish ? 'Show in Editor' : '在编辑器显示') : (isEnglish ? 'Hidden in Editor' : '在编辑器隐藏')}
              description={isEnglish ? 'If hidden, slug is omitted when publishing.' : '隐藏后发布时将不输出 slug 字段。'}
              onClick={() =>
                updateFrontmatterPreference({
                  slugFieldEnabled: !settings.frontmatterPreferences.slugFieldEnabled,
                })
              }
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {isEnglish ? 'Categories field name' : 'Categories 字段名'}
            </div>
            <input
              type="text"
              value={settings.frontmatterPreferences.categoriesFieldName}
              onChange={(event) =>
                updateFrontmatterPreference({
                  categoriesFieldName: event.target.value,
                })
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
            />
            <ChoiceButton
              active={settings.frontmatterPreferences.categoriesFieldEnabled}
              label={settings.frontmatterPreferences.categoriesFieldEnabled ? (isEnglish ? 'Show in Editor' : '在编辑器显示') : (isEnglish ? 'Hidden in Editor' : '在编辑器隐藏')}
              description={isEnglish ? 'If hidden, categories are omitted when publishing.' : '隐藏后发布时将不输出 categories 字段。'}
              onClick={() =>
                updateFrontmatterPreference({
                  categoriesFieldEnabled:
                    !settings.frontmatterPreferences.categoriesFieldEnabled,
                })
              }
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {isEnglish ? 'Tags field name' : 'Tags 字段名'}
            </div>
            <input
              type="text"
              value={settings.frontmatterPreferences.tagsFieldName}
              onChange={(event) =>
                updateFrontmatterPreference({ tagsFieldName: event.target.value })
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
            />
            <ChoiceButton
              active={settings.frontmatterPreferences.tagsFieldEnabled}
              label={settings.frontmatterPreferences.tagsFieldEnabled ? (isEnglish ? 'Show in Editor' : '在编辑器显示') : (isEnglish ? 'Hidden in Editor' : '在编辑器隐藏')}
              description={isEnglish ? 'If hidden, tags are omitted when publishing.' : '隐藏后发布时将不输出 tags 字段。'}
              onClick={() =>
                updateFrontmatterPreference({
                  tagsFieldEnabled: !settings.frontmatterPreferences.tagsFieldEnabled,
                })
              }
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {isEnglish ? 'Cover image field name' : '封面图字段名'}
            </div>
            <input
              type="text"
              value={settings.frontmatterPreferences.coverImageFieldName}
              onChange={(event) =>
                updateFrontmatterPreference({
                  coverImageFieldName: event.target.value,
                })
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
              }}
            />
            <ChoiceButton
              active={settings.frontmatterPreferences.coverImageFieldEnabled}
              label={settings.frontmatterPreferences.coverImageFieldEnabled ? (isEnglish ? 'Show in Editor' : '在编辑器显示') : (isEnglish ? 'Hidden in Editor' : '在编辑器隐藏')}
              description={isEnglish ? 'If hidden, cover image field is omitted when publishing.' : '隐藏后发布时将不输出封面图字段。'}
              onClick={() =>
                updateFrontmatterPreference({
                  coverImageFieldEnabled:
                    !settings.frontmatterPreferences.coverImageFieldEnabled,
                })
              }
            />
          </label>

          <div
            style={{
              marginTop: 6,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--card)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setExtraFieldsOpen((prev) => !prev)}
              style={{
                width: '100%',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                border: 'none',
                background: 'transparent',
                color: 'var(--foreground)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <span>
                {isEnglish
                  ? 'More Common Fields (Optional)'
                  : '更多常用字段（可选）'}
              </span>
              <span
                style={{
                  transform: extraFieldsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 160ms ease',
                  fontSize: 12,
                }}
                aria-hidden="true"
              >
                ▼
              </span>
            </button>

            {extraFieldsOpen ? (
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  padding: 12,
                  display: 'grid',
                  gap: 10,
                  background: 'var(--card-muted)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish
                    ? 'Add fields that should always appear in editor Basic Info, such as `series`, `aliases`, or `featured-image-alt`.'
                    : '添加需要固定出现在编辑器 Basic Info 的字段，例如 `series`、`aliases`、`featured-image-alt`。'}
                </div>

                {settings.frontmatterPreferences.extraBasicInfoFields.map((field) => (
                  <div
                    key={field.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 10,
                      background: 'var(--card)',
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <input
                      type="text"
                      value={field.key}
                      onChange={(event) =>
                        updateExtraBasicField(field.id, {
                          key: event.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9_-]/g, ''),
                        })
                      }
                      placeholder={isEnglish ? 'Field key' : '字段名'}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <select
                        value={field.type}
                        onChange={(event) =>
                          updateExtraBasicField(field.id, {
                            type: event.target.value === 'list' ? 'list' : 'text',
                          })
                        }
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                        }}
                      >
                        <option value="text">{isEnglish ? 'Text' : '文本'}</option>
                        <option value="list">
                          {isEnglish ? 'List (comma-separated)' : '列表（逗号分隔）'}
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeExtraBasicField(field.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)',
                          background: 'var(--card)',
                          color: 'var(--danger)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isEnglish ? 'Remove' : '删除'}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExtraBasicField}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--accent)',
                    background: 'var(--card)',
                    color: 'var(--accent-soft-text)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isEnglish ? '+ Add Common Field' : '+ 添加常用字段'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        style={{
          order: 6,
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
  )
}
