import type { CepheusState } from '../types'
import type { Store } from './create-store'

export async function actionUpdateStage(store: Store, value: CepheusState) {
  store.log.unshift(value)

  await store.emit('state', value)
}
