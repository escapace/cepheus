/* eslint-disable */
// const qwe = document.styleSheets

import {
  ColorSpace,
  convert,
  LCH,
  OKLCH,
  P3,
  serialize,
  sRGB,
  type Color
} from '@cepheus/color'
import { cepheus, normalize, parseJSONModel } from '@cepheus/core'

import type { JSONModel } from '@cepheus/core'
import _model from './models/model.json'
import { debounce } from 'lodash-es'

ColorSpace.register(LCH)
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

const templateSRGB = (values: string[]) => `:root { ${values.join(' ')} }`
const templateP3 = (values: string[]) =>
  `@supports (color: color(display-p3 1 1 1)) { :root { ${values.join(' ')} } }`

const isSameDomain = (styleSheet: CSSStyleSheet): boolean => {
  if (styleSheet.href === null) {
    return true
  }

  return styleSheet.href.indexOf(window.location.origin) === 0
}

const isSupportedCSSRule = (rule: CSSRule) =>
  // CSSRule.STYLE_RULE (1)
  rule.type === 1 ||
  // CSSRule.MEDIA_RULE (4)
  rule.type === 4 ||
  // CSSRule.PAGE_RULE (6)
  rule.type === 6 ||
  // CSSRule.KEYFRAME_RULE (8)
  rule.type === 8 ||
  // CSSRule.SUPPORTS_RULE (12)
  rule.type === 12

