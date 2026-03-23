import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Canvas as FabricCanvas, IText, FabricImage } from 'fabric'
import './PDFViewer.css'

// Set up PDF.js worker — use CDN URL to avoid base-path issues on GitHub Pages
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const SCALE = 1.5

export default function PDFViewer({
  pdfBytes,
  activeTool,
  pendingSignature,
  onSignaturePlaced,
  onRegisterCanvas,
}) {
  const [pages, setPages] = useState([])
  const [numPages, setNumPages] = useState(0)
  const pdfDocRef = useRef(null)
  const fabricInstancesRef = useRef({}) // pageNum -> FabricCanvas

  // Load PDF
  useEffect(() => {
    if (!pdfBytes) return
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
    loadingTask.promise.then((pdfDoc) => {
      pdfDocRef.current = pdfDoc
      setNumPages(pdfDoc.numPages)
      setPages(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1))
    })
    return () => {
      loadingTask.destroy?.()
    }
  }, [pdfBytes])

  const initPage = useCallback(async (pageNum, wrapperEl) => {
    if (!pdfDocRef.current || !wrapperEl) return

    // Clear old content
    wrapperEl.innerHTML = ''

    const page = await pdfDocRef.current.getPage(pageNum)
    const viewport = page.getViewport({ scale: SCALE })

    wrapperEl.style.width = viewport.width + 'px'
    wrapperEl.style.height = viewport.height + 'px'

    // PDF.js canvas (background)
    const pdfCanvas = document.createElement('canvas')
    pdfCanvas.width = viewport.width
    pdfCanvas.height = viewport.height
    pdfCanvas.className = 'pdf-page-canvas'
    wrapperEl.appendChild(pdfCanvas)

    const ctx = pdfCanvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    // Fabric.js overlay canvas element
    const fabricCanvasEl = document.createElement('canvas')
    fabricCanvasEl.id = `fabric-canvas-${pageNum}`
    fabricCanvasEl.width = viewport.width
    fabricCanvasEl.height = viewport.height
    wrapperEl.appendChild(fabricCanvasEl)

    const fc = new FabricCanvas(fabricCanvasEl, {
      selection: true,
      width: viewport.width,
      height: viewport.height,
    })

    fabricInstancesRef.current[pageNum] = fc
    onRegisterCanvas(pageNum, fc)

    return fc
  }, [onRegisterCanvas])

  // Handle tool cursor changes
  useEffect(() => {
    Object.values(fabricInstancesRef.current).forEach(fc => {
      if (activeTool === 'select') {
        fc.defaultCursor = 'default'
        fc.selection = true
        fc.getObjects().forEach(obj => {
          obj.set({ selectable: true, evented: true })
        })
      } else {
        fc.defaultCursor = activeTool === 'text' ? 'text' : 'crosshair'
        fc.selection = false
        fc.discardActiveObject()
        fc.renderAll()
      }
    })
  }, [activeTool])

  // Handle canvas click for text and signature placement
  useEffect(() => {
    const handlers = {}

    Object.entries(fabricInstancesRef.current).forEach(([pageNum, fc]) => {
      const handler = (opt) => {
        const pointer = fc.getScenePoint(opt.e)

        if (activeTool === 'text') {
          addTextAt(fc, pointer.x, pointer.y)
        } else if (activeTool === 'signature-place' && pendingSignature) {
          addSignatureAt(fc, pointer.x, pointer.y, pendingSignature, onSignaturePlaced)
        }
      }
      fc.on('mouse:down', handler)
      handlers[pageNum] = handler
    })

    return () => {
      Object.entries(fabricInstancesRef.current).forEach(([pageNum, fc]) => {
        if (handlers[pageNum]) fc.off('mouse:down', handlers[pageNum])
      })
    }
  }, [activeTool, pendingSignature, onSignaturePlaced])

  return (
    <div className="pdf-viewer">
      {pages.map(pageNum => (
        <PageWrapper
          key={pageNum}
          pageNum={pageNum}
          onMount={(el) => initPage(pageNum, el)}
          numPages={numPages}
        />
      ))}
    </div>
  )
}

function PageWrapper({ pageNum, onMount, numPages }) {
  const wrapperRef = useRef(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (wrapperRef.current && !mounted.current) {
      mounted.current = true
      onMount(wrapperRef.current)
    }
  }, [onMount])

  return (
    <div className="page-container">
      <div className="page-label">Page {pageNum} of {numPages}</div>
      <div className="page-wrapper" ref={wrapperRef} />
    </div>
  )
}

async function addTextAt(fc, x, y) {
  const text = new IText('Click to edit text', {
    left: x,
    top: y,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 18,
    fill: '#1E293B',
    selectable: true,
    editable: true,
    hasControls: true,
    padding: 4,
  })
  await fc.add(text)
  fc.setActiveObject(text)
  text.enterEditing()
  text.selectAll()
  fc.renderAll()
}

async function addSignatureAt(fc, x, y, dataUrl, onPlaced) {
  const img = await FabricImage.fromURL(dataUrl)
  const maxW = 220
  const scale = img.width > maxW ? maxW / img.width : 1
  img.set({
    left: x - (img.width * scale) / 2,
    top: y - (img.height * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    selectable: true,
    hasControls: true,
  })
  await fc.add(img)
  fc.setActiveObject(img)
  fc.renderAll()
  onPlaced?.()
}
