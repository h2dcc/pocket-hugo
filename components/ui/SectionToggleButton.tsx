'use client'

import IconButton from '@/components/ui/IconButton'

type SectionToggleButtonProps = {
  open: boolean
  onClick: () => void
  label: string
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={open ? 'M6 14L12 8L18 14' : 'M6 10L12 16L18 10'}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SectionToggleButton({
  open,
  onClick,
  label,
}: SectionToggleButtonProps) {
  return <IconButton label={label} icon={<ChevronIcon open={open} />} onClick={onClick} active={open} />
}
