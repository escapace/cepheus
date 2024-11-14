<template>
  <div
    class="event-container"
    :style="{
      gridColumn: `${properties.dayOfWeek + 3}`,
      gridRow: `${properties.hour + 1} / span ${hours}`,
    }"
  >
    <div
      class="event"
      :style="{
        gridRow: `${properties.minute + 1} / span ${properties.duration}`,
        borderLeft: `0.3125rem solid ${properties.borderColor}`,
        backgroundColor: properties.backgroundColor,
      }"
    >
      <div class="event-time" :style="{ color: properties.textColor }">
        {{ time }}
      </div>
      <div class="event-title" :style="{ color: properties.textColor }">
        {{ properties.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isInteger } from 'lodash-es'
import { computed } from 'vue'

const properties = defineProps({
  backgroundColor: {
    required: true,
    type: String,
  },
  borderColor: {
    required: true,
    type: String,
  },
  dayOfWeek: {
    required: true,
    type: Number,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 6,
  },
  duration: {
    required: true,
    type: Number,
    validator: (value: number) => isInteger(value) && value >= 10,
  },
  hour: {
    required: true,
    type: Number,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 23,
  },
  minute: {
    required: true,
    type: Number,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 59,
  },
  textColor: {
    required: true,
    type: String,
  },
  title: {
    required: true,
    type: String,
  },
})

const borderColor = computed(() => properties.borderColor)
const hours = computed(() => Math.ceil(properties.duration / 60) + 1)
const hoursInMinutes = computed(() => hours.value * 60)
const time = computed(
  () =>
    `${properties.hour.toString().padStart(2, '0')}:${properties.minute.toString().padStart(2, '0')}`,
)
</script>

<style lang="scss" scoped>
* {
  transition: background-color 300ms linear;
}

.event {
  border-radius: 0.3125rem;
  padding: 0.3125rem;
  /* font-weight: bold; */
  height: 100%;
  margin-right: 0.1875rem;
  margin-left: 0.125rem;
  overflow: hidden;
  border: 1px v-bind(borderColor) dotted;
}

.event-container {
  display: inline-grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(v-bind(hoursInMinutes), 1fr);
  align-content: center;
  align-items: center;
}

.event-time {
  font-size: 60%;
  font-weight: bold;
  margin-bottom: 0.5ex;
}

.event-title {
  padding-top: 4px;
  font-size: 90%;
}
</style>
