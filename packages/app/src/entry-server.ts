import type { Options } from '@yeuxjs/types'
import { renderToString as cassiopeiaRenderToString } from 'cassiopeia'
import { uneval } from 'devalue'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
// import { take } from 'lodash-es'
// import manifest from '__STATIC_CONTENT_MANIFEST'
import { cookie, jar, take } from 'seedpods'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { SSRContext, renderToString } from 'vue/server-renderer'
import { z } from 'zod'
import { createApp as _createApp } from './create-app'
import webFonts from './fonts.json'
import { preferencesSchema } from './types'

const key = Buffer.from(
  'XSRvhjsuPTumCCVsVjPFFdvQF62g6az0rzvVFfed+4E=',
  'base64'
)

const cookies = jar().put(
  cookie<'preferences', 'aes-gcm', z.infer<typeof preferencesSchema>>({
    key: 'preferences',
    type: 'aes-gcm',
    secure: true,
    sameSite: 'Lax',
    prefix: '__Secure-',
    maxAge: 86400,
    keys: [key]
  })
)

export const createSession = async (cookieHeader?: string) => {
  const session = await take(cookieHeader, cookies, {
    preferences: (prev, next) => {
      try {
        const parsed = preferencesSchema.parse({
          ...(prev ?? {}),
          ...(next ?? {})
        })

        return parsed
      } catch {
        return prev
      }
    }
  })

  session.set('preferences', undefined)

  return session
}

export const createApp = async (options: Options = YEUX_OPTIONS) => {
  const hono = new Hono()

  if (import.meta.env.MODE === 'staging') {
    const { serveStatic } = await import('@hono/node-server/serve-static')
    hono.use('*', serveStatic({ root: '../client' }))
  }

  // if (import.meta.env.MODE === 'production') {
  //   const { serveStatic } = await import('hono/cloudflare-workers')
  //   // const manifest = await import('__STATIC_CONTENT_MANIFEST')
  //
  //   hono.use('*', serveStatic({ root: './', manifest }))
  // }

  hono.post(
    '/preferences',
    validator('json', (value, c) => {
      const parsed = preferencesSchema.safeParse(value)

      if (!parsed.success) {
        return c.text('Invalid!', 401)
      }

      return parsed.data
    }),
    async (c) => {
      const session = await createSession(c.req.header('cookie'))

      session.set('preferences', c.req.valid('json'))

      for await (const value of await session.values()) {
        c.header('set-cookie', value)
      }

      return c.text('ok', 201)
    }
  )

  hono.get('*', async (c) => {
    const session = await createSession(c.req.header('cookie'))
    const preferences = session.get('preferences')

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

      return await c.html(html)
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
