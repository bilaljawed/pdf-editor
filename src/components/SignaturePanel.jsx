import { useState, useRef, useEffect } from 'react'
import SignaturePad from 'signature_pad'
import './SignaturePanel.css'

const TABS = ['Draw', 'Type', 'Upload']

const TYPE_FONTS = [
  { label: 'Elegant', value: 'Georgia, serif', style: 'italic' },
  { label: 'Bold', value: 'Arial, sans-serif', style: 'bold' },
  { label: 'Script', value: 'Palatino Linotype, serif', style: 'italic' },
]

export default function SignaturePanel({ onSignatureReady, onClose }) {
  const [activeTab, setActiveTab] = useState('Draw')
  const [typedText, setTypedText] = useState('')
  const [selectedFont, setSelectedFont] = useState(0)
  const canvasRef = useRef(null)
  const sigPadRef = useRef(null)

  // Init signature pad
  useEffect(() => {
    if (activeTab === 'Draw' && canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255,255,255,0)',
        penColor: '#1E293B',
        minWidth: 1.5,
        maxWidth: 3,
      })
      // Resize canvas properly
      resizeCanvas()
    }
    return () => {
      sigPadRef.current?.off()
      sigPadRef.current = null
    }
  }, [activeTab])

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d').scale(ratio, ratio)
    sigPadRef.current?.clear()
  }

  const handleClearDraw = () => sigPadRef.current?.clear()

  const handleApplyDraw = () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      alert('Please draw a signature first.')
      return
    }
    const dataUrl = sigPadRef.current.toDataURL('image/png')
    onSignatureReady(dataUrl)
  }

  const handleApplyType = () => {
    if (!typedText.trim()) {
      alert('Please type your signature.')
      return
    }
    const font = TYPE_FONTS[selectedFont]
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 120
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 400, 120)
    ctx.font = `${font.style} 54px ${font.value}`
    ctx.fillStyle = '#1E293B'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(typedText, 200, 60)
    const dataUrl = canvas.toDataURL('image/png')
    onSignatureReady(dataUrl)
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onSignatureReady(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="sig-panel">
      <div className="sig-panel-header">
        <span className="sig-panel-title">Add Signature</span>
        <button className="sig-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="sig-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`sig-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sig-body">
        {activeTab === 'Draw' && (
          <div className="sig-draw">
            <p className="sig-hint">Draw your signature below</p>
            <div className="sig-canvas-wrap">
              <canvas ref={canvasRef} className="sig-canvas" />
            </div>
            <div className="sig-actions">
              <button className="btn-ghost" onClick={handleClearDraw}>Clear</button>
              <button className="btn-primary-sm" onClick={handleApplyDraw}>Use Signature →</button>
            </div>
          </div>
        )}

        {activeTab === 'Type' && (
          <div className="sig-type">
            <p className="sig-hint">Type your name</p>
            <input
              className="sig-input"
              type="text"
              placeholder="Your name"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              maxLength={40}
            />
            <p className="sig-hint" style={{ marginTop: 16 }}>Choose style</p>
            <div className="font-options">
              {TYPE_FONTS.map((font, i) => (
                <button
                  key={i}
                  className={`font-option ${selectedFont === i ? 'selected' : ''}`}
                  style={{ fontFamily: font.value, fontStyle: font.style }}
                  onClick={() => setSelectedFont(i)}
                >
                  {typedText || 'Signature'}
                </button>
              ))}
            </div>
            <button className="btn-primary-sm" style={{ marginTop: 20, width: '100%' }} onClick={handleApplyType}>
              Use Signature →
            </button>
          </div>
        )}

        {activeTab === 'Upload' && (
          <div className="sig-upload">
            <p className="sig-hint">Upload a signature image (PNG/JPG)</p>
            <label className="upload-area">
              <input type="file" accept="image/*" onChange={handleUpload} />
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#EFF6FF"/>
                <path d="M20 26V14M14 20l6-6 6 6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Click to upload image</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
