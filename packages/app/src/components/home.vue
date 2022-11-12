<script setup lang="ts">
import { N, szudzik, cartesianProduct } from '@cepheus/utilities'
import type { Model } from '@cepheus/utilities'
import { range } from 'lodash-es'
import type { Color } from '@cepheus/color'
import _model from '../sessions/model.json'
import {
  ColorSpace,
  LCH,
  OKLCH,
  sRGB,
  convert,
  P3,
  serialize
} from '@cepheus/color'

ColorSpace.register(LCH)
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

const chunk = <T>(array: T[], n = 3) =>
  array.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / n)

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [] as T[][])

const fromModel = (model: Model) => {
  const [interval, length, squares, data] = model
  const step = length * 3

  const colors = new Map(
    squares.map((square, index) => {
      return [
        square,
        chunk(data.slice(index * step, (index + 1) * step)) as Array<
          [number, number, number]
        >
      ]
    })
  )

  return { interval, length, squares, colors }
}

const model = fromModel(_model as unknown as Model)
const levels = N / model.interval
const distribution = range(0, N, model.interval)
const numColors = model.length
const colors = range(0, numColors)

const squares = (
  cartesianProduct([...distribution].reverse(), distribution) as Array<
    [number, number]
  >
).map((value) => szudzik(...value.map((v) => v / model.interval)))

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
  gap: calc(10% / v-bind(levels));
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
