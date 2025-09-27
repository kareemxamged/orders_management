import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportToPDF = async (
  elementId: string,
  filename: string,
  options: {
    format?: 'a4' | 'letter'
    orientation?: 'portrait' | 'landscape'
    margin?: number
    quality?: number
  } = {}
) => {
  const {
    format = 'a4',
    orientation = 'portrait',
    margin = 10,
    quality = 1
  } = options

  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found')
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    })

    // Calculate dimensions
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // PDF dimensions in mm
    const pdfWidth = format === 'a4' ? 210 : 216
    const pdfHeight = format === 'a4' ? 297 : 279
    
    // Calculate scaling to fit content
    const widthRatio = (pdfWidth - margin * 2) / imgWidth
    const heightRatio = (pdfHeight - margin * 2) / imgHeight
    const ratio = Math.min(widthRatio, heightRatio)
    
    const scaledWidth = imgWidth * ratio
    const scaledHeight = imgHeight * ratio
    
    // Center content
    const x = (pdfWidth - scaledWidth) / 2
    const y = (pdfHeight - scaledHeight) / 2

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: format
    })

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', 1.0)
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)

    // Save PDF
    pdf.save(filename)

    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

export const exportInvoiceToPDF = async (orderNumber: string) => {
  const filename = `invoice-${orderNumber}.pdf`
  return exportToPDF('invoice-content', filename, {
    format: 'a4',
    orientation: 'portrait',
    margin: 15,
    quality: 2
  })
}

export const exportStickerToPDF = async (orderNumber: string) => {
  const filename = `shipping-sticker-${orderNumber}.pdf`
  return exportToPDF('sticker-content', filename, {
    format: 'a4',
    orientation: 'portrait',
    margin: 10,
    quality: 2
  })
}

