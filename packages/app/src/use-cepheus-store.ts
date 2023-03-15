import { lerp, type Model } from 'cepheus'
import { defineStore } from 'pinia'

interface State {
  darkMode: boolean
  lightness: [number, number]
  chroma: [number, number]
  model: 'one' | 'two'
}

const MAX = 0.3

export const useCepheusStore = defineStore('cepheus', {
  state: (): State => ({
    lightness: [0, 1],
    chroma: [0, 1],
    model: 'one',
    darkMode: false
  }),
  actions: {
    updateLightness(value: number) {
      if (this.darkMode) {
        this.lightness = [lerp(0, MAX, value), 1]
      } else {
        this.lightness = [0, lerp(1 - MAX, 1, value)]
      }
    },
    async importModel(): Promise<Model> {
      const { model } =
        this.model === 'one'
          ? await import('./models/model-one')
          : await import('./models/model-two')

      return model
    }
  }
})
