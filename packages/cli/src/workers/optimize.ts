import { isWithin } from '@cepheus/utilities'
import { normalizeAngle } from 'cepheus'
import { ColorSpace, LCH, OKLCH, OKLrCH, P3, sRGB } from 'colorjs.io/fn'
import { mean, sample, sum } from 'simple-statistics'
import {
  TypeOptimizationState,
  type Color,
  type OptimizationState,
  type OptimizeOptions,
  type RequiredOptimizeOptions,
} from '../types'
import { relativeDifference } from '../utilities/relative-difference'
import {
  distances,
  IterationError,
  normalizedCVD,
  normalizeOptions,
  randomColor,
} from './utilities'
import { isColor } from '../utilities/is-color'

// Cost function including weights
const createCosts = (
  options: RequiredOptimizeOptions,
  state: Array<Color | null>,
): OptimizeOptions['weights'] => {
  const statePresent = state.filter((value) => value !== null)
  const { length: colorsTotal } = state
  const { length: colorsPresent } = statePresent

  const colorsCost = 1 - colorsPresent / colorsTotal

  const differenceArray = state.flatMap((value, index) => {
    const referenceColor = options.colors[index]

    if (value === null || referenceColor === null) {
      return []
    }

    return referenceColor.map((initial) => options.distance(value, initial))
  })

  // penalize the increase in the mean distance from initial colors
  const differenceCost = differenceArray.length === 0 ? 1 : mean(differenceArray)

  // penalize the deviation from the target lightness
  const lightnessCost = relativeDifference(
    mean(statePresent.map((value) => value[0])),
    options.lightness.target,
    options.lightness.range[0],
    options.lightness.range[1],
  )

  if (__ENVIRONMENT__ !== 'production' && isNaN(lightnessCost)) {
    const data = [
      mean(statePresent.map((value) => value[0])),
      options.lightness.target,
      options.lightness.range[0],
      options.lightness.range[1],
    ]

    throw new Error(`NAN ${JSON.stringify(data)}`)
  }

  const hueArray = state.flatMap((value, index) => {
    const referenceColor = options.colors[index]

    if (value === null || referenceColor === null) {
      return []
    }

    return referenceColor.map((initial) => normalizeAngle(value[2] - initial[2]) / 360)
  })

  // penalize the deviation from the mean hue
  const hueCost = hueArray.length === 0 ? 1 : mean(hueArray)

  // penalize the deviation from the target chroma
  const chromaCost = relativeDifference(
    mean(statePresent.map((value) => value[1])),
    options.chroma.target,
    options.chroma.range[0],
    options.chroma.range[1],
  )

  // calculate distances under different vision conditions
  const normalDistances = distances(statePresent, options)
  const protanopiaDistances = distances(statePresent, options, 'protanopia')
  const deuteranopiaDistances = distances(statePresent, options, 'deuteranopia')
  const tritanopiaDistances = distances(statePresent, options, 'tritanopia')

  // penalize lower mean distances between colors (want colors to be more distinguishable)
  const normalCost = normalDistances.length === 0 ? 1 : 1 - mean(normalDistances)
  const protanopiaCost = protanopiaDistances.length === 0 ? 1 : 1 - mean(protanopiaDistances)
  const deuteranopiaCost = deuteranopiaDistances.length === 0 ? 1 : 1 - mean(deuteranopiaDistances)
  const tritanopiaCost = tritanopiaDistances.length === 0 ? 1 : 1 - mean(tritanopiaDistances)

  // penalize higher highly uneven distances between colors (want consistent differences)
  const dispersionNormalCost =
    normalDistances.length < 2 ? 1 : normalizedCVD([...normalDistances].sort((a, b) => a - b))
  const dispersionProtanopiaCost =
    protanopiaDistances.length < 2
      ? 1
      : normalizedCVD([...protanopiaDistances].sort((a, b) => a - b))
  const dispersionDeuteranopiaCost =
    deuteranopiaDistances.length < 2
      ? 1
      : normalizedCVD([...deuteranopiaDistances].sort((a, b) => a - b))
  const dispersionTritanopiaCost =
    tritanopiaDistances.length < 2
      ? 1
      : normalizedCVD([...tritanopiaDistances].sort((a, b) => a - b))

  if (__ENVIRONMENT__ !== 'production') {
    const issues = Object.entries({
      chromaCost,
      deuteranopiaCost,
      differenceCost,
      dispersionDeuteranopiaCost,
      dispersionNormalCost,
      dispersionProtanopiaCost,
      dispersionTritanopiaCost,
      hueCost,
      lightnessCost,
      normalCost,
      protanopiaCost,
      tritanopiaCost,
    }).filter(([_, value]) => {
      const v = Math.fround(value)
      return v > 1 || v < 0 || isNaN(v)
    })

    if (issues.length !== 0) {
      console.log({
        dispersionDeuteranopiaCost,
        dispersionNormalCost,
        dispersionProtanopiaCost,
        dispersionTritanopiaCost,

        deuteranopiaDistances,
        normalDistances,
        protanopiaDistances,
        tritanopiaDistances,
      })

      throw new Error(
        `Out of bounds: ${issues.map(([key, value]) => `${key}=${value}`).join(', ')}.`,
      )
    }
  }

  return {
    chroma: chromaCost,
    colors: colorsCost,
    deuteranopia: deuteranopiaCost,
    difference: differenceCost,
    dispersionDeuteranopia: dispersionDeuteranopiaCost,
    dispersionNormal: dispersionNormalCost,
    dispersionProtanopia: dispersionProtanopiaCost,
    dispersionTritanopia: dispersionTritanopiaCost,
    hue: hueCost,
    lightness: lightnessCost,
    normal: normalCost,
    protanopia: protanopiaCost,
    tritanopia: tritanopiaCost,
  }
}

