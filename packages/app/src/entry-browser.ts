import { createApp } from './create-app'

void createApp().then(
  ({ app, router }) =>
    void router.isReady().then(() => {
      document.documentElement.classList.remove('no-js')
      document.documentElement.classList.add('js')

      app.mount('#app')
    })
)
