<script setup lang="ts">
import Rand, { PRNG } from 'rand-seed'
import { optimize } from './wip'
import {
  ColorSpace,
  LCH,
  OKLab,
  HSL,
  OKLCH,
  convert,
  parse,
  sRGB,
  serialize,
  P3
} from '../colorjs-io'

ColorSpace.register(HSL)
ColorSpace.register(P3)
ColorSpace.register(OKLab)
ColorSpace.register(OKLCH)
ColorSpace.register(sRGB)
ColorSpace.register(LCH)

const prng = new Rand('abcpeuh2', PRNG.xoshiro128ss)

const initial = [
  parse('#1473e6'),
  parse('#d7373f'),
  parse('#da7b11'),
  parse('#268e6c')
  /* parse('#491d8b'), */
  /* parse('#878d96') */
]

const clusters = [
  optimize({
    colors: initial,
    background: parse('#ffffff'),
    random: () => prng.next(),
    colorSpace: ColorSpace.get('p3'),
    contrast: {
      range: [30, 45]
    },
    chroma: {
      range: [0, 0.05]
    },
    lightness: {
      range: [0, 1]
    }
  }),
  optimize({
    colors: initial,
    background: parse('#ffffff'),
    random: () => prng.next(),
    colorSpace: ColorSpace.get('p3'),
    contrast: {
      range: [60, 75]
    },
    chroma: {
      range: [0.1, 0.3]
    },
    lightness: {
      range: [0, 1]
    }
  })
  /* optimize({ */
  /*   colors: initial, */
  /*   background: parse('#ffffff'), */
  /*   random: () => prng.next(), */
  /*   colorSpace: ColorSpace.get('p3'), */
  /*   contrast: { */
  /*     range: [60, 75] */
  /*   }, */
  /*   chroma: { */
  /*     range: [0.3, 0.4] */
  /*   } */
  /* }) */
]

// console.log(colors)
//
// console.log(
//   initial.map((color) =>
//     serialize(convert(color, ColorSpace.get('hsl'), { inGamut: true }), {
//       format: 'hsla'
//     })
//   )
// )
//
// console.log('here')

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
              'background-color': serialize(
                convert(color, ColorSpace.get('hsl'), { inGamut: true }),
                {
                  format: 'hsla'
                }
              )
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
      <div v-for="(colors, index1) in clusters" :key="index1">
        <div class="flex flex-wrap items-center w-full">
          <div v-for="(color, index2) in colors" :key="index2">
            <div
              class="w-10 h-10 m-1"
              :style="{
                'background-color': serialize(
                  convert(color, 'hsl', { inGamut: true }),
                  {
                    format: 'hsla'
                  }
                )
              }"
            ></div>
          </div>
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
