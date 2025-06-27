import { CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator, Subscription, Unsubscribe } from './types'
import { filter } from './utilities/filter'

export const subscribe = (interpolator: Interpolator, subscription: Subscription): Unsubscribe => {
  const { subscriptions } = interpolator[CEPHEUS_INTERPOLATOR]

  if (!subscriptions.includes(subscription)) {
    subscriptions.push(subscription)
  }

  return () => {
    filter(subscriptions, (value) => value !== subscription)
  }
}
