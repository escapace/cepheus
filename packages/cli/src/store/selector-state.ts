import { Store } from './create-store'

export const selectorState = (store: Store) => store.log[0]
