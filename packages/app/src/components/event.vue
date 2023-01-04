<template>
  <div
    class="event-container"
    :style="{
      gridColumn: `${props.dayOfWeek + 3}`,
      gridRow: `${props.hour + 1} / span ${hours}`
    }"
  >
    <div
      class="event"
      :style="{
        gridRow: `${props.minute + 1} / span ${props.duration}`,
        borderLeft: `0.3125rem solid ${props.borderColor}`,
        backgroundColor: `${props.backgroundColor}`
      }"
    >
      <div class="event-time" :style="{ color: props.textColor }">
        {{ time }}
      </div>
      <div class="event-title" :style="{ color: props.textColor }">
        {{ props.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isInteger } from 'lodash-es'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  hour: {
    type: Number,
    required: true,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 23
  },
  minute: {
    type: Number,
    required: true,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 59
  },
  dayOfWeek: {
    type: Number,
    required: true,
    validator: (value: number) => isInteger(value) && value >= 0 && value <= 6
  },
  duration: {
    type: Number,
    required: true,
    validator: (value: number) => isInteger(value) && value >= 10
  },
  textColor: {
    type: String,
    required: true
  },
  borderColor: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    required: true
  }
})

const hours = computed(() => Math.ceil(props.duration / 60) + 1)
const hoursInMinutes = computed(() => hours.value * 60)
const time = computed(
  () =>
    `${props.hour.toString().padStart(2, '0')}:${props.minute
      .toString()
      .padStart(2, '0')}`
)
</script>

<style scoped>
.event {
  border-radius: 0.3125rem;
  padding: 0.3125rem;
  /* font-weight: bold; */
  height: 100%;
  margin-right: 0.1875rem;
  margin-left: 0.125rem;
  overflow: hidden;
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
  margin-bottom: 0.5ex;
}

.event-title {
  font-size: 80%;
}
</style>
