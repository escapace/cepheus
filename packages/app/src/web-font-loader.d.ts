export interface WebFont {
  family: string
  slug: string
  stretch?: number | number[] | undefined
  style?: number | number[] | 'normal' | 'italic' | 'oblique' | undefined
  tech?: Array<'variations'>
  testString?: string | undefined
  weight?: number | number[] | undefined
}

export type WebFontLoaderSubscribe = (cb: (webFonts: WebFont[]) => void) => void

export type WebFontLoader = (locale: string) => Promise<WebFont[]>

export declare const webFontLoaderSubscribe: WebFontLoaderSubscribe
export declare const webFontLoader: WebFontLoader

declare global {
  interface Window {
    webFontLoaderSubscribe: WebFontLoaderSubscribe
    webFontLoader: WebFontLoader
  }
}
