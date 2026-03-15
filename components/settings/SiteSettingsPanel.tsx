'use client'

import { useState } from 'react'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  saveSiteSettingsToStorage,
  type SiteSettings,
} from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'
import IconButton from '@/components/ui/IconButton'
import SectionToggleButton from '@/components/ui/SectionToggleButton'

type Props = {
  onSaved?: () => void
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ToggleChip(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        border: props.active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: props.active ? 'var(--accent-soft)' : 'var(--card)',
        color: props.active ? 'var(--accent-soft-text)' : 'var(--foreground)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {props.label}
    </button>
  )
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
        padding: '10px 12px',
        borderRadius: 12,
        border: props.active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: props.active ? 'var(--accent)' : 'var(--card)',
        color: props.active ? 'var(--accent-contrast)' : 'var(--foreground)',
        cursor: 'pointer',
        display: 'grid',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700 }}>{props.label}</span>
      <span style={{ fontSize: 11, opacity: 0.82, lineHeight: 1.45 }}>{props.description}</span>
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
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--foreground)',
        fontWeight: 800,
        fontSize: 14,
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

function FieldRow(props: {
  title: string
  value: string
  active: boolean
  onChange: (value: string) => void
  onToggle: () => void
  placeholder?: string
  visibleLabel: string
  hiddenLabel: string
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{props.title}</span>
        <ToggleChip
          active={props.active}
          label={props.active ? props.visibleLabel : props.hiddenLabel}
          onClick={props.onToggle}
        />
      </div>
      <input
        type="text"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        style={{
          padding: '9px 11px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--foreground)',
        }}
      />
    </label>
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
    setSettings(loadSiteSettingsFromStorage())
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
        padding: 14,
        background: 'var(--card)',
        display: 'grid',
        gap: 14,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 14 }}>
          {isEnglish ? 'Publishing Preferences' : '发布偏好'}
        </h2>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          {settings.imageConversionEnabled
            ? isEnglish
              ? `Default upload: WebP, max width ${settings.imageMaxWidth}px, quality ${settings.imageQuality.toFixed(2)}.`
              : `默认上传为 WebP，最大宽度 ${settings.imageMaxWidth}px，质量 ${settings.imageQuality.toFixed(2)}。`
            : isEnglish
              ? 'Default upload keeps original image format.'
              : '默认上传保留原图格式。'}{' '}
          {settings.autoImageNamingEnabled
            ? isEnglish
              ? 'Auto-numbering is enabled.'
              : '已启用自动编号命名。'
            : isEnglish
              ? 'Original filenames are kept.'
              : '保留原始文件名。'}
        </div>
        {status ? <div style={{ marginTop: 6, fontSize: 12, color: '#1677ff' }}>{status}</div> : null}
      </div>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '1. Post Structure Mode' : '1. \u6587\u7ae0\u7ed3\u6784\u6a21\u5f0f'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish
              ? 'Choose the Hugo content layout you want PocketHugo to work with.'
              : '\u9009\u62e9 PocketHugo \u5e94\u8be5\u5339\u914d\u7684 Hugo \u5185\u5bb9\u7ed3\u6784\u3002'}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <ChoiceButton
            active={settings.postContentMode === 'bundle_single'}
            label={isEnglish ? 'Bundle: index.md' : 'Bundle\uff1aindex.md'}
            description={
              isEnglish
                ? 'Each post uses a folder with index.md and optional images in the same folder.'
                : '\u6bcf\u7bc7\u6587\u7ae0\u4f7f\u7528\u4e00\u4e2a\u76ee\u5f55\uff0c\u76ee\u5f55\u91cc\u662f index.md \u548c\u540c\u76ee\u5f55\u56fe\u7247\u3002'
            }
            onClick={() => updateSettings({ postContentMode: 'bundle_single' })}
          />
          <ChoiceButton
            active={settings.postContentMode === 'bundle_multilingual'}
            label={isEnglish ? 'Bundle: multilingual' : 'Bundle\uff1a\u591a\u8bed\u8a00'}
            description={
              isEnglish
                ? 'Each post uses a folder that can contain index.md, index.en.md, index.de.md, and shared assets.'
                : '\u6bcf\u7bc7\u6587\u7ae0\u4f7f\u7528\u4e00\u4e2a\u76ee\u5f55\uff0c\u76ee\u5f55\u91cc\u53ef\u5305\u542b index.md\u3001index.en.md\u3001index.de.md \u4ee5\u53ca\u5171\u4eab\u8d44\u6e90\u3002'
            }
            onClick={() => updateSettings({ postContentMode: 'bundle_multilingual' })}
          />
          <ChoiceButton
            active={settings.postContentMode === 'flat_markdown'}
            label={isEnglish ? 'Flat Markdown' : '\u6241\u5e73 Markdown'}
            description={
              isEnglish
                ? 'Posts are plain .md files directly under the posts path. This mode is best when you do not rely on per-post image folders.'
                : '\u6587\u7ae0\u76f4\u63a5\u4f5c\u4e3a posts \u8def\u5f84\u4e0b\u7684 .md \u6587\u4ef6\u5b58\u5728\uff0c\u66f4\u9002\u5408\u4e0d\u4f9d\u8d56\u6bcf\u7bc7\u6587\u7ae0\u72ec\u7acb\u56fe\u7247\u76ee\u5f55\u7684\u7ad9\u70b9\u3002'
            }
            onClick={() => updateSettings({ postContentMode: 'flat_markdown' })}
          />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '2. Image Conversion' : '2. \u56fe\u7247\u8f6c\u6362\u538b\u7f29'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish ? 'Better for Hugo page bundles and lighter mobile uploads.' : '更适合 Hugo page bundle，也更适合手机上传。'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ChoiceButton active={settings.imageConversionEnabled} label={isEnglish ? 'Enabled' : '开启'} description={isEnglish ? 'Convert and compress uploads into WebP' : '上传时自动压缩并转为 WebP'} onClick={() => updateSettings({ imageConversionEnabled: true })} />
          <ChoiceButton active={!settings.imageConversionEnabled} label={isEnglish ? 'Disabled' : '关闭'} description={isEnglish ? 'Keep original format and dimensions' : '保留原图格式和原始尺寸'} onClick={() => updateSettings({ imageConversionEnabled: false })} />
        </div>
        <div style={{ display: 'grid', gap: 10, opacity: settings.imageConversionEnabled ? 1 : 0.55 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{isEnglish ? 'Max Width' : '最大宽度'}</span>
              <span>{settings.imageMaxWidth}px</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) 30px', gap: 8, alignItems: 'center' }}>
              <StepButton disabled={!settings.imageConversionEnabled} label="-" onClick={() => adjustWidth(-1)} />
              <input type="range" min={640} max={4096} step={1} value={settings.imageMaxWidth} disabled={!settings.imageConversionEnabled} onChange={(e) => updateSettings({ imageMaxWidth: Number(e.target.value) })} />
              <StepButton disabled={!settings.imageConversionEnabled} label="+" onClick={() => adjustWidth(1)} />
            </div>
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{isEnglish ? 'Quality' : '质量'}</span>
              <span>{settings.imageQuality.toFixed(2)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) 30px', gap: 8, alignItems: 'center' }}>
              <StepButton disabled={!settings.imageConversionEnabled} label="-" onClick={() => adjustQuality(-0.01)} />
              <input type="range" min={0.4} max={1} step={0.01} value={settings.imageQuality} disabled={!settings.imageConversionEnabled} onChange={(e) => updateSettings({ imageQuality: Number(e.target.value) })} />
              <StepButton disabled={!settings.imageConversionEnabled} label="+" onClick={() => adjustQuality(0.01)} />
            </div>
          </label>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '3. Auto Image Naming' : '3. \u56fe\u7247\u81ea\u52a8\u547d\u540d'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish ? 'Useful when uploading multiple images from a phone.' : '适合手机连续上传多张图片时减少整理成本。'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ChoiceButton active={settings.autoImageNamingEnabled} label={isEnglish ? 'Auto Numbering' : '自动编号'} description={isEnglish ? 'Use names like 1.webp and 2.webp' : '使用 1.webp、2.webp 这类名称'} onClick={() => updateSettings({ autoImageNamingEnabled: true })} />
          <ChoiceButton active={!settings.autoImageNamingEnabled} label={isEnglish ? 'Keep Original' : '保留原名'} description={isEnglish ? 'Keep original names and avoid collisions automatically' : '尽量保留原始文件名并自动避重'} onClick={() => updateSettings({ autoImageNamingEnabled: false })} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '4. Basic Info Fields' : '4. Basic Info 字段'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish ? 'Title, Date, and Draft are fixed. Use the small chips on the right to control optional fields.' : 'Title、Date、Draft 固定显示，右侧小按钮控制可选字段是否在编辑器显示。'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <FieldRow
            title={isEnglish ? 'Slug field name' : 'Slug 字段名'}
            value={settings.frontmatterPreferences.slugFieldName}
            active={settings.frontmatterPreferences.slugFieldEnabled}
            onChange={(value) => updateFrontmatterPreference({ slugFieldName: value })}
            onToggle={() => updateFrontmatterPreference({ slugFieldEnabled: !settings.frontmatterPreferences.slugFieldEnabled })}
            visibleLabel={isEnglish ? 'Visible' : '显示'}
            hiddenLabel={isEnglish ? 'Hidden' : '隐藏'}
          />
          <FieldRow
            title={isEnglish ? 'Categories field name' : 'Categories 字段名'}
            value={settings.frontmatterPreferences.categoriesFieldName}
            active={settings.frontmatterPreferences.categoriesFieldEnabled}
            onChange={(value) => updateFrontmatterPreference({ categoriesFieldName: value })}
            onToggle={() => updateFrontmatterPreference({ categoriesFieldEnabled: !settings.frontmatterPreferences.categoriesFieldEnabled })}
            visibleLabel={isEnglish ? 'Visible' : '显示'}
            hiddenLabel={isEnglish ? 'Hidden' : '隐藏'}
          />
          <FieldRow
            title={isEnglish ? 'Tags field name' : 'Tags 字段名'}
            value={settings.frontmatterPreferences.tagsFieldName}
            active={settings.frontmatterPreferences.tagsFieldEnabled}
            onChange={(value) => updateFrontmatterPreference({ tagsFieldName: value })}
            onToggle={() => updateFrontmatterPreference({ tagsFieldEnabled: !settings.frontmatterPreferences.tagsFieldEnabled })}
            visibleLabel={isEnglish ? 'Visible' : '显示'}
            hiddenLabel={isEnglish ? 'Hidden' : '隐藏'}
          />
          <FieldRow
            title={isEnglish ? 'Cover image field name' : '封面图字段名'}
            value={settings.frontmatterPreferences.coverImageFieldName}
            active={settings.frontmatterPreferences.coverImageFieldEnabled}
            onChange={(value) => updateFrontmatterPreference({ coverImageFieldName: value })}
            onToggle={() => updateFrontmatterPreference({ coverImageFieldEnabled: !settings.frontmatterPreferences.coverImageFieldEnabled })}
            visibleLabel={isEnglish ? 'Visible' : '显示'}
            hiddenLabel={isEnglish ? 'Hidden' : '隐藏'}
          />

          <div style={{ marginTop: 4, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {isEnglish ? 'More Common Fields' : '更多常用字段'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {isEnglish ? 'Shown in editor Basic Info.' : '会固定出现在编辑器 Basic Info。'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <IconButton label={isEnglish ? 'Add common field' : '添加常用字段'} icon={<PlusIcon />} onClick={addExtraBasicField} />
                <SectionToggleButton open={extraFieldsOpen} onClick={() => setExtraFieldsOpen((prev) => !prev)} label={extraFieldsOpen ? (isEnglish ? 'Collapse common fields' : '收起常用字段') : (isEnglish ? 'Expand common fields' : '展开常用字段')} />
              </div>
            </div>

            {extraFieldsOpen ? (
              <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'grid', gap: 10, background: 'var(--card-muted)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
                  {isEnglish ? 'Examples: `series`, `aliases`, `featured-image-alt`.' : '例如：`series`、`aliases`、`featured-image-alt`。'}
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
                      style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <select
                        value={field.type}
                        onChange={(event) =>
                          updateExtraBasicField(field.id, {
                            type: event.target.value === 'list' ? 'list' : 'text',
                          })
                        }
                        style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                      >
                        <option value="text">{isEnglish ? 'Text' : '文本'}</option>
                        <option value="list">{isEnglish ? 'List (comma-separated)' : '列表（逗号分隔）'}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeExtraBasicField(field.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 999,
                          border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)',
                          background: 'var(--card)',
                          color: 'var(--danger)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        {isEnglish ? 'Remove' : '删除'}
                      </button>
                    </div>
                  </div>
                ))}
                {!settings.frontmatterPreferences.extraBasicInfoFields.length ? (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {isEnglish ? 'No common fields yet.' : '还没有常用字段。'}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '5. Frontmatter Timezone' : '5. Frontmatter 时区'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish ? 'Used for the fixed `date` field when creating a new post.' : '用于新建文章时固定的 `date` 字段。'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) 30px', gap: 8, alignItems: 'center' }}>
          <StepButton label="-" onClick={() => adjustTimezone(-1)} />
          <div style={{ padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', textAlign: 'center', fontWeight: 700 }}>
            {`UTC${settings.timezoneOffsetHours >= 0 ? '+' : ''}${settings.timezoneOffsetHours}`}
          </div>
          <StepButton label="+" onClick={() => adjustTimezone(1)} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? '6. Categories Preset' : '6. 固定分类'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
            {isEnglish ? 'Define reusable categories here. Editor will provide quick selection.' : '在这里维护常用分类，编辑器里会提供快捷选择。'}
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
            style={{ padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          />
          <IconButton label={isEnglish ? 'Add category preset' : '添加分类预设'} icon={<PlusIcon />} onClick={addCategoryPreset} active />
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
                  fontSize: 12,
                  fontWeight: 600,
                }}
                title={isEnglish ? 'Tap to remove' : '点击删除'}
              >
                {item} x
              </button>
            ))
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {isEnglish ? 'No preset categories yet.' : '还没有固定分类。'}
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        style={{
          alignSelf: 'start',
          marginTop: 2,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid var(--accent)',
          background: dirty ? 'var(--accent)' : 'var(--card)',
          color: dirty ? 'var(--accent-contrast)' : 'var(--foreground)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {isEnglish ? 'Save Preferences' : '保存偏好'}
      </button>
    </section>
  )
}
