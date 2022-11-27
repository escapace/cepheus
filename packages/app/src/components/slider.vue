<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 1,
  step: 0.01
})

const start = ref(props.min)
const end = ref(props.max)

const a = computed<string>({
  get() {
    return start.value.toString()
  },
  set(val) {
    const value = parseFloat(val)

    if (value > end.value) {
      end.value = value
    }

    start.value = value
  }
})

const b = computed<string>({
  get() {
    return end.value.toString()
  },
  set(val) {
    const value = parseFloat(val)

    if (value < start.value) {
      start.value = value
    }

    end.value = value
  }
})

const range = computed({
  get() {
    return [start.value, end.value] as [number, number]
  },
  set(value) {
    start.value = value[0]
    end.value = value[1]
  }
})

defineExpose({ range: () => range })
</script>

<template>
  <div class="range-slider">
    <input
      v-model="a"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
    />
    <input
      v-model="b"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
    />
  </div>
</template>

<style scoped>
.range-slider {
  width: 10rem;
  margin: auto;
  text-align: center;
  position: relative;
  height: 6em;
}

.range-slider input[type='range'] {
  position: absolute;
  left: 0;
  bottom: 0;
}

input[type='range'] {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
}

input[type='range']:focus {
  outline: none;
}

input[type='range']:focus::-webkit-slider-runnable-track {
  background: #2497e3;
}

input[type='range']:focus::-ms-fill-lower {
  background: #2497e3;
}

input[type='range']:focus::-ms-fill-upper {
  background: #2497e3;
}

input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  background: #2497e3;
  border-radius: 1px;
  box-shadow: none;
  border: 0;
}

input[type='range']::-webkit-slider-thumb {
  z-index: 2;
  position: relative;
  box-shadow: 0px 0px 0px #000;
  border: 1px solid #2497e3;
  height: 18px;
  width: 18px;
  border-radius: 25px;
  background: #a1d0ff;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  margin-top: -7px;
}
</style>
