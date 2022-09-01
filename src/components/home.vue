<script setup lang="ts">
import { optimize } from './wip'
import {
  ColorSpace,
  LCH,
  OKLab,
  OKLCH,
  convert,
  parse,
  sRGB,
  serialize,
  P3
} from '../colorjs-io'

ColorSpace.register(P3)
ColorSpace.register(OKLab)
ColorSpace.register(OKLCH)
ColorSpace.register(sRGB)
ColorSpace.register(LCH)

// const parse = (color) => {
//   const value = _parse(color)
//
//   return {
//     space: ColorSpace.get(value.space ?? value.spaceId),
//     coords: value.coords,
//     alpha: value.alpha ?? 1
//   }
// }

const initial = [
  parse('#9966FF'),
  // parse('#0055BC'),
  // new Color('#00A1C2'),
  parse('#ED6804'),
  // new Color('#B3063D'),
  parse('#45cb85'),
  parse('#E08DAC')
]

const colors = optimize(initial)

// console.log(initial)
//
// console.log(
//   initial.map(
//     (color) => convert(clone(color), 'oklab', { inGamut: true })
//   )
// )
//
// console.log(
//   initial.map((color) =>
//     serialize(convert(clone(color), 'oklab', { inGamut: true }), {
//       format: 'color'
//     })
//   )
// )

// import Rand, { PRNG } from 'rand-seed'
// import { range, map } from 'lodash-es'
// import { customRandom } from 'nanoid'
// import { Cluster, Clusterer } from 'k-medoids'
//
// // TODO: cache
//
// const prng = new Rand('1293asdh32', PRNG.xoshiro128ss)
//
// // function getRandomArbitrary(min, max) {
// //   return Math.random() * (max - min) + min;
// // }
//
// const nanoid = customRandom('abcdefghijklmnopqrstuvwxyz', 10, (size) => {
//   return new Uint8Array(size).map(() => 256 * prng.next())
// })
//
// // 100 random colors
//
// const colors = map(range(24), () => {
//   return {
//     id: nanoid(),
//     color: new Color({
//       space: 'p3',
//       coords: [prng.next(), prng.next(), prng.next()]
//     })
//   }
// })
//
// const clusters = Clusterer.getInstance(colors, 8, (a, b) => {
//   return Math.abs(a.color.deltaEJz(b.color))
// })
//   .getClusteredData()
//   .map((value) => {
//     return [...value].sort(
//       (a, b) =>
//         b.color.clone().to('oklab').l -
//         a.color.clone().to('oklab').l
//     )
//   })
//
// console.log(clusters)
</script>

<template>
  <div>
    <div class="p5">
      <p class="text-lg font-sans mb6">Input Colors</p>
      <div class="flex flex-wrap items-center w-full">
        <div v-for="(color, index) in initial" :key="index">
          <div
            class="w-10 h-10 m-1"
            :style="{
              background: serialize(convert(color, 'srgb', { inGamut: true }), {
                format: 'rgba'
              })
              // serialize(convert(color, 'p3', { inGamut: true }), {
              //   format: 'color'
              // })
            }"
          ></div>
        </div>
      </div>
    </div>

    <div class="p5">
      <p class="text-lg font-sans mb6">Optmizied Colors</p>
      <div class="flex flex-wrap items-center w-full">
        <div v-for="(color, index) in colors" :key="index">
          <div
            class="w-10 h-10 m-1"
            :style="{
              'background-color': serialize(
                convert(color, 'srgb', { inGamut: true }),
                {
                  format: 'rgba'
                }
              )
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- <div class="p5"> -->
    <!--   <p class="text-lg font-sans mb6">Input Colors</p> -->
    <!--   <div class="flex flex-wrap items-center w-full"> -->
    <!--     <div v-for="color in colors"> -->
    <!--       <div -->
    <!--         class="w-10 h-10 m-1" -->
    <!--         :style="{ -->
    <!--           'background-color': [ -->
    <!--             color.color -->
    <!--               .to('srgb') -->
    <!--               .toString({ inGamut: true, format: 'rgba' }), -->
    <!--             color.color.toString({ format: 'color' }) -->
    <!--           ] -->
    <!--         }" -->
    <!--       ></div> -->
    <!--     </div> -->
    <!--   </div> -->
    <!-- </div> -->
    <!---->
    <!-- <div class="px5"> -->
    <!--   <p class="text-lg font-sans mb6">Clusters</p> -->
    <!--   <div v-for="cluster in clusters"> -->
    <!--     <div class="flex flex-wrap items-center w-full"> -->
    <!--       <div v-for="color in cluster"> -->
    <!--         <div -->
    <!--           class="w-10 h-10 m-1" -->
    <!--           :style="{ -->
    <!--             'background-color': [ -->
    <!--               color.color -->
    <!--                 .to('srgb') -->
    <!--                 .toString({ inGamut: true, format: 'rgba' }), -->
    <!--               color.color.toString({ format: 'color' }) -->
    <!--             ] -->
    <!--           }" -->
    <!--         ></div> -->
    <!--       </div> -->
    <!--     </div> -->
    <!--   </div> -->
    <!-- </div> -->
  </div>
</template>

<style scoped></style>
