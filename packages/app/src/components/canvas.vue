<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ColorSpace, convert, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import { onMounted } from 'vue'
import _model from '../models/model.json'
import { createInterpolator, parseModel, type ModelUnparsed } from 'cepheus'

ColorSpace.register(LCH)
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

const model = parseModel(_model as ModelUnparsed)
const instance = createInterpolator(model)

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

  const interpolator = (x: number, y: number) => {
    const coords = instance.cartesian(x, y, 2, true)

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

  const toX = (x: number) => Math.floor((x / 120) * img.width)
  const toY = (y: number) => Math.floor((y / 120) * img.height)

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [R, G, B] = interpolator(
        (120 * x) / img.width,
        (120 * y) / img.height
      )

      const i = x + y * img.width
      img.data[i * 4 + 0] = R
      img.data[i * 4 + 1] = G
      img.data[i * 4 + 2] = B
      img.data[i * 4 + 3] = 255
    }
  }

  context.putImageData(img, 0, 0)

  // [ 0, 0 ],
  // [ 10.677083333333334, 10.026041666666666 ],
  // [ 13.932291666666666, 0 ]
  // [ [ 0, 0 ], [ 79.296875, 69.921875 ], [ 99.86979166666667, 0 ] ]
  // [ [ 0, 0 ], [ 79.6875, 69.53125 ], [ 99.21875, 0 ] ]
  // [ [ 0, 0 ], [ 71.875, 69.53125 ], [ 99.21875, 0 ] ]

  // context.strokeStyle = 'black'
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(toX(model.triangle[0][0]), toY(model.triangle[0][1]))
  context.lineTo(toX(model.triangle[1][0]), toY(model.triangle[1][1]))
  context.lineTo(toX(model.triangle[2][0]), toY(model.triangle[2][1]))
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
