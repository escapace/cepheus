import { mean, standardDeviation } from 'simple-statistics'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'

export const selectorStatistics = (store: Store) => {
  const squares = Array.from(
    selectorSquares(store, store.allIterations).entries()
  )
  const squaresRemaining = squares.length
  const squaresTotal = store.indexSquare.size
  const costs = squares.map(([_, task]) => task.state.cost)
  const colors = store.options.colors.length

  const costMin = Math.min(...costs)
  const costMax = Math.max(...costs)
  const costMean = mean(costs)
  const costSd = standardDeviation(costs)

  return {
    colors,
    costMax,
    costMean,
    costMin,
    costSd,
    squaresRemaining,
    squaresTotal
  }
}
