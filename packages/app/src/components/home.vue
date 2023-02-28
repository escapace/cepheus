<script setup lang="ts">
import type { Color } from '@cepheus/color'
import {
  ColorSpace,
  convert,
  LCH,
  OKLCH,
  P3,
  serialize,
  sRGB
} from '@cepheus/color'
import { LENGTH as N, parseModel, type ModelUnparsed } from 'cepheus'
import { toSquare } from '@cepheus/utilities'
import { range } from 'lodash-es'
import _model from '../models/model.json'

ColorSpace.register(LCH)
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

const model = parseModel(_model as ModelUnparsed)
const levels = N / model.interval
const numColors = model.length
const colors = range(0, numColors)

const cartesianProduct = <T>(...sets: T[][]) =>
  sets.reduce<T[][]>(
    (accSets, set) =>
      accSets.flatMap((accSet) => set.map((value) => [value, ...accSet])),
    [[]]
  )

const tile = (interval: number): number[] => {
  const tuple = range(0, N, interval)

  return cartesianProduct([...tuple].reverse(), tuple).map((value): number =>
    toSquare(value as [number, number], interval)
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

  const colorOKLCH: Color = {
    space: OKLCH,
    coords,
    alpha: 1
  }

  const colorSRGB = convert(colorOKLCH, sRGB, { inGamut: true })
  const colorP3 = convert(colorOKLCH, P3, { inGamut: true })

  return [serialize(colorSRGB), serialize(colorP3)]
}
</script>

<template>
  <div class="grid-container">
    <div v-for="(_, colorIndex) in colors" :key="colorIndex" class="grid">
      <div
        v-for="(square, index) in squares"
        :key="index"
        :style="{ 'backgroundColor': toStyle(square, colorIndex) as any ?? 'none' }"
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
  width: calc(min(100vh, 100vw) * v-bind(numColors));
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
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
