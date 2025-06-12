<script setup lang="ts">
import { tile } from '@cepheus/utilities'
import { useInterpolator } from '@cepheus/vue'
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

const interpolator = useInterpolator()
const palette = interpolator[INTERPOLATOR].state.palette

const levels = N / palette.interval
const numberColors = palette.length
const colors = range(0, numberColors)

const squares = tile(palette.interval)

const toStyle = (squareIndex: number, colorIndex: number): Record<string, unknown> => {
  const colors = palette.colors.get(squareIndex)
  const coords = colors?.[colorIndex]

  if (coords === undefined) {
    return { border: `rgba(0, 0, 0, 0.2) 1px dashed`, boxSizing: 'border-box' }
  }

  const colorSRGB = gamutMapOKLCH(coords, sRGBGamut, OKLCH)
  const colorP3 = gamutMapOKLCH(coords, DisplayP3Gamut, OKLCH)

  return {
    backgroundColor: [serialize(colorSRGB, OKLCH, sRGB), serialize(colorP3, OKLCH, DisplayP3)],
  }
}
</script>

<template>
  <div class="grid-container">
    <div v-for="(_, colorIndex) in colors" :key="colorIndex" class="grid">
      <div
        v-for="(square, index) in squares"
        :key="index"
        :style="toStyle(square, colorIndex) as any"
        class="square"
      >
        <!-- <div class="label"> -->
          <!-- {{ square }} -->
          <!-- <svg viewBox="0 0 100 100"> -->
          <!--   <text textLength="100" x="0" y="50"  class="label">{{ square }}</text> -->
          <!-- </svg> -->
        <!-- </div> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  padding-left: 2em;
  padding-right: 2em;
  /* width: calc(min(100vh, 100vw) * v-bind(numberColors)); */
  /* height: 100vh; */
  gap: 3em;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-evenly;
  align-items: center;
  margin: 5em;
}

.grid {
  /* width: calc(min(100vh, 100vw) / 1.1); */
  /* height: calc(min(100vh, 100vw) / 1.1); */
  display: grid;
  grid-template-columns: repeat(v-bind(levels), 1fr);
  grid-template-rows: repeat(v-bind(levels), 1fr);
  place-items: center;
  grid-auto-flow: column;
  /* gap: calc(1% / v-bind(levels)); */
}

.square {
  width: 1rem;
  height: 1rem;
  display: block;
  /* align-items: center; */
  /* justify-content: center; */
  /* margin: 10px; */
  /* margin: 1rem; */
}

/* .square .label { */
/*   width: 80%; */
/*   padding-right: 10%; */
/*   padding-left: 10%; */
/*   line-height: 1; */
/*   white-space: nowrap; */
/*   color: white; */
/*   font-size: 8px; */
/*   text-align: center; */
/*   font-stretch: condensed; */
/* } */
</style>
