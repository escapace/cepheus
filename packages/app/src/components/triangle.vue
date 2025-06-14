<!-- eslint-disable typescript/no-non-null-assertion -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { barycentric, INTERPOLATOR, type Point, type Triangle } from 'cepheus'
import { useInterpolator } from '@cepheus/vue'
import { range } from 'lodash-es'
import {
  DisplayP3,
  DisplayP3Gamut,
  floatToByte,
  gamutMapOKLCH,
  sRGB,
  sRGBGamut,
} from '@texel/color'

function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * -(c[1] - a[1]) - -(b[1] - a[1]) * (c[0] - a[0])
}

onMounted(() => {
  const instance = useInterpolator()

  range(0, 4).forEach((palette) => {
    // eslint-disable-next-line typescript/no-unnecessary-type-assertion
    const canvas = document.querySelector(`#canvas-${palette}`)! as HTMLCanvasElement

    let context: CanvasRenderingContext2D | undefined
    let supportsDisplayP3 = false

    try {
      context = canvas.getContext('2d', { colorSpace: 'display-p3' }) ?? undefined

      if (context?.getContextAttributes().colorSpace === 'display-p3') {
        supportsDisplayP3 = true
      }
    } catch {}

    if (!supportsDisplayP3) {
      console.log('no support')
      return
    }

    context ??= canvas.getContext('2d', { colorSpace: 'srgb' })!

    const img = context.createImageData(context.canvas.width, context.canvas.height, {
      colorSpace: supportsDisplayP3 ? 'display-p3' : 'srgb',
    })

    const interpolator = (alpha: number, beta: number, gamma: number) => {
      const coords = barycentric(instance, palette, alpha, beta, gamma)

      if (coords === undefined) {
        return [255, 255, 255]
      }

      return gamutMapOKLCH(
        coords,
        supportsDisplayP3 ? DisplayP3Gamut : sRGBGamut,
        supportsDisplayP3 ? DisplayP3 : sRGB,
      ).map((value) => floatToByte(value))
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

          if (Math.max(w0, Math.max(w1, w2)) > 1) {
            continue
          }

          if (Math.min(w0, Math.min(w1, w2)) < 0) {
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

    const toX = (x: number) => Math.floor((x / 150) * img.width) + 100
    const toY = (y: number) => Math.floor((y / 150) * img.height) + 100

    const triangle = instance[INTERPOLATOR].state.palette.triangles[0]

    fillTriangle(img, triangle.map(([x, y]) => [toX(x), toY(y)]) as Triangle)
    context.putImageData(img, 0, 0)

    context.lineWidth = 2
    context.strokeStyle = 'red'

    context.beginPath()
    context.lineTo(toX(triangle[0][0]), toY(triangle[0][1]))
    context.lineTo(toX(triangle[1][0]), toY(triangle[1][1]))
    context.lineTo(toX(triangle[2][0]), toY(triangle[2][1]))
    context.lineTo(toX(triangle[0][0]), toY(triangle[0][1]))
    context.stroke()
  })

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
    <canvas id="canvas-0" width="1024" height="1024"></canvas>
    <canvas id="canvas-1" width="1024" height="1024"></canvas>
    <canvas id="canvas-2" width="1024" height="1024"></canvas>
    <canvas id="canvas-3" width="1024" height="1024"></canvas>
  </div>
</template>

<style scoped>
.box {
  display: block;
  width: 1024px;
  height: 1024px;
}
</style>
