import {
  createCepheusPlugin,
  type Options as PluginOptions
} from '@cepheus/plugin'
import { type Plugin as CassiopeiaPlugin } from 'cassiopeia'
import {
  createInterpolator,
  Interpolator,
  Options as CepheusOptions
} from 'cepheus'
import { type App, type Plugin as VuePlugin } from 'vue'
import { INJECTION_KEY } from './constants'

export interface Options extends PluginOptions {
  state: CepheusOptions
}

export type Cepheus = CassiopeiaPlugin &
  VuePlugin & {
    interpolator: Interpolator
  }

export const createCepheus = (options: Options): Cepheus => {
  const interpolator = createInterpolator(options.state)

  return {
    ...createCepheusPlugin(interpolator, options),
    interpolator,
    install: (app: App) => {
      app.provide(INJECTION_KEY, interpolator)
    }
  }
}
