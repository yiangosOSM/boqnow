'use client'

export default function MockBanner() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH !== 'true') return null

  return (
    <div
      style={{
        background: '#F5C518',
        color: '#0A0A0A',
        textAlign: 'center',
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      MOCK MODE — seeded data, no external services
    </div>
  )
}
