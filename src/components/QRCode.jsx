import { useEffect, useRef, useState } from 'react'

export default function QRCode({ url, size = 96 }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.QRCode) { setReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
    script.onload = () => setReady(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!ready || !canvasRef.current || !window.QRCode) return
    window.QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' }
    })
  }, [ready, url, size])

  return (
    <div style={{ width: size, height: size, background: '#fff', borderRadius: 8 }}>
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  )
}
