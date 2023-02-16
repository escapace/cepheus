import {
  createCepheusPlugin,
  type CepheusCassiopeiaPlugin,
  type Options as PluginOptions,
  type OptionsParsed as PluginOptionsParsed
} from '@cepheus/plugin'
import { createInterpolator, Interpolator, State } from 'cepheus'
import { type App, type Plugin } from 'vue'
import { INJECTION_KEY } from './constants'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Plugin as _ } from 'cassiopeia'

export interface Options extends PluginOptions {
  model: unknown
  initialState?: State
}

export interface OptionsParsed extends PluginOptionsParsed {
  model: unknown
  initialState?: State
}

export const createCepheus = (
  options: Options | OptionsParsed
): Plugin & CepheusCassiopeiaPlugin & { interpolator: Interpolator } => {
  const interpolator = createInterpolator(options.model, options.initialState)

  return {
    ...createCepheusPlugin(interpolator, options),
    interpolator,
    install: (app: App) => {
      app.provide(INJECTION_KEY, interpolator)
    }
  }
}
