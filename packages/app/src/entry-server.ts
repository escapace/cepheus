import type { Options } from '@yeuxjs/types'
import { renderToString as cassiopeiaRenderToString } from 'cassiopeia'
import { uneval } from 'devalue'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { SSRContext, renderToString } from 'vue/server-renderer'
import { z } from 'zod'
import { createApp as _createApp } from './create-app'
import { preferencesSchema } from './types'
import webFonts from './web-fonts.json'

const safeParse = <T>(schema: z.ZodType<T>, string: string | undefined) => {
  if (string === undefined) {
    return undefined
  }

  try {
    return schema.parse(JSON.parse(string))
  } catch (e) {
    return undefined
  }
}

export const createApp = async (options: Options = YEUX_OPTIONS) => {
  const hono = new Hono()

  if (import.meta.env.MODE === 'staging') {
    const { serveStatic } = await import('@hono/node-server/serve-static')
    hono.use('*', serveStatic({ root: '../client' }))
  }

  if (import.meta.env.MODE === 'production') {
    const { serveStatic } = await import('hono/cloudflare-workers')
    hono.use('*', serveStatic({ root: './' }))
  }

  hono.post(
    '/preferences',
    validator('json', (value, c) => {
      const parsed = preferencesSchema.safeParse(value)

      if (!parsed.success) {
        return c.text('Invalid!', 401)
      }

      return parsed.data
    }),
    // eslint-disable-next-line @typescript-eslint/require-await
    async (c) => {
      const preferences = c.req.valid('json')

      c.cookie('preferences', JSON.stringify(preferences))

      return c.text('ok', 201)
    }
  )

  hono.get('*', async (c) => {
    const preferences = safeParse(
      preferencesSchema,
      c.req.cookie('preferences')
    )

    const context: SSRContext = {
      cepheus: {
        preferences,
        darkMode: preferences === undefined ? 'media' : 'class'
      }
    }

    const { app, router, pinia, cassiopeia } = await _createApp(context)

    const url = new URL(c.req.url)

    await router.push(url.pathname)
    await router.isReady()

    const route: Readonly<RouteLocationNormalizedLoaded> =
      router.currentRoute.value

    if (route.matched.length === 0) {
      return await c.notFound()
    } else {
      const appHTML = await renderToString(app, context)

      await cassiopeia.update(true)

      const styles = [
        ...cassiopeiaRenderToString(cassiopeia).map(
          (style) =>
            `<style ${
              style.media === undefined ? ' ' : `media="${style.media}" `
            }cassiopeia="${style.name}-${style.key}">${style.content}</style>`
        ),
        `<style>${webFonts.fontFace}</style>`,
        `<style>${webFonts.style}</style>`,
        `<noscript><style>${webFonts.noScriptStyle}</style></noscript>`,
        `<script>${webFonts.script}</script>`,
        `<script>window.webFontLoader(${JSON.stringify('en')});</script>`
      ].join('\n')

      const html = options.template
        .replace('<!--app-html-->', appHTML)
        .replace('<!--app-styles-->', styles)
        .replace(
          '<!--app-state-->',
          `<script>var INITIAL_STATE = ${uneval(pinia.state.value)};</script>`
        )
        .replace(
          '<!--app-html-tag-->',
          ` lang="en"${
            preferences === undefined
              ? ''
              : ` class=${preferences.darkMode ? 'dark' : 'light'}`
          }`
        )

      return c.html(html)
    }
  })

  return { hono, fetch: hono.request }
}

if (
  import.meta.env.MODE === 'staging' &&
  process.argv[1] === (await import('url')).fileURLToPath(import.meta.url)
) {
  const { fileURLToPath } = await import('url')
  const path = await import('path')

  process.chdir(path.dirname(fileURLToPath(import.meta.url)))

  const { hono } = await createApp()
  const { serve } = await import('@hono/node-server')

  serve({
    ...hono,
    port:
      typeof process.env.PORT === 'string' ? parseInt(process.env.PORT) : 3000,
    hostname: process.env.HOST
  })
}

export default (await createApp()).hono
