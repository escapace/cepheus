import { createInterpolator, type Interpolator, type State } from 'cepheus'
import { inject, type App, type InjectionKey, type Plugin } from 'vue'

const INJECTION_KEY_CEPHEUS: InjectionKey<Interpolator> = Symbol(
  'INJECTION_KEY_CEPHEUS'
)

export const createCepheus = (
  model: unknown,
  initialState?: State
): Plugin & { interpolator: Interpolator } => {
  const interpolator = createInterpolator(model, initialState)

  return {
    interpolator,
    install: (app: App) => {
      app.provide(INJECTION_KEY_CEPHEUS, interpolator)
    }
  }
}

export const useCepheus = () => {
  const cepheus = inject(INJECTION_KEY_CEPHEUS)

  if (cepheus === undefined) {
    throw new Error('bla')
  }

  return cepheus
}
