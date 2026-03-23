import { useState, useRef, useCallback } from 'react'
import './DropZone.css'

export default function DropZone({ onFileAccepted }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const processFile = async (file) => {
    setError(null)
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.')
      return
    }
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    onFileAccepted(file, bytes)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="dropzone-input"
        onChange={handleInputChange}
      />
      <div className="dropzone-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#EFF6FF"/>
          <path d="M16 36h16M24 28V14M18 20l6-6 6 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="dropzone-title">Drop your PDF here</p>
      <p className="dropzone-sub">or <span className="link">browse files</span></p>
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  )
}
