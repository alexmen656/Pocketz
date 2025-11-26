export type BarcodeFormatType =
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'CODE39'
  | 'CODE93'
  | 'EAN13'
  | 'EAN8'
  | 'UPC_A'
  | 'UPC_E'
  | 'ITF'
  | 'PDF417'
  | 'QR_CODE'
  | 'AZTEC'
  | 'DATA_MATRIX'
  | 'CODABAR'
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
    2: 'CODE39',
    4: 'CODE93',
    8: 'CODABAR',
    16: 'DATA_MATRIX',
    32: 'EAN13',
    64: 'EAN8',
    128: 'ITF',
    256: 'QR_CODE',
    512: 'UPC_A',
    1024: 'UPC_E',
    2048: 'PDF417',
    4096: 'AZTEC',
  }
  return formatMap[mlkitFormat] || 'CODE128'
}

export function getVueBarcodeFormat(format: BarcodeFormatType): string {
  const formatMap: Record<BarcodeFormatType, string> = {
    CODE128: 'CODE128',
    CODE128A: 'CODE128A',
    CODE128B: 'CODE128B',
    CODE128C: 'CODE128C',
    CODE39: 'CODE39',
    CODE93: 'codabar',
    EAN13: 'EAN13',
    EAN8: 'EAN8',
    UPC_A: 'UPC',
    UPC_E: 'UPC',
    ITF: 'ITF14',
    PDF417: 'CODE128',
    QR_CODE: 'CODE128',
    AZTEC: 'CODE128',
    DATA_MATRIX: 'CODE128',
    CODABAR: 'codabar',
    GS1_DATABAR: 'CODE128',
  }
  return formatMap[format] || 'CODE128'
}
