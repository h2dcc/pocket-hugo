'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type IconButtonProps = {
  label: string
  icon: ReactNode
  active?: boolean
  badge?: string
  style?: CSSProperties
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export default function IconButton({
  label,
  icon,
  active = false,
  badge,
  style,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{
        minWidth: badge ? 52 : 38,
        height: 38,
        padding: badge ? '0 10px' : 0,
        borderRadius: 999,
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--card)',
        color: active ? 'var(--accent-soft-text)' : 'var(--foreground)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        boxShadow: active ? '0 6px 18px rgba(42, 58, 88, 0.08)' : 'none',
        transition: 'background 160ms ease, border-color 160ms ease, color 160ms ease',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {icon}
      </span>
      {badge ? (
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.2 }}>{badge}</span>
      ) : null}
    </button>
  )
}