const cost = (options: RequiredOptimizeOptions, colors: Array<Color | null>): number => {
  const costs = createCosts(options, colors)

  const cost = sum(
    (Object.keys(options.weights) as Array<keyof typeof costs>).map(
      (key) => options.weights[key] * costs[key],
    ),
  )

  if (__ENVIRONMENT__ !== 'production' && !isWithin(cost, 0, 1)) {
    throw new Error('Cost not withing [0, 1]')
  }

  return cost
}

/**
 * Returns the effective temperature used in the Metropolis–Hastings test.
 *
 * The product `costDeltaScale * annealingFactor` is the current temperature. We apply a small floor
 * (default = 1e-12) so that the denominator in exp(-Δ / T) never underflows to zero in double
 * precision.
 */
const calculateEffectiveTemperature = (
  costDeltaScale: number,
  annealingFactor: number,
  temperatureFloor = 1e-12,
) => Math.max(costDeltaScale * annealingFactor, temperatureFloor)

const iterate = (options: RequiredOptimizeOptions) => {
  const {
    acceptanceProbabilityTarget,
    iterations,
    movingAverageWeightClippingFactor,
    movingAverageWindowRatio,
  } = options.hyperparameters

  /* Effective window length derived from iterations and the window ratio. */
  const movingAverageWindowLength = Math.max(1, Math.ceil(iterations * movingAverageWindowRatio))
  /* Exponential-moving-average weight corresponding to the window length. */
  const movingAverageWeight = 2 / (movingAverageWindowLength + 1)

  /* Minimum annealing factor implied by the desired final acceptance probability. */
  const minimumAnnealingFactor = 1 / Math.abs(Math.log(acceptanceProbabilityTarget))
  /* Geometric cooling rate chosen so that τ reaches its minimum after the planned iterations. */
  const coolingRate = Math.pow(minimumAnnealingFactor, 1 / iterations)

  let currentColors: Array<Color | null> = options.colors.map(() => null)
  let bestColors: Array<Color | null> = []

  /* Objective value for the current palette. Initialised to the worst possible cost. */
  let currentCost = 1
  /* Objective value for the best palette found so far. */
  let bestCost = 1

  /* Adaptive scale S₀, seeded to cover the full cost range. */
  let costDeltaScale = 1
  /* Annealing factor τ₀, begins at one (hottest point). */
  let annealingFactor = 1

  // iteration loop
  while (annealingFactor > minimumAnnealingFactor) {
    /* Randomly choose which palette slot to mutate this step. */
    const index = options.prng.minmaxInt(0, currentColors.length)
    /* Select a reference colour from the available palette at the same index. */
    const referenceColor =
      options.colors[index] === null
        ? null
        : sample(options.colors[index], 1, () => options.prng.float())[0]

    if (referenceColor === null) {
      continue
    }

    /* Compute the current temperature before generating a neighbour. */
    let temperature = calculateEffectiveTemperature(costDeltaScale, annealingFactor)

    const currentColor = currentColors[index]
    /* Decide what the new colour candidate should be. */
    const candidateColor =
      currentColor === null
        ? randomColor(options, referenceColor)
        : randomColor(options, currentColor, referenceColor, temperature)

    /* Proceed only if a neighbour state was successfully generated. */
    if (candidateColor !== null) {
      const candidateColors = [...currentColors]
      candidateColors[index] = candidateColor
      /* Evaluate the objective for the candidate palette. */
      const candidateCost = cost(options, candidateColors)
      /* Compute the cost change relative to the current state. */
      const costDelta = candidateCost - currentCost

      /*
        Update the adaptive scale using a clipped EMA to dampen the
        effect of large cost jumps while retaining single-step responsiveness.
      */
      const clippedDelta = Math.min(
        Math.abs(costDelta),
        movingAverageWeightClippingFactor * costDeltaScale,
      )
      costDeltaScale =
        movingAverageWeight * clippedDelta + (1 - movingAverageWeight) * costDeltaScale

      /* Re-evaluate the temperature with the new scale. */
      temperature = calculateEffectiveTemperature(costDeltaScale, annealingFactor)

      if (
        /* Accept better solutions immediately */ costDelta <= 0 ||
        /* Otherwise accept with probability exp(−Δ / T). */
        options.prng.float() < Math.exp(-costDelta / temperature)
      ) {
        currentColors = candidateColors
        currentCost = candidateCost

        /* Update the record of the best palette if an improvement was found. */
        if (candidateCost < bestCost) {
          bestColors = [...currentColors]
          bestCost = currentCost
        }
      }
    }

    /* Apply geometric cooling to the annealing factor. */
    annealingFactor *= coolingRate
  }

  /*
    If no valid palette was produced, indicate failure by raising an error.
  */
  if (bestColors.length === 0 || bestColors.every((value) => !isColor(value))) {
    throw new IterationError('No Changes')
  }

  /* Return the best palette and its associated cost discovered during the run. */
  return {
    colors: bestColors,
    cost: bestCost,
  }
}

export const optimize = async (
  options: OptimizeOptions,
  // eslint-disable-next-line typescript/require-await
): Promise<OptimizationState> => {
  ColorSpace.register(LCH)
  ColorSpace.register(OKLCH)
  ColorSpace.register(OKLrCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(P3)

  try {
    const normalizedOptions = normalizeOptions(options)

    return {
      type: TypeOptimizationState.Fulfilled,
      ...iterate(normalizedOptions),
    }
  } catch (error) {
    if (error instanceof IterationError) {
      return { type: TypeOptimizationState.Rejected }
    }

    console.error(error)

    throw error
  }
}
