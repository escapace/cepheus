/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Options,
  createCepheus as _createCepheus,
  type Cepheus
} from '@cepheus/vue'
import {
  lerp,
  chroma as updateChroma,
  darkMode as updateDarkMode,
  lightness as updateLightness,
  model as updateModel,
  type Model
} from 'cepheus'
import { defineStore, skipHydrate } from 'pinia'
import { computed, ref, watch } from 'vue'

const MAX = 0.25
const MIN = 0.05

const enum EnumModel {
  One = 'one',
  Two = 'two'
}

const enum ModelState {
  Pending = 'pending',
  Active = 'resolved'
}

export const useCepheusStore = defineStore('cepheus', () => {
  const chroma = ref(1)
  const darkMode = ref(false)
  const lightness = ref(0.5)
  const contrast = ref(0.5)
  const model = ref<EnumModel>(EnumModel.One)
  const modelState = ref<ModelState>(ModelState.Pending)
  let cepheus: undefined | Cepheus

  // const cepheusChroma = computed((): [low: number, high: number] => [
  //   0,
  //   chroma.value
  // ])

  const cepheusChroma = computed((): [low: number, high: number] => {
    const c = lerp(0.025, 0, contrast.value)

    return [lerp(0, c, chroma.value), chroma.value]
  })

  const cepheusLightness = computed((): [low: number, high: number] => {
    const c = lerp(MAX, MIN, contrast.value)

    return [lerp(0, c, lightness.value), lerp(1 - c, 1, lightness.value)]
  })

  const importModel = async (model: EnumModel): Promise<Model> => {
    const value =
      model === EnumModel.One
        ? await import('./models/model-one')
        : await import('./models/model-two')

    return value.model
  }

  const createCepheus = async (
    options: Omit<Options, 'state'>
  ): Promise<Cepheus> => {
    if (cepheus === undefined) {
      cepheus = _createCepheus({
        state: {
          lightness: cepheusLightness.value,
          chroma: cepheusChroma.value,
          darkMode: darkMode.value,
          model: await importModel(model.value)
        },
        ...options
      })

      modelState.value = ModelState.Active

      watch(model, async (value) => {
        modelState.value = ModelState.Pending

        void updateModel(cepheus!.interpolator, await importModel(value)).then(
          () => (modelState.value = ModelState.Active)
        )
      })

      watch(
        cepheusLightness,
        (value) => void updateLightness(cepheus!.interpolator, ...value)
      )

      watch(
        cepheusChroma,
        (value) => void updateChroma(cepheus!.interpolator, ...value)
      )

      watch(
        darkMode,
        (value) => void updateDarkMode(cepheus!.interpolator, value)
      )
    }

    return cepheus
  }

  return {
    chroma,
    contrast,
    createCepheus,
    darkMode,
    lightness,
    model,
    modelState: skipHydrate(modelState)
  }
})
