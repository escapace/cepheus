import { Pane } from 'tweakpane'
import { onMounted, onUnmounted } from 'vue'
import { useCepheusStore } from './use-cepheus-store'

export const usePane = () => {
  const store = useCepheusStore()

  onMounted(() => {
    const pane = new Pane()

    pane.addInput(store, 'model', {
      label: 'theme',
      options: {
        one: 'one',
        two: 'two'
      }
    })
    pane.addInput(store, 'lightness', { min: 0, max: 1, step: 0.01 })
    pane.addInput(store, 'chroma', { min: 0, max: 1, step: 0.01 })
    pane.addInput(store, 'contrast', { min: 0, max: 1, step: 0.01 })
    pane.addInput(store, 'darkMode', { label: 'dark mode' })

    pane.addMonitor(store, 'modelState', { label: 'state' })

    onUnmounted(
      store.$subscribe(() => {
        pane.refresh()
      })
    )

    onUnmounted(() => pane.dispose())
  })
}