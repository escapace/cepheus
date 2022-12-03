declare module 'get-css-data' {
  interface GetCssDataOptions {
    rootElement?: HTMLElement
    include?: string
    exclude?: string
    filter?: RegExp
    skipDisabled?: boolean
    useCSSOM?: boolean
    // onBeforeSend?:
    onBeforeSend?: (xhr: XMLHttpRequest, node: Node, url: string) => void
    onSuccess?: (cssText: string, node: Node, url: string) => string | false
    onError?: (xhr: XMLHttpRequest, node: Node, url: string) => void
    onComplete?: (
      cssText: string,
      cssArray: string[],
      nodeArray: Node[]
    ) => void
  }

  declare const getCssData: (options: GetCssDataOptions) => void
  export default getCssData
}
