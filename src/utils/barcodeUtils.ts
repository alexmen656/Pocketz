export type BarcodeFormatType =
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'EAN13'
  | 'QR_CODE'
  | 'GS1_DATABAR'

export function detectBarcodeFormat(barcode: string): 'EAN13' | 'CODE128B' | 'QR_CODE' {
  const cleanBarcode = barcode.replace(/[\s-]/g, '')
  const length = cleanBarcode.length
  const isNumeric = /^\d+$/.test(cleanBarcode)

  if (length > 80 || /[^A-Z0-9\-.$\/+%\s]/i.test(barcode)) {
    return 'QR_CODE'
  }

  if (isNumeric && length === 13) {
    return 'EAN13'
  }

  return 'CODE128B'
}

export function mapMLKitFormatToString(mlkitFormat: number): BarcodeFormatType {
  const formatMap: Record<number, BarcodeFormatType> = {
    1: 'CODE128',
    32: 'EAN13',
    256: 'QR_CODE',
  }
  return formatMap[mlkitFormat] || 'CODE128B'
}

export function getVueBarcodeFormat(format: BarcodeFormatType): string {
  const formatMap: Record<BarcodeFormatType, string> = {
    CODE128: 'CODE128',
    CODE128A: 'CODE128A',
    CODE128B: 'CODE128B',
    CODE128C: 'CODE128C',
    EAN13: 'EAN13',
    QR_CODE: 'CODE128',
    GS1_DATABAR: 'CODE128',
  }
  return formatMap[format] || 'CODE128'
}
