declare module 'bwip-js' {
  interface BwipJsOptions {
    bcid: string
    text: string
    scale?: number
    height?: number
    segments?: number
    [key: string]: any
  }

  interface BwipJs {
    toCanvas(canvas: HTMLCanvasElement, options: BwipJsOptions): Promise<void>
  }

  const bwipjs: BwipJs
  export default bwipjs
}
