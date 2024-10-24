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
    pane.addBinding(store, 'lightness', { max: 1, min: 0, step: 0.01 })
    pane.addBinding(store, 'chroma', { max: 1, min: 0, step: 0.01 })
    pane.addBinding(store, 'contrast', { max: 1, min: 0, step: 0.01 })
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
