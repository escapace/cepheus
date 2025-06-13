import type { Options } from '@pointe/types'
import { renderToString as cassiopeiaRenderToString } from 'cassiopeia'
import { uneval } from 'devalue'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { cookie, jar, take } from 'seedpods'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { type SSRContext, renderToString } from 'vue/server-renderer'
import type { z } from 'zod'
import { createApp as _createApp } from './create-app'
import webFonts from './fonts.json'
import { preferencesSchema } from './types'
import { disposePinia } from 'pinia'
import { getRuntimeKey } from 'hono/adapter'

const key = Buffer.from('XSRvhjsuPTumCCVsVjPFFdvQF62g6az0rzvVFfed+4E=', 'base64')

const cookies = jar().put(
  cookie<'preferences', 'aes-gcm', z.infer<typeof preferencesSchema>>({
    key: 'preferences',
    keys: [key],
    maxAge: 86_400,
    prefix: '__Secure-',
    sameSite: 'Lax',
    secure: true,
    type: 'aes-gcm',
  }),
)

export const createSession = async (cookieHeader?: string) => {
  const session = await take(cookieHeader, cookies, {
    preferences: (previous, next) => {
      try {
        const parsed = preferencesSchema.parse(next)

        return parsed
      } catch {
        return previous
      }
    },
  })

  session.set('preferences', undefined)

  return session
}

export const createApp = async (options: Options = POINTE_OPTIONS) => {
  const hono = new Hono()

  if (import.meta.env.MODE === 'staging') {
    const { serveStatic } = await import('@hono/node-server/serve-static')
    hono.use('*', serveStatic({ root: '../client' }))
  }

  // if (import.meta.env.MODE === 'production') {
  //   const { serveStatic } = await import('hono/cloudflare-workers')
  //   const manifest = await import('__STATIC_CONTENT_MANIFEST')
  //
  //   hono.use('*', serveStatic({ manifest, root: './' }))
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

      const json = c.req.valid('json')
      session.set('preferences', json)

      for (const value of await session.values()) {
        c.header('set-cookie', value)
      }

      return c.text('ok', 201)
    },
  )

  hono.get('*', async (c) => {
    const session = await createSession(c.req.header('cookie'))
    const preferences = session.get('preferences')

    const context: SSRContext = {
      cepheus: {
        preferences,
      },
    }

    const { app, cassiopeia, cepheus, pinia, router } = await _createApp(context)

    const url = new URL(c.req.url)

    await router.push(url.pathname)
    await router.isReady()

    const route: Readonly<RouteLocationNormalizedLoaded> = router.currentRoute.value

    if (route.matched.length === 0) {
      return await c.notFound()
    } else {
      const appHTML = await renderToString(app, context)

      await cassiopeia.update(true)

      const head = [
        ...cassiopeiaRenderToString(cassiopeia).map(
          (style) =>
            `<style ${
              style.media === undefined ? ' ' : `media="${style.media}" `
            }cassiopeia="${style.name}-${style.key}">${style.content}</style>`,
        ),
        ...(options.manifest?.client['index.html'].css ?? []).map(
          (value) => `<link rel="stylesheet" href="${value}" fetchpriority="high">`,
        ),
        `<style>${webFonts.locales['*'].fontFace}</style>`,
        `<style>${webFonts.locales['*'].style}</style>`,
        `<script>${webFonts.script}</script>`,
        `<script>window.fontLoader(${JSON.stringify('en')});</script>`,
        `<script>var INITIAL_STATE = ${uneval(pinia.state.value)};</script>`,
        ...(options.manifest === undefined
          ? []
          : [
              `<script type="module" src="/${options.manifest?.client['index.html'].file}" crossorigin></script>`,
            ]),
      ].join('\n')

      const html = options.template
        .replace('<!--app-html-->', appHTML)
        .replace('<!--app-head-->', head)
        .replace(
          '<html>',
          `<html lang="en"${
            preferences?.colorScheme === undefined ? '' : ` class=${preferences.colorScheme}`
          }>`,
        )

      const dispose = new Promise<void>((resolve) =>
        setImmediate(() => {
          cepheus.dispose()
          cassiopeia.dispose()
          disposePinia(pinia)

          resolve()
        }),
      )

      if (getRuntimeKey() === 'workerd') {
        console.log(c.executionCtx.waitUntil(dispose))
      }

      return c.html(html)
    }
  })

  return { fetch: hono.request, hono }
}

if (
  import.meta.env.MODE === 'staging' &&
  process.argv[1] === (await import('node:url')).fileURLToPath(import.meta.url)
) {
  const { fileURLToPath } = await import('node:url')
  const path = await import('node:path')

  process.chdir(path.dirname(fileURLToPath(import.meta.url)))

  const { hono } = await createApp()
  const { serve } = await import('@hono/node-server')

  serve({
    ...hono,
    hostname: process.env.HOST,
    port: typeof process.env.PORT === 'string' ? parseInt(process.env.PORT) : 3000,
  })
}

export default (await createApp()).hono
