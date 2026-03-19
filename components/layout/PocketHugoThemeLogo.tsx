type PocketHugoThemeLogoProps = {
  size?: number
}

export default function PocketHugoThemeLogo({
  size = 40,
}: PocketHugoThemeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pht-bg" x1="28" y1="24" x2="224" y2="232" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DCE8F8" />
          <stop offset="1" stopColor="#F3E9DC" />
        </linearGradient>
        <linearGradient
          id="pht-panel"
          x1="72"
          y1="64"
          x2="182"
          y2="188"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#607996" />
          <stop offset="1" stopColor="#49627E" />
        </linearGradient>
        <filter id="pht-shadow" x="28" y="28" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#2A3A58" floodOpacity="0.16" />
        </filter>
      </defs>

      <rect x="28" y="28" width="200" height="200" rx="56" fill="url(#pht-bg)" />
      <circle cx="186" cy="76" r="22" fill="#FFFFFF" fillOpacity="0.34" />

      <g filter="url(#pht-shadow)">
        <path d="M80 66C80 59.3726 85.3726 54 92 54H164C170.627 54 176 59.3726 176 66V124H80V66Z" fill="url(#pht-panel)" />
        <path d="M80 92H176V176C176 185.941 167.941 194 158 194H98C88.0589 194 80 185.941 80 176V92Z" fill="#F7FAFF" fillOpacity="0.94" />
        <path d="M108 74H148" stroke="#E8F0FA" strokeWidth="10" strokeLinecap="round" />
        <path d="M112 112V158" stroke="#49627E" strokeWidth="12" strokeLinecap="round" />
        <path d="M112 158H144" stroke="#49627E" strokeWidth="12" strokeLinecap="round" />
        <path d="M152 112V158" stroke="#607996" strokeWidth="12" strokeLinecap="round" />
        <path d="M136 112H168" stroke="#607996" strokeWidth="12" strokeLinecap="round" />
      </g>
    </svg>
  )
}
