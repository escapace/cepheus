<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  INTERPOLATOR,
  chroma as setChroma,
  lightness as setLightness,
  type Point,
  type Triangle,
  barycentric
} from 'cepheus'
import { onMounted, onUnmounted, reactive, watch } from 'vue'
import { convert, OKLCH, P3, sRGB } from '@cepheus/color'
import { Pane } from 'tweakpane'
import { useCepheus } from '@cepheus/vue'

const instance = useCepheus()
const model = instance[INTERPOLATOR].state.model

function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * -(c[1] - a[1]) - -(b[1] - a[1]) * (c[0] - a[0])
}

// const modelTriangle =

// type Point = [number, number]
// type Triangle = [Point, Point, Point]
// type Line = [Point, Point]

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect

// const cartesianToBarycentric = (p: Point, a: Point, b: Point, c: Point) => {
//   const l0 =
//     ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) /
//     ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
//   const l1 =
//     ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) /
//     ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
//   return [l0, l1, 1.0 - l0 - l1]
// }

// const barycentricToCartesian = (
//   t: Triangle,
//   a: number,
//   b: number,
//   c: number
// ): Point => {
//   const x = a * t[0][0] + b * t[1][0] + c * t[2][0]
//   const y = a * t[0][1] + b * t[1][1] + c * t[2][1]
//
//   return [x, y]
// }

// function fillTriangle(imageData: ImageData, v0: Point, v1: Point, v2: Point) {
//   const data = imageData.data
//   const width = imageData.width
//
//   // precalculate the area of the parallelogram defined by our triangle
//   const area = cross(v0, v1, v2)
//
//   // get all properties on our first vertex, for interpolating later
//   // const props = Object.getOwnPropertyNames(v0)
//
//   // p is our 2D pixel location point
//   // const p: Point = {}
//
//   // fragment is the resulting pixel with all the vertex attributes interpolated
//   // const fragment = {}
//
//   for (let y = minY; y < maxY; y++) {
//     for (let x = minX; x < maxX; x++) {
//       // sample from the center of the pixel, not the top-left corner
//       const p = { x: x + 0.5, y: y + 0.5 }
//
//       // calculate vertex weights
//       // should divide these by area, but we do that later
//       // so we divide once, not three times
//       const w0 = cross(v1, v2, p) / area
//       const w1 = cross(v2, v0, p) / area
//       const w2 = cross(v0, v1, p) / area
//
//       // const [w0, w1, w2] = cartesianToBarycentric({ x, y }, v0, v1, v2)
//
//       if (Math.max(w0, Math.max(w1, w2)) > 1.0) {
//         continue
//       }
//
//       if (Math.min(w0, Math.min(w1, w2)) < 0.0) {
//         continue
//       }
//
//       const [R, G, B] = interpolator(w0, w1, w2)
//
//       // // interpolate our vertices
//       // for (let i = 0; i < props.length; i++) {
//       //   var prop = props[i]
//       //
//       //   // divide by area here to normalize
//       //   fragment[prop] =
//       //     (w0 * v0[prop] + w1 * v1[prop] + w2 * v2[prop]) / area
//       // }
//
//       // set pixel
//       const index = (y * width + x) * 4
//
//       data[index + 0] = R
//       data[index + 1] = G
//       data[index + 2] = B
//       data[index + 3] = 255
//     }
//   }
// }

