<script setup lang="ts">
import { toSquare } from '@cepheus/utilities'
import { useCepheus } from '@cepheus/vue'
import {
  DisplayP3,
  DisplayP3Gamut,
  gamutMapOKLCH,
  OKLCH,
  serialize,
  sRGB,
  sRGBGamut,
} from '@texel/color'
import { INTERPOLATOR, LENGTH as N } from 'cepheus'
import { range } from 'lodash-es'

const interpolator = useCepheus()
const model = interpolator[INTERPOLATOR].state.model

const levels = (N * 2) / model.interval
const numberColors = model.length
const colors = range(0, numberColors)

const cartesianProduct = <T,>(...sets: T[][]) =>
  sets.reduce<T[][]>(
    (accumulatorSets, set) =>
      accumulatorSets.flatMap((accumulatorSet) => set.map((value) => [value, ...accumulatorSet])),
    [[]],
  )

const tile = (interval: number): number[] => {
  const tuple = range(0, N * 2, interval)

  return cartesianProduct([...tuple].reverse(), tuple).map((value): number =>
    toSquare(value as [number, number], interval),
  )
}

const squares = tile(model.interval)

const toStyle = (squareIndex: number, colorIndex: number) => {
  const colors = model.colors.get(squareIndex)

  if (colors === undefined) {
    return undefined
  }

  const coords = colors[colorIndex]

  if (coords === undefined) {
    return undefined
  }

  const colorSRGB = gamutMapOKLCH(coords, sRGBGamut, OKLCH)
  const colorP3 = gamutMapOKLCH(coords, DisplayP3Gamut, OKLCH)

  return [serialize(colorSRGB, OKLCH, sRGB), serialize(colorP3, OKLCH, DisplayP3)]
}
</script>

<template>
  <div class="grid-container">
    <div v-for="(_, colorIndex) in colors" :key="colorIndex" class="grid">
      <div
        v-for="(square, index) in squares"
        :key="index"
        :style="{ backgroundColor: (toStyle(square, colorIndex) as any) ?? 'none' }"
        class="square"
      >
        <div class="label">
          <!-- {{ square }} -->
          <!-- <svg viewBox="0 0 100 100"> -->
          <!--   <text textLength="100" x="0" y="50"  class="label">{{ square }}</text> -->
          <!-- </svg> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  padding-left: 2em;
  padding-right: 2em;
  width: calc(min(100vh, 100vw) * v-bind(numberColors));
  height: 100vh;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-evenly;
  align-items: center;
}

.grid {
  width: calc(min(100vh, 100vw) / 1.1);
  height: calc(min(100vh, 100vw) / 1.1);
  display: grid;
  grid-template-columns: repeat(v-bind(levels), 1fr);
  grid-template-rows: repeat(v-bind(levels), 1fr);
  place-items: center;
  /* gap: calc(1% / v-bind(levels)); */
}

.square {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* margin: 10px; */
  /* background-color: black; */
  /* margin: 1rem; */
}

.square .label {
  width: 80%;
  padding-right: 10%;
  padding-left: 10%;
  /* height: 100%; */
  line-height: 1;
  white-space: nowrap;
  color: white;
  font-size: 8px;
  text-align: center;
  font-stretch: condensed;
}
</style>
