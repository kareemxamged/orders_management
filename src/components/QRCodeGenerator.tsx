import React, { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface QRCodeGeneratorProps {
  orderNumber: string
  width?: number
  height?: number
  className?: string
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  orderNumber, 
  width = 200, 
  height = 60,
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && orderNumber) {
      try {
        JsBarcode(canvasRef.current, orderNumber, {
          format: "CODE128",
          width: 2,
          height: height,
          displayValue: true,
          fontSize: 12,
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 2,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 10
        })
      } catch (error) {
        console.error('Error generating barcode:', error)
      }
    }
  }, [orderNumber, height])

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas 
        ref={canvasRef}
        style={{ width: width, height: height + 20 }}
        className="border border-gray-300 rounded"
      />
    </div>
  )
}

export default QRCodeGenerator
