<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ColorSpace, convert, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import { onMounted } from 'vue'
import {
  cepheus,
  parseJSONModel,
  type JSONModel,
  type Point,
  type Triangle
} from '@cepheus/core'
import _model from '../models/model.json'

ColorSpace.register(LCH)
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

const model = parseJSONModel(_model as JSONModel)
const instance = cepheus(model)

function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * -(c[1] - a[1]) - -(b[1] - a[1]) * (c[0] - a[0])
}

onMounted(() => {
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

  const img = context.createImageData(
    context.canvas.width,
    context.canvas.height,
    { colorSpace: supportsDisplayP3 ? 'display-p3' : 'srgb' }
  )

  const interpolator = (alpha: number, beta: number, gamma: number) => {
    const coords = instance.barycentric(alpha, beta, gamma, 2)

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

        // const [w0, w1, w2] = cartesianToBarycentric({ x, y }, v0, v1, v2)

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

  const toX = (x: number) => Math.floor((x / 120) * img.width)
  const toY = (y: number) => Math.floor((y / 120) * img.height)

  fillTriangle(
    img,
    model.triangle.map(([x, y]) => [toX(x), toY(y)]) as Triangle
  )
  context.putImageData(img, 0, 0)

  context!.lineWidth = 2
  context!.strokeStyle = 'black'

  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(toX(model.triangle[0][0]), toY(model.triangle[0][1]))
  context.lineTo(toX(model.triangle[1][0]), toY(model.triangle[1][1]))
  context.lineTo(toX(model.triangle[2][0]), toY(model.triangle[2][1]))
  context.lineTo(toX(model.triangle[0][0]), toY(model.triangle[0][1]))
  context.stroke()

  // context.translate(0, context.canvas.height) // reset where 0,0 is located
  // context.rotate(20 * Math.PI / 180);
  // context.save()
  // context.scale(-1, -1)
  // context.drawImage(context.canvas, 0, 0)
  // context.drawImage(context.canvas, 0, 0)
})
</script>

<template>
  <div class="box">
    <canvas id="canvas" width="1024" height="1024"></canvas>
  </div>
</template>

<style scoped>
.box {
  width: 1024px;
  height: 1024px;
}
</style>