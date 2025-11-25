export type BarcodeFormatType =
  | 'CODE128'
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

export function detectBarcodeFormat(barcode: string): BarcodeFormatType {
  const cleanBarcode = barcode.replace(/[\s-]/g, '')
  const length = cleanBarcode.length
  const isNumeric = /^\d+$/.test(cleanBarcode)

  if (isNumeric && length === 13) {
    return 'EAN13'
  }

  if (isNumeric && length === 8) {
    return 'EAN8'
  }

  if (isNumeric && length === 12) {
    return 'UPC_A'
  }

  if (isNumeric && length >= 6 && length <= 8) {
    return 'UPC_E'
  }

  if (isNumeric && length % 2 === 0 && length >= 6 && length <= 30) {
    return 'ITF'
  }

  if (/^[A-Z0-9\-.$\/+%\s]+$/i.test(barcode)) {
    return 'CODE39'
  }

  if (/^[A-Z0-9\-.$\/+%\s]+$/i.test(barcode) && length < 20) {
    return 'CODE93'
  }

  if (/^[ABCD][0-9\-$:\/\.\+]+[ABCD]$/i.test(barcode)) {
    return 'CODABAR'
  }

  if (length > 50 || /[^A-Z0-9\-.$\/+%\s]/i.test(barcode)) {
    return 'QR_CODE'
  }

  if (length > 100) {
    return 'PDF417'
  }

  return 'CODE128'
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
  }
  return formatMap[format] || 'CODE128'
}
