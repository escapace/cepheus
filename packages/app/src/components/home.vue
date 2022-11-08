<script setup lang="ts">
import data from '../sessions/light-model.json'
import { cartesianProduct, szudzik } from '@cepheus/utilities'
import { range } from 'lodash-es'
import {
  ColorSpace,
  LCH,
  Color,
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

const CUBE_INDEX = new Map(
  data.squares as Array<[number, Array<[number, number, number]>]>
)

const interval = data.interval
const levels = 120 / data.interval
const distribution = range(0, 120, interval)
const NUM_COLORS = 4

const squares = (
  cartesianProduct(distribution, distribution) as Array<[number, number]>
)
  .map((value) => szudzik(...value.map((v) => v / interval)))
  .reverse()

// if (CUBE_INDEX.has(index)) {
//   const colors = CUBE_INDEX.get(index)!
//
//   const color = []
// }
//
// return {
//   style: {}
// }

const toStyle = (squareIndex: number, colorIndex: number) => {
  const colors = CUBE_INDEX.get(squareIndex)

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

  return [serialize(colorSRGB), serialize(colorOKLCH), serialize(colorP3)]
}

const colors = range(0, NUM_COLORS)
</script>

<template>
  <div class="grid-container">
    <div v-for="(_, colorIndex) in colors" :key="colorIndex" class="grid">
      <div
        v-for="(square, index) in squares"
        :key="index"
        :style="{ background: toStyle(square, colorIndex) ?? 'none' }"
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
  width: calc(min(100vh, 100vw) * v-bind(NUM_COLORS));
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
