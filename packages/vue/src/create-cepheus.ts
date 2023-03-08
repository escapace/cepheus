import {
  createCepheusPlugin,
  type CepheusCassiopeiaPlugin,
  type Options as PluginOptions,
  type OptionsParsed as PluginOptionsParsed
} from '@cepheus/plugin'
import {
  createInterpolator,
  Interpolator,
  Options as CepheusOptions
} from 'cepheus'
import { type App, type Plugin } from 'vue'
import { INJECTION_KEY } from './constants'

export interface Options extends PluginOptions, CepheusOptions {
  model: unknown
}

export interface OptionsAdvanced extends PluginOptionsParsed, CepheusOptions {
  model: unknown
}

export type Cepheus = Plugin &
  CepheusCassiopeiaPlugin & {
    interpolator: Interpolator
  }

export const createCepheus = (options: Options | OptionsAdvanced): Cepheus => {
  const interpolator = createInterpolator(options.model, options)

  return {
    ...createCepheusPlugin(interpolator, options),
    interpolator,
    install: (app: App) => {
      app.provide(INJECTION_KEY, interpolator)
    }
  }
}
