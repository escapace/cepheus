import { Pane } from 'tweakpane'
import { onMounted, onUnmounted } from 'vue'
import { useCepheusStore } from './use-cepheus-store'

export const usePane = () => {
  const store = useCepheusStore()

  onMounted(() => {
    const pane = new Pane()

    pane.addBinding(store, 'model', {
      label: 'theme',
      options: {
        one: 'one',
        two: 'two'
      }
    })
    pane.addBinding(store, 'lightness', { min: 0, max: 1, step: 0.01 })
    pane.addBinding(store, 'chroma', { min: 0, max: 1, step: 0.01 })
    pane.addBinding(store, 'contrast', { min: 0, max: 1, step: 0.01 })
    pane.addBinding(store, 'darkMode', { label: 'dark mode' })

    pane.addBinding(store, 'modelState', { label: 'state', readonly: true })

    onUnmounted(
      store.$subscribe(() => {
        pane.refresh()
      })
    )

    onUnmounted(() => pane.dispose())
  })
}
