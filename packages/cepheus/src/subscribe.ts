import { remove } from 'coastal'
import { CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator, Subscription, Unsubscribe } from './types'

export const subscribe = (interpolator: Interpolator, subscription: Subscription): Unsubscribe => {
  const { subscriptions } = interpolator[CEPHEUS_INTERPOLATOR]

  if (!subscriptions.includes(subscription)) {
    subscriptions.push(subscription)
  }

  return () => {
    remove(subscriptions, (value) => value === subscription)
  }
}
