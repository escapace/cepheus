import { Pane } from 'tweakpane'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useCepheusStore } from './use-cepheus-store'

export const usePane = () => {
  const store = useCepheusStore()

  onMounted(() => {
    const pane = new Pane()

    // tweakpane can't handle undefined
    const colorScheme = computed<'dark' | 'light' | 'no-preference'>({
      get() {
        return store.colorScheme ?? 'no-preference'
      },
      set(value) {
        store.colorScheme = value === 'no-preference' ? undefined : value
      },
    })

    const contrast = ref<number>(store.contrast ?? 0.5)
    const contrastSystem = ref<boolean>(store.contrast === undefined)

    watch(
      [contrast, contrastSystem],
      ([contrast, contrastSystem]) => {
        store.contrast = contrastSystem ? undefined : contrast
      },
      { immediate: true },
    )

    const bindings = reactive({
      colorScheme,
      contrast,
      contrastSystem,
    })

    pane.addBinding(store, 'model', {
      label: 'theme',
      options: {
        one: 'one',
        two: 'two',
      },
    })
    pane.addBinding(store, 'lightness', { max: 1, min: 0, step: 0.01 })
    pane.addBinding(store, 'chroma', { max: 1, min: 0, step: 0.01 })
    pane.addBinding(bindings, 'contrastSystem', { label: 'system contrast' })
    pane.addBinding(bindings, 'contrast', { max: 1, min: 0, step: 0.01 })
    pane.addBinding(bindings, 'colorScheme', {
      label: 'scheme',
      options: {
        'dark': 'dark',
        'light': 'light',
        'no-preference': 'no-preference',
      },
    })

    const unsubscribe = store.$subscribe(
      () => {
        pane.refresh()
      },
      { deep: true },
    )

    onUnmounted(unsubscribe)

    onUnmounted(() => pane.dispose())
  })
}
