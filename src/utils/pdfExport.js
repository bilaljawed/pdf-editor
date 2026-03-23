import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Flatten fabric.js annotations into the PDF and trigger download.
 * @param {Uint8Array} originalBytes - Original PDF bytes
 * @param {Object} canvasMap - { pageNum: FabricCanvas }
 */
export async function savePDF(originalBytes, canvasMap) {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const pages = pdfDoc.getPages()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const [pageNumStr, fc] of Object.entries(canvasMap)) {
    const pageIndex = parseInt(pageNumStr, 10) - 1
    if (pageIndex < 0 || pageIndex >= pages.length) continue
    const pdfPage = pages[pageIndex]
    const { width: pdfW, height: pdfH } = pdfPage.getSize()
    const canvasW = fc.width
    const canvasH = fc.height

    // Scale factors: fabric canvas coords → pdf page coords
    const scaleX = pdfW / canvasW
    const scaleY = pdfH / canvasH

    const objects = fc.getObjects()

    for (const obj of objects) {
      const bounds = obj.getBoundingRect()
      // Fabric Y=0 is top; PDF Y=0 is bottom
      const pdfX = bounds.left * scaleX
      const pdfY = pdfH - (bounds.top + bounds.height) * scaleY
      const objW = bounds.width * scaleX
      const objH = bounds.height * scaleY

      const objType = obj.type

      if (objType === 'i-text' || objType === 'text' || objType === 'itext') {
        // Embed as text
        const textStr = obj.text || ''
        const fontSize = Math.max((obj.fontSize || 18) * scaleY, 6)
        const colorVal = obj.fill || '#000000'
        const c = parseColor(colorVal)

        const lines = textStr.split('\n')
        let yOffset = pdfH - bounds.top * scaleY
        for (const line of lines) {
          if (line.trim()) {
            try {
              pdfPage.drawText(line, {
                x: pdfX,
                y: yOffset - fontSize,
                size: fontSize,
                font: helvetica,
                color: rgb(c.r / 255, c.g / 255, c.b / 255),
              })
            } catch (e) {
              console.warn('Text draw error:', e)
            }
          }
          yOffset -= fontSize * 1.2
        }
      } else {
        // Rasterize everything else (images, signatures, paths) as PNG
        try {
          const dataUrl = obj.toDataURL({ format: 'png', multiplier: 2 })
          const base64 = dataUrl.split(',')[1]
          if (!base64) continue
          const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
          const pngImage = await pdfDoc.embedPng(imgBytes)
          pdfPage.drawImage(pngImage, {
            x: pdfX,
            y: pdfY,
            width: Math.max(objW, 1),
            height: Math.max(objH, 1),
          })
        } catch (e) {
          console.warn('Image embed error:', e)
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save()
  downloadBytes(pdfBytes, 'edited.pdf')
}

function parseColor(color) {
  if (!color || typeof color !== 'string') return { r: 0, g: 0, b: 0 }
  const hex = color.replace('#', '')
  if (hex.length === 6) {
    const bigint = parseInt(hex, 16)
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
  }
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return { r, g, b }
  }
  return { r: 0, g: 0, b: 0 }
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
