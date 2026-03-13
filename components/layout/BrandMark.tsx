type Props = {
  size?: number
}

export default function BrandMark({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="pockethugo-bg" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7BDD4" />
          <stop offset="0.52" stopColor="#7E96B3" />
          <stop offset="1" stopColor="#5C738F" />
        </linearGradient>
        <linearGradient id="pockethugo-fold" x1="42" y1="30" x2="53" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5E7D6" />
          <stop offset="1" stopColor="#E1C7AA" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="48" height="48" rx="16" fill="url(#pockethugo-bg)" />
      <path
        d="M20 19.5C20 17.6 21.6 16 23.5 16H36.5C38.4 16 40 17.6 40 19.5V44.5C40 46.4 38.4 48 36.5 48H23.5C21.6 48 20 46.4 20 44.5V19.5Z"
        fill="rgba(255,255,255,0.92)"
      />
      <path d="M40 32H48C49.7 32 51 33.3 51 35V45C51 46.7 49.7 48 48 48H40V32Z" fill="url(#pockethugo-fold)" />
      <path
        d="M27 22V42M33 22V42M27 32H33"
        stroke="#617A96"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
