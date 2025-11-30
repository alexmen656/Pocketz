import { Filesystem, Directory } from '@capacitor/filesystem'

const API_BASE_URL = 'https://api.pocketz.app'
const CACHE_DIR = 'logo_cache'

function getLogoFileName(domain: string): string {
  return `${domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.png`
}

async function ensureCacheDirectory(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    })
  } catch (error) {
    console.log('Cache directory already exists or could not be created:', error)
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.readAsDataURL(blob)
  })
}

async function downloadAndCacheLogo(domain: string): Promise<string> {
  try {
    await ensureCacheDirectory()

    const logoFileName = getLogoFileName(domain)
    const logoPath = `${CACHE_DIR}/${logoFileName}`

    const response = await fetch(`${API_BASE_URL}/logo/${domain}`)
    //{ timeout: 10000,}

    if (!response.ok) {
      throw new Error(`Failed to download logo: ${response.statusText}`)
    }

    const blob = await response.blob()
    const base64Data = await blobToBase64(blob)

    await Filesystem.writeFile({
      path: logoPath,
      data: base64Data,
      directory: Directory.Data,
    })

    console.log(`Logo cached for ${domain}`)
    return base64Data
  } catch (error) {
    console.error(`Failed to download and cache logo for ${domain}:`, error)
    return `${API_BASE_URL}/logo/${domain}`
  }
}

async function getCachedLogoUrl(domain: string): Promise<string> {
  try {
    await ensureCacheDirectory()

    const logoFileName = getLogoFileName(domain)
    const logoPath = `${CACHE_DIR}/${logoFileName}`

    try {
      const fileData = await Filesystem.readFile({
        path: logoPath,
        directory: Directory.Data,
      })

      console.log(`Using cached logo for ${domain}`)
      return `data:image/png;base64,${fileData.data}`
    } catch (error) {
      console.log(`Logo not cached for ${domain}, downloading...`)
      return await downloadAndCacheLogo(domain)
    }
  } catch (error) {
    console.error(`Error getting cached logo for ${domain}:`, error)
    return `${API_BASE_URL}/logo/${domain}`
  }
}

async function preloadLogos(domains: string[]): Promise<void> {
  console.log(`Preloading ${domains.length} logos...`)

  for (const domain of domains) {
    try {
      await getCachedLogoUrl(domain)
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to preload logo for ${domain}:`, error)
    }
  }
}

async function clearCachedLogo(domain: string): Promise<void> {
  try {
    const logoFileName = getLogoFileName(domain)
    const logoPath = `${CACHE_DIR}/${logoFileName}`

    await Filesystem.deleteFile({
      path: logoPath,
      directory: Directory.Data,
    })

    console.log(`Cleared cached logo for ${domain}`)
  } catch (error) {
    console.error(`Failed to clear cached logo for ${domain}:`, error)
  }
}

async function clearAllCachedLogos(): Promise<void> {
  try {
    await Filesystem.rmdir({
      path: CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    })

    console.log('Cleared all cached logos')
  } catch (error) {
    console.error('Failed to clear all cached logos:', error)
  }
}

async function getCacheInfo(): Promise<{
  cacheSize: number
  cachedLogos: string[]
}> {
  try {
    await ensureCacheDirectory()

    const files = await Filesystem.readdir({
      path: CACHE_DIR,
      directory: Directory.Data,
    })

    const cachedLogos = files.files
      .filter((file) => !file.type || file.type === 'file')
      .map((file) => file.name)

    let totalSize = 0
    for (const logo of cachedLogos) {
      try {
        const file = await Filesystem.readFile({
          path: `${CACHE_DIR}/${logo}`,
          directory: Directory.Data,
        })
        totalSize += (file.data as string).length * 0.75
      } catch (error) {
        console.error(`Failed to get size for ${logo}:`, error)
      }
    }

    return {
      cacheSize: Math.round(totalSize / 1024),
      cachedLogos,
    }
  } catch (error) {
    console.error('Failed to get cache info:', error)
    return {
      cacheSize: 0,
      cachedLogos: [],
    }
  }
}

export {
  getCachedLogoUrl,
  downloadAndCacheLogo,
  preloadLogos,
  clearCachedLogo,
  clearAllCachedLogos,
  getCacheInfo,
}
