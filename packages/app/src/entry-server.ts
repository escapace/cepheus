import type { Options } from '@yeuxjs/types'
import { renderToString as cassiopeiaRenderToString } from 'cassiopeia'
import { uneval } from 'devalue'
import { Hono } from 'hono'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createApp as vueCreateApp } from './create-app'

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

  hono.get('*', async (c) => {
    const { app, router, pinia, cassiopeia } = await vueCreateApp()
    const url = new URL(c.req.url)

    await router.push(url.pathname)
    await router.isReady()

    const route: Readonly<RouteLocationNormalizedLoaded> =
      router.currentRoute.value

    if (route.matched.length === 0) {
      return await c.notFound()
    } else {
      const context: SSRContext & { modules?: string[] } = {}

      const appHTML = await renderToString(app, context)

      await cassiopeia.update(false)

      const styles = cassiopeiaRenderToString(cassiopeia)
        .map(
          (style) =>
            `<style ${
              style.media === undefined ? ' ' : `media="${style.media}" `
            }cassiopeia="${style.name}-${style.key}">${style.content}</style>`
        )
        .join('\n')

      const html = options.template
        .replace('<!--app-html-->', appHTML)
        .replace('<!--app-styles-->', styles)
        .replace(
          '<!--app-state-->',
          `<script>var INITIAL_STATE = ${uneval(pinia.state.value)};</script>`
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
