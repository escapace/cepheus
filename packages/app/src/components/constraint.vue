<!-- eslint-disable typescript/no-non-null-assertion -->
<script setup lang="ts">
import { INTERPOLATOR, type Triangle } from 'cepheus'
import { onMounted, onUnmounted } from 'vue'
import { useInterpolator } from '@cepheus/vue'
import { useCepheusStore } from '../composables/use-cepheus-store'
import { usePane } from '../composables/use-pane'

const instance = useInterpolator()
const model = instance[INTERPOLATOR].state.model

usePane()

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

  if (!supportsDisplayP3) {
    console.log('no support')
    return
  }

  if (context === undefined) {
    context = canvas.getContext('2d', { colorSpace: 'srgb' })!
  }

  const toX = (x: number) => Math.floor((x / 240) * canvas.width)
  const toY = (y: number) => Math.floor((y / 240) * canvas.height)

  const store = useCepheusStore()

  const strokeTriangle = (triangle: Triangle) => {
    context.lineWidth = 2
    context.strokeStyle = 'green'
    context.beginPath()
    context.moveTo(triangle[0][0], triangle[0][1])
    context.lineTo(triangle[1][0], triangle[1][1])
    context.lineTo(triangle[2][0], triangle[2][1])
    context.lineTo(triangle[0][0], triangle[0][1])
    context.stroke()
  }

  const update = () => {
    requestAnimationFrame(() => {
      const img = context.createImageData(context.canvas.width, context.canvas.height, {
        colorSpace: supportsDisplayP3 ? 'display-p3' : 'srgb',
      })

      context.clearRect(0, 0, canvas.width, canvas.height)

      const modelTriangle = model.triangle.map(([x, y]) => [toX(x), toY(y)]) as Triangle

      const triangle = instance[INTERPOLATOR].triangle.map(([x, y]) => [toX(x), toY(y)]) as Triangle

      context.putImageData(img, 0, 0)
      strokeTriangle(modelTriangle)
      strokeTriangle(triangle)
    })
  }

  onUnmounted(store.$subscribe(update))

  update()
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
