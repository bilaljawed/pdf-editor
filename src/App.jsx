import { useState, useRef, useCallback } from 'react'
import DropZone from './components/DropZone'
import PDFViewer from './components/PDFViewer'
import Toolbar from './components/Toolbar'
import SignaturePanel from './components/SignaturePanel'
import { savePDF } from './utils/pdfExport'
import './App.css'

export default function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfBytes, setPdfBytes] = useState(null)
  const [activeTool, setActiveTool] = useState('select') // 'select' | 'text' | 'signature'
  const [showSignaturePanel, setShowSignaturePanel] = useState(false)
  const [pendingSignature, setPendingSignature] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const fabricCanvasesRef = useRef({}) // { pageNum: fabricCanvas }

  const handleFileAccepted = useCallback((file, bytes) => {
    setPdfFile(file)
    setPdfBytes(bytes)
    setActiveTool('select')
    fabricCanvasesRef.current = {}
  }, [])

  const handleToolSelect = (tool) => {
    if (tool === 'signature') {
      setShowSignaturePanel(true)
    } else {
      setShowSignaturePanel(false)
    }
    setActiveTool(tool)
  }

  const handleSignatureReady = (dataUrl) => {
    setPendingSignature(dataUrl)
    setShowSignaturePanel(false)
    setActiveTool('signature-place')
  }

  const handleSave = async () => {
    if (!pdfBytes) return
    setIsSaving(true)
    try {
      await savePDF(pdfBytes, fabricCanvasesRef.current)
    } catch (err) {
      console.error('Save failed:', err)
      alert('Save failed: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const registerCanvas = (pageNum, canvas) => {
    fabricCanvasesRef.current[pageNum] = canvas
  }

  return (
    <div className="app">
      {!pdfFile ? (
        <div className="landing">
          <div className="landing-inner">
            <div className="logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#3B82F6"/>
                <path d="M12 10h10l8 8v16a2 2 0 01-2 2H12a2 2 0 01-2-2V12a2 2 0 012-2z" fill="white" fillOpacity="0.9"/>
                <path d="M22 10l8 8h-6a2 2 0 01-2-2v-6z" fill="white" fillOpacity="0.5"/>
                <path d="M15 22h10M15 26h7" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1>PDF Editor</h1>
            <p>Add text, signatures, and annotations to any PDF</p>
            <DropZone onFileAccepted={handleFileAccepted} />
          </div>
        </div>
      ) : (
        <div className="editor-layout">
          <Toolbar
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
            onSave={handleSave}
            isSaving={isSaving}
            onNewFile={() => {
              setPdfFile(null)
              setPdfBytes(null)
              fabricCanvasesRef.current = {}
            }}
            fileName={pdfFile.name}
          />
          <div className="editor-body">
            <div className="viewer-area">
              <PDFViewer
                pdfBytes={pdfBytes}
                activeTool={activeTool}
                pendingSignature={pendingSignature}
                onSignaturePlaced={() => {
                  setPendingSignature(null)
                  setActiveTool('select')
                }}
                onRegisterCanvas={registerCanvas}
              />
            </div>
            {showSignaturePanel && (
              <div className="signature-sidebar">
                <SignaturePanel
                  onSignatureReady={handleSignatureReady}
                  onClose={() => {
                    setShowSignaturePanel(false)
                    setActiveTool('select')
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
