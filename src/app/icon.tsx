import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        borderRadius: '120px',
      }}
    >
      <span
        style={{
          color: 'white',
          fontSize: 280,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.05em',
        }}
      >
        H
      </span>
    </div>,
    { width: 512, height: 512 }
  )
}
