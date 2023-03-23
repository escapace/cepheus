<script setup lang="ts">
import { Temporal, Intl } from '@js-temporal/polyfill'
import { useTimeoutPoll } from '@vueuse/core'
import { range } from 'lodash-es'
import { onBeforeUpdate, onMounted, onUnmounted, ref } from 'vue'
import Event from './event.vue'
// import { useCepheus } from '@cepheus/vue'
import { useCassiopeia } from '@cassiopeia/vue'
import { usePane } from '../hooks/use-pane'
const { Xoshiro128 } = await import('@thi.ng/random')

const random = new Xoshiro128([123, 123, 123, 123])

usePane()

// const interpolator = useCepheus()
const cassiopeia = useCassiopeia()

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
  events: Array<InstanceType<typeof Event>['$props']>
}

const data = ref<Data>()

const createEvents = (): Data['events'] => {
  const titles = [
    'Soft landing 2023?',
    'Sustaining support to Ukraine',
    '2023 Global Energy Forum',
    'Freedom and Prosperity Research Conference',
    'The future of US-Africa trade',
    'Dog Walk',
    'Book Club',
    'Soft landing 2023?',
    'Sustaining support to Ukraine',
    '2023 Global Energy Forum',
    'Freedom and Prosperity Research Conference',
    'The future of US-Africa trade',
    'Dog Walk',
    'Book Club'
  ]

  cassiopeia.clear()

  return titles.map((title) => {
    const bc = random.minmaxInt(0, 4)

    const bg = cassiopeia.add(
      `---color-${bc}-${random.minmaxInt(200, 850)}-${random.minmaxInt(
        50,
        100
      )}`
    )

    const textColor = cassiopeia.add(
      `---invert-${random.minmaxInt(0, 3)}-${random.minmaxInt(
        0,
        100
      )}-${random.minmaxInt(0, 23)}`
    )

    const borderColor = cassiopeia.add(
      `---hue-${bc}-${random.minmaxInt(900, 1023)}-${random.minmaxInt(
        1000,
        1023
      )}--20-099`
    )

    return {
      dayOfWeek: random.minmaxInt(0, 7),
      hour: random.minmaxInt(4, 20),
      minute: random.minmaxInt(0, 41),
      duration: random.minmaxInt(60, 121),
      backgroundColor: `var(${bg}, black)`,
      textColor: `var(${textColor}, black)`,
      borderColor: `var(${borderColor}, black)`,
      title
    }
  })
}

const update = () => {
  const now = Temporal.Now.plainDateTime(calendar)
  const time = Temporal.PlainTime.from(now)
  const date = Temporal.PlainDate.from(now)
  const events = createEvents()

  data.value = {
    events,
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
    week: `W${date.weekOfYear} `
  }
}

onBeforeUpdate(() => {
  cassiopeia.update(false)
})

update()
const { pause, resume } = useTimeoutPoll(update, 30 * 1000)

// cassiopeia.update(false)
cassiopeia.update(false)

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
      <div class="subheader">
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
          v-for="(event, index) in data?.events"
          :key="index"
          :day-of-week="event.dayOfWeek"
          :hour="event.hour"
          :minute="event.minute"
          :duration="event.duration"
          :background-color="event.backgroundColor"
          :text-color="event.textColor"
          :border-color="event.borderColor"
          :title="event.title"
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
$calendar-template: $time-width 0.625rem repeat(7, 1fr);
$current-time-color: var(---color-3-1023-1023);
$grid-color: var(---color-2-0-900);
$background-weekday: var(---color-primary-20-1020);
$background-weekend: var(---color-primary-75-1000);

$header-color: var(---color-primary-25-900);
$subheader-color: var(---color-primary-20-900);

* {
  transition: background-color 200ms linear;
}

.control {
  background-color: $background-weekday;
}

.container {
  width: 100%;
  display: grid;
  grid-template-rows: $title-height $days-height auto;
  font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui,
    helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial,
    sans-serif;
  /* position: absolute; */
}

.subheader {
  display: grid;
  place-content: center;
  text-align: center;
  grid-template-columns: $calendar-template;
  top: $title-height;
  border-bottom: 0.125rem solid $header-color;
  background-color: $subheader-color;
  color: var(---color-2-100-2);
}

.day {
  border-left: 0.0625rem solid $grid-color;
}

.content {
  display: grid;
  grid-template-columns: $calendar-template;
  grid-template-rows: repeat(24, $time-height);
  background-color: $background-weekday;
}

.time {
  grid-column: 1;
  text-align: right;
  align-self: end;
  font-size: 80%;
  position: relative;
  bottom: -1ex;
  color: var(---color-3-1-100);
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
  background-color: $background-weekend;
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
  background-color: $header-color;
  color: var(---color-3-1-1);
}

.month {
  text-align: center;
  display: grid;
  place-content: center;
}

.week {
  font-weight: 500;
  grid-column: 1;
  grid-row: 1;
}
</style>