const reg = /var\((---[a-zA-Z-0-9,\s]+)\)/gm
const reg2 = /---c-([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)/i

export const getVariables = () => {
  const variables = new Set<string>()

  const elements = document.querySelectorAll('*[style]')

  for (let element of elements) {
    const cssText = element.attributes.getNamedItem('style')?.value

    if (cssText !== undefined) {
      for (let match of cssText.matchAll(reg)) {
        variables.add(match[1])
      }
    }
  }

  for (let cssStyleSheet of document.styleSheets) {
    // TODO: exclude cepheus style sheet
    if (isSameDomain(cssStyleSheet)) {
      for (let cssRule of cssStyleSheet.cssRules) {
        if (isSupportedCSSRule(cssRule)) {
          for (let match of cssRule.cssText.matchAll(reg)) {
            variables.add(match[1])
          }

          // if (res !== null) {
          //   res.forEach((value) => variables.add(value))
          // }
        }
      }
    }
  }

  return variables
}

function isStylesheet(node: Node) {
  return (
    node.nodeName.toLowerCase() === 'link' &&
    ((node as Element)?.getAttribute('rel') || '').indexOf('stylesheet') !== -1
  )
}

function isStyle(node: Node) {
  return node.nodeName.toLowerCase() === 'style'
}

export function init() {
  let paused = true
  // let tokens = new Set<string>()
  let styleElement: HTMLStyleElement | undefined

  // let _timer: number | undefined
  // let _resolvers: Function[] = []
  // const scheduleUpdate = () =>
  //   new Promise((resolve) => {
  //     _resolvers.push(resolve)
  //     if (_timer != null) clearTimeout(_timer)
  //     _timer = setTimeout(
  //       () =>
  //         updateStyle().then(() => {
  //           const resolvers = _resolvers
  //           _resolvers = []
  //           resolvers.forEach((r) => r())
  //         }),
  //       0
  //     ) as any
  //   })

  function getStyleElement() {
    if (!styleElement) {
      styleElement = document.createElement('style')
      document.documentElement.prepend(styleElement)
    }

    return styleElement
  }

  async function updateStyle(value: string) {
    const styleElement = getStyleElement()
    styleElement.innerHTML = value
  }

  const model = parseJSONModel(_model as JSONModel)
  const instance = cepheus(model)
  let darkMode = false
  // instance.updateChroma([0, 1])
  // instance.updateLightness([0, 1])

  const p3Support = window.matchMedia('(color-gamut: p3)').matches

  // const current = new Set<string>()

  let fnRunning = false

  const fn = debounce(
    () => {
      if (fnRunning) {
        return
      }

      fnRunning = true

      const next = getVariables()
      const srgb: string[] = []
      const p3: string[] = []

      next.forEach((value) => {
        const numbers = value.match(reg2)

        if (numbers === null) {
          return
        }

        numbers.shift()

        const colorId = parseInt(numbers[0], 10)
        const triangle = normalize(
          numbers.slice(1).map((value) => parseInt(value, 10))
        ) as [number, number, number]

        if (darkMode) {
          triangle.reverse()
        }

        const coords = instance.barycentric(...triangle, colorId)

        if (coords === undefined) {
          return
        }

        // TODO: opacity
        const colorOKLCH: Color = {
          space: OKLCH,
          coords,
          alpha: 1
        }

        const colorSRGB = convert(colorOKLCH, sRGB, { inGamut: true })
        srgb.push(`${value}: ${serialize(colorSRGB)};`)

        if (p3Support) {
          const colorP3 = convert(colorOKLCH, P3, { inGamut: true })
          p3.push(`${value}: ${serialize(colorP3)};`)
        }

        // current.add(value)
      })

      if (p3Support) {
        updateStyle(templateSRGB(srgb) + ' ' + templateP3(p3))
      } else {
        updateStyle(templateSRGB(srgb))
      }

      fnRunning = false
    },
    1000 / 120,
    { trailing: true }
  )

  const updateChroma = debounce(
    (value: [number, number]) => {
      instance.updateChroma(value)
      fn()
    },
    1000 / 120,
    { leading: true }
  )

  const updateLightness = debounce(
    (value: [number, number]) => {
      instance.updateLightness(
        value
        // darkMode
        //   ? (value.map((value) => 1 - value).reverse() as [number, number])
        //   : value
      )
      fn()
    },
    1000 / 120,
    { leading: true }
  )

  const toggleDarkMode = debounce(
    (value: boolean) => {
      if (darkMode !== value) {
        darkMode = value
        fn()
      }
    },
    1000 / 30,
    { leading: true }
  )

  const mutationObserver = new MutationObserver((mutations) => {
    if (paused) return

    const valid = mutations.some((mutation) => {
      if (mutation.target === styleElement) {
        return false
      }

      if (mutation.type === 'attributes') {
        if (mutation.target.nodeType === 1) {
          // console.log((mutation.target as HTMLElement).attributes.getNamedItem('style')?.value)
          // console.log((mutation.target as HTMLElement)?.style?.cssText)
        }

        return true
      } else if (mutation.type === 'characterData') {
        if (
          mutation.target.parentNode !== null &&
          isStyle(mutation.target.parentNode)
        ) {
          return true
        }
      } else if (mutation.type === 'childList') {
        for (let node of mutation.addedNodes) {
          if (isStylesheet(node)) {
            return true
          }

          if (isStyle(node)) {
            return true
          }
        }

        for (let node of mutation.removedNodes) {
          if (isStylesheet(node)) {
            return true
          }

          if (isStyle(node)) {
            return true
          }
        }
      }

      return false
    })

    if (valid) {
      fn()
    }
  })

  let observing = false

  function observe() {
    if (observing) return
    const target = document.documentElement || document.body

    if (!target) return

    mutationObserver.observe(target, {
      attributes: true,
      // characterData: true,
      // characterDataOldValue: false,
      attributeOldValue: false,
      attributeFilter: ['style'],
      subtree: true,
      childList: true
    })

    observing = true
  }

  function execute() {
    paused = false
    fn()
    observe()
  }

  function ready() {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', execute)
    else execute()
  }

  // function toggleObserver(value?: boolean) {
  //   if (value === undefined) paused = !paused
  //   else paused = !!value
  //   if (!observing && !paused) ready()
  // }

  ready()

  return { updateChroma, updateLightness, toggleDarkMode }
}
