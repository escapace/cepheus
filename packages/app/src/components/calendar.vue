<script setup lang="ts">
import { Temporal, Intl } from '@js-temporal/polyfill'
import { useTimeoutPoll } from '@vueuse/core'
import { range } from 'lodash-es'
import { onMounted, onUnmounted, ref } from 'vue'
import Event from './event.vue'

const calendar = new Temporal.Calendar('iso8601')
const timeZone = Temporal.Now.timeZone()
const weekDayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  weekday: 'short',
  timeZone,
  calendar
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone,
  calendar
})

interface Data {
  days: Array<{ title: string; current: boolean }>
  time: { row: number; hour: number }
  month: string
  week: string
}

const data = ref<Data>()

// const createEvents = () => {
//
// }

const update = () => {
  const now = Temporal.Now.plainDateTime(calendar)
  const time = Temporal.PlainTime.from(now)
  const date = Temporal.PlainDate.from(now)

  data.value = {
    days: range(1, 8).map((dayOfWeek) => {
      const days = dayOfWeek - now.dayOfWeek
      const sign = Math.sign(days)

      const plainDate =
        sign === -1
          ? date.subtract({ days: Math.abs(days) })
          : sign === 1
          ? date.add({ days: Math.abs(days) })
          : date

      const current = plainDate.equals(date)

      return {
        title: weekDayFormatter.format(plainDate),
        current
      }
    }),
    month: dateFormatter.format(date),
    time: { row: time.hour + 1, hour: (time.minute / 60) * 100 },
    week: `W${date.weekOfYear}`
  }
}

update()
const { pause, resume } = useTimeoutPoll(update, 1000)

onMounted(() => {
  resume()
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div>
    <div class="container">
      <div class="header">
        <div class="week">{{ data?.week }}</div>
        <div class="month">{{ data?.month }}</div>
      </div>
      <div class="days">
        <div class="filler"></div>
        <div class="filler"></div>
        <div
          v-for="(day, index) in data?.days"
          :key="index"
          :class="{ current: day.current }"
          class="day"
        >
          {{ day.title }}
        </div>
      </div>
      <div class="content">
        <div class="time" style="grid-row: 1">01:00</div>
        <div class="time" style="grid-row: 2">02:00</div>
        <div class="time" style="grid-row: 3">03:00</div>
        <div class="time" style="grid-row: 4">04:00</div>
        <div class="time" style="grid-row: 5">05:00</div>
        <div class="time" style="grid-row: 6">06:00</div>
        <div class="time" style="grid-row: 7">07:00</div>
        <div class="time" style="grid-row: 8">08:00</div>
        <div class="time" style="grid-row: 9">09:00</div>
        <div class="time" style="grid-row: 10">10:00</div>
        <div class="time" style="grid-row: 11">11:00</div>
        <div class="time" style="grid-row: 12">12:00</div>
        <div class="time" style="grid-row: 13">13:00</div>
        <div class="time" style="grid-row: 14">14:00</div>
        <div class="time" style="grid-row: 15">15:00</div>
        <div class="time" style="grid-row: 16">16:00</div>
        <div class="time" style="grid-row: 17">17:00</div>
        <div class="time" style="grid-row: 18">18:00</div>
        <div class="time" style="grid-row: 19">19:00</div>
        <div class="time" style="grid-row: 20">20:00</div>
        <div class="time" style="grid-row: 21">21:00</div>
        <div class="time" style="grid-row: 22">22:00</div>
        <div class="time" style="grid-row: 23">23:00</div>
        <div class="filler-col"></div>
        <div class="col" style="grid-column: 3"></div>
        <div class="col" style="grid-column: 4"></div>
        <div class="col" style="grid-column: 5"></div>
        <div class="col" style="grid-column: 6"></div>
        <div class="col" style="grid-column: 7"></div>
        <div class="col weekend" style="grid-column: 8"></div>
        <div class="col weekend" style="grid-column: 9"></div>
        <div class="row" style="grid-row: 1"></div>
        <div class="row" style="grid-row: 2"></div>
        <div class="row" style="grid-row: 3"></div>
        <div class="row" style="grid-row: 4"></div>
        <div class="row" style="grid-row: 5"></div>
        <div class="row" style="grid-row: 6"></div>
        <div class="row" style="grid-row: 7"></div>
        <div class="row" style="grid-row: 8"></div>
        <div class="row" style="grid-row: 9"></div>
        <div class="row" style="grid-row: 10"></div>
        <div class="row" style="grid-row: 11"></div>
        <div class="row" style="grid-row: 12"></div>
        <div class="row" style="grid-row: 13"></div>
        <div class="row" style="grid-row: 14"></div>
        <div class="row" style="grid-row: 15"></div>
        <div class="row" style="grid-row: 16"></div>
        <div class="row" style="grid-row: 17"></div>
        <div class="row" style="grid-row: 18"></div>
        <div class="row" style="grid-row: 19"></div>
        <div class="row" style="grid-row: 20"></div>
        <div class="row" style="grid-row: 21"></div>
        <div class="row" style="grid-row: 22"></div>
        <div class="row" style="grid-row: 23"></div>
        <Event
          :day-of-week="0"
          :hour="1"
          :duration="120"
          :minute="45"
          background-color="black"
          border-color="white"
          title="Event Bla"
        />
        <div
          class="current-time"
          :style="{
            gridRow: data?.time.row,
            top: `calc(${data?.time.hour.toFixed(5)}% - 0.0625rem)`
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$title-height: 3rem;
$days-height: 3rem;
$time-width: 3rem;
$time-height: 3rem;
$grid-color: #dadce0;
$calendar-template: $time-width 0.625rem repeat(7, 1fr);
$current-time-color: #ea4335;

.container {
  width: 100%;
  display: grid;
  grid-template-rows: $title-height $days-height auto;
  font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui,
    helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial,
    sans-serif;
  /* position: absolute; */
}

.days {
  background: #f3f2f1;
  display: grid;
  place-content: center;
  text-align: center;
  grid-template-columns: $calendar-template;
  top: $title-height;
  z-index: 10;
  border-bottom: 0.125rem solid $grid-color;
}

.day {
  border-left: 0.0625rem solid $grid-color;
}

.content {
  display: grid;
  grid-template-columns: $calendar-template;
  grid-template-rows: repeat(24, $time-height);
}

.time {
  grid-column: 1;
  text-align: right;
  align-self: end;
  font-size: 80%;
  position: relative;
  bottom: -1ex;
  color: #70757a;
  padding-right: 0.125rem;
}

.col {
  border-right: 0.0625rem solid $grid-color;
  grid-row: 1 / span 24;
  grid-column: span 1;
}

.filler-col {
  grid-row: 1 / -1;
  grid-column: 2;
  border-right: 0.0625rem solid $grid-color;
}

.row {
  grid-column: 2 / -1;
  border-bottom: 0.0625rem solid $grid-color;
}

.weekend {
  background-color: #f1f3f4;
}

.current-time {
  grid-column: span 7 / 10;
  width: 100%;
  height: 0.125rem;
  border-top: 0.125rem solid $current-time-color;
  position: relative;
}

.current {
  font-weight: 500;
}

.header {
  padding-right: 0.75rem;
  padding-left: 0.75rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  grid-template-rows: 1fr;
  align-content: center;
  align-items: center;
  background: #217346;
}

.month {
  text-align: center;
  display: grid;
  place-content: center;
  color: #fff;
  /* top: 0; */
  /* z-index: 10; */
}

.week {
  color: #fff;
  font-weight: 500;
  grid-column: 1;
  grid-row: 1;
}
</style>
