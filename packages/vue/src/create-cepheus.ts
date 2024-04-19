import {
  createCepheusPlugin,
  type Options as PluginOptions
} from '@cepheus/plugin'
import type { Plugin as CassiopeiaPlugin } from 'cassiopeia'
import {
  createInterpolator,
  type Interpolator,
  type Options as CepheusOptions
} from 'cepheus'
import type { App, Plugin as VuePlugin } from 'vue'
import { INJECTION_KEY } from './constants'

export interface Options extends PluginOptions {
  state: CepheusOptions
}

export type Cepheus = {
  interpolator: Interpolator
} & CassiopeiaPlugin &
  VuePlugin

export const createCepheus = (options: Options): Cepheus => {
  const interpolator = createInterpolator(options.state)

  return {
    ...createCepheusPlugin(interpolator, options),
    install: (app: App) => {
      app.provide(INJECTION_KEY, interpolator)
    },
    interpolator
  }
}
