import { Preferences } from '@capacitor/preferences'
import type { Router } from 'vue-router'

// Deterministic demo cards seeded for App Store screenshots so every run looks
// identical across languages. Logos resolve through the backend logo endpoint
// (e.g. https://api.pocketz.app/logo/lidl.com), the same path real cards use.
// All barcodes use CODE128B so they render without checksum constraints.
const DEMO_CARDS = [
  {
    id: 1,
    name: 'Lidl Plus',
    logo: 'lidl.com',
    bgColor: '#0050AA',
    textColor: '#FFE500',
    barcode: '2934857120398',
    barcodeFormat: 'CODE128B',
    cardNumber: '2934 8571 2039 8',
    isPinned: true,
  },
  {
    id: 2,
    name: 'IKEA Family',
    logo: 'ikea.com',
    bgColor: '#0058A3',
    textColor: '#FFDB00',
    barcode: '6041290037185',
    barcodeFormat: 'CODE128B',
    cardNumber: '6041 2900 3718 5',
  },
  {
    id: 3,
    name: 'Decathlon',
    logo: 'decathlon.com',
    bgColor: '#3643BA',
    textColor: '#FFFFFF',
    barcode: '3274581066420',
    barcodeFormat: 'CODE128B',
    cardNumber: '3274 5810 6642 0',
  },
  {
    id: 4,
    name: 'Starbucks Rewards',
    logo: 'starbucks.com',
    bgColor: '#00704A',
    textColor: '#FFFFFF',
    barcode: '9812304857261',
    barcodeFormat: 'CODE128B',
    cardNumber: '9812 3048 5726 1',
  },
  {
    id: 5,
    name: 'Carrefour',
    logo: 'carrefour.com',
    bgColor: '#004E9F',
    textColor: '#FFFFFF',
    barcode: '0598234176650',
    barcodeFormat: 'CODE128B',
    cardNumber: '0598 2341 7665 0',
  },
  {
    id: 6,
    name: 'H&M Member',
    logo: 'hm.com',
    bgColor: '#E50010',
    textColor: '#FFFFFF',
    barcode: '7251049938174',
    barcodeFormat: 'CODE128B',
    cardNumber: '7251 0499 3817 4',
  },
]

/**
 * When the app is launched by the UI screenshot tests (`-CapacitorStorage.ui_test_mode 1`),
 * seed deterministic demo data and jump to the route under capture. A no-op in
 * every normal launch, so it's safe to always call on startup.
 */
export async function applyUiTestMode(router: Router): Promise<void> {
  let mode: string | null = null
  try {
    mode = (await Preferences.get({ key: 'ui_test_mode' })).value
  } catch {
    return
  }

  if (mode !== '1') return

  // Overwrite, not merge, so screenshots are identical on every run.
  await Preferences.set({ key: 'cards', value: JSON.stringify(DEMO_CARDS) })

  const route = (await Preferences.get({ key: 'ui_test_start_route' })).value
  if (route) {
    await router.isReady()
    await router.replace(route)
  }
}

/**
 * Used by HomeView: in test mode with `ui_test_open_card` set, the first card's
 * barcode detail is opened automatically for the "scan at checkout" screenshot.
 */
export async function shouldAutoOpenCard(): Promise<boolean> {
  try {
    const mode = (await Preferences.get({ key: 'ui_test_mode' })).value
    const open = (await Preferences.get({ key: 'ui_test_open_card' })).value
    return mode === '1' && open === '1'
  } catch {
    return false
  }
}