onMounted(() => {
  const pane = new Pane()

  const state = reactive({
    lightness0: 0,
    lightness1: 1,
    chroma0: 0,
    chroma1: 1,
    darkMode: false
  })

  pane.addInput(state, 'lightness0', { min: 0, max: 1, step: 0.01 })
  pane.addInput(state, 'lightness1', { min: 0, max: 1, step: 0.01 })

  pane.addInput(state, 'chroma0', { min: 0, max: 1, step: 0.01 })
  pane.addInput(state, 'chroma1', { min: 0, max: 1, step: 0.01 })

  onUnmounted(() => pane.dispose())

  const canvas = document.querySelector('canvas')!

  let context: CanvasRenderingContext2D | undefined
  let supportsDisplayP3 = false

  try {
    context = canvas.getContext('2d', { colorSpace: 'display-p3' }) ?? undefined

    if (context?.getContextAttributes().colorSpace === 'display-p3') {
      supportsDisplayP3 = true
    }
  } catch {}

  if (supportsDisplayP3 === false) {
    console.log('no support')
    return
  }

  if (context === undefined) {
    context = canvas.getContext('2d', { colorSpace: 'srgb' })!
  }

  const interpolator = (alpha: number, beta: number, gamma: number) => {
    const coords = barycentric(instance, 1, alpha, beta, gamma)

    if (coords === undefined) {
      return [255, 255, 255]
    }

    return convert(
      {
        space: OKLCH,
        alpha: 1,
        coords
      },
      supportsDisplayP3 ? P3 : sRGB,
      { inGamut: true }
    ).coords.map((value) => value * 255)
  }

  function fillTriangle(imageData: ImageData, triangle: Triangle) {
    const v0 = triangle[0]
    const v1 = triangle[1]
    const v2 = triangle[2]

    const minX = Math.floor(Math.min(v0[0], v1[0], v2[0]))
    const maxX = Math.ceil(Math.max(v0[0], v1[0], v2[0]))
    const minY = Math.floor(Math.min(v0[1], v1[1], v2[1]))
    const maxY = Math.ceil(Math.max(v0[1], v1[1], v2[1]))

    const data = imageData.data
    const width = imageData.width

    // precalculate the area of the parallelogram defined by our triangle
    const area = cross(v0, v1, v2)

    // get all properties on our first vertex, for interpolating later
    // const props = Object.getOwnPropertyNames(v0)

    // p is our 2D pixel location point
    // const p: Point = {}

    // fragment is the resulting pixel with all the vertex attributes interpolated
    // const fragment = {}

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        // sample from the center of the pixel, not the top-left corner
        const p: Point = [x + 0.5, y + 0.5]

        // calculate vertex weights
        // should divide these by area, but we do that later
        // so we divide once, not three times
        const w0 = cross(v1, v2, p) / area
        const w1 = cross(v2, v0, p) / area
        const w2 = cross(v0, v1, p) / area

        // const [w0, w1, w2] = cartesianToBarycentric(p, v0, v1, v2)

        if (Math.max(w0, Math.max(w1, w2)) > 1.0) {
          continue
        }

        if (Math.min(w0, Math.min(w1, w2)) < 0.0) {
          continue
        }

        const [R, G, B] = interpolator(w0, w1, w2)

        // // interpolate our vertices
        // for (let i = 0; i < props.length; i++) {
        //   var prop = props[i]
        //
        //   // divide by area here to normalize
        //   fragment[prop] =
        //     (w0 * v0[prop] + w1 * v1[prop] + w2 * v2[prop]) / area
        // }

        // set pixel
        const index = (y * width + x) * 4

        data[index + 0] = R
        data[index + 1] = G
        data[index + 2] = B
        data[index + 3] = 255
      }
    }
  }

  const toX = (x: number) => Math.floor((x / 240) * canvas.width)
  const toY = (y: number) => Math.floor((y / 240) * canvas.height)

  const strokeTriangle = (triangle: Triangle) => {
    context!.lineWidth = 2
    context!.strokeStyle = 'black'
    context!.beginPath()
    context!.moveTo(triangle[0][0], triangle[0][1])
    context!.lineTo(triangle[1][0], triangle[1][1])
    context!.lineTo(triangle[2][0], triangle[2][1])
    context!.lineTo(triangle[0][0], triangle[0][1])
    context!.stroke()
  }

  watch(state, (state) => {
    const img = context!.createImageData(
      context!.canvas.width,
      context!.canvas.height,
      { colorSpace: supportsDisplayP3 ? 'display-p3' : 'srgb' }
    )
    // setChroma(instance, 0, 1)
    // setLightness(instance, 0, 1)
    context!.clearRect(0, 0, canvas.width, canvas.height)

    const modelTriangle = model.triangle.map(([x, y]) => [
      toX(x),
      toY(y)
    ]) as Triangle

    // fillTriangle(img, modelTriangle)

    setChroma(instance, state.chroma0, state.chroma1)
    setLightness(instance, state.lightness0, state.lightness1)

    const triangle = instance[INTERPOLATOR].triangle.map(([x, y]) => [
      toX(x),
      toY(y)
    ]) as Triangle

    fillTriangle(img, triangle)

    context!.putImageData(img, 0, 0)
    strokeTriangle(modelTriangle)
    strokeTriangle(triangle)
  })
})
</script>

<template>
  <div>
    <div class="box">
      <canvas id="canvas" width="1024" height="1024"></canvas>
    </div>
  </div>
</template>

<style scoped>
.box {
  width: 1024px;
  height: 1024px;
}
</style>
