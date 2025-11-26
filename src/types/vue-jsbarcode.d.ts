declare module 'vue-jsbarcode' {
  import { DefineComponent } from 'vue'

  const VueJsBarcode: DefineComponent<
    {
      value?: string
      format?: string
      width?: number
      height?: number
      margin?: number
      displayValue?: boolean
      fontSize?: number
      font?: string
      textAlign?: string
      textPosition?: string
      textMargin?: number
      background?: string
      lineColor?: string
    },
    {},
    {}
  >

  export default VueJsBarcode
}
