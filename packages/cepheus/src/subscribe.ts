import { INTERPOLATOR } from './constants'
import type { Interpolator, Subscription, Unsubscribe } from './types'

export const subscribe = (
  interpolator: Interpolator,
  subscription: Subscription
): Unsubscribe => {
  const { subscriptions } = interpolator[INTERPOLATOR]

  subscriptions.add(subscription)

  return () => subscriptions.delete(subscription)
}
