export default function QRCode({ url, size = 220 }) {
  var encoded = encodeURIComponent(url)
  var src =
    'https://api.qrserver.com/v1/create-qr-code/?size=' +
    size +
    'x' +
    size +
    '&data=' +
    encoded +
    '&bgcolor=ffffff&color=0a0a0a&margin=10'

  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img src={src} width={size} height={size} alt="Código QR para anotarse a cantar" />
    </div>
  )
}
