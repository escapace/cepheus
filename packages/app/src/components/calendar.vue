<script setup lang="ts">
import { Intl, Temporal } from '@js-temporal/polyfill'
import { useTimeoutPoll } from '@vueuse/core'
import { range } from 'lodash-es'
import { onMounted, onUnmounted, ref } from 'vue'
import Event from './event.vue'
// import { useCepheus } from '@cepheus/vue'
import { useCassiopeia } from '@cassiopeia/vue'
import { usePane } from '../composables/use-pane'
const { SFC32 } = await import('@thi.ng/random')

usePane()

// const interpolator = useCepheus()
const cassiopeia = useCassiopeia()

const calendar = new Temporal.Calendar('iso8601')
const weekDayFormatter = new Intl.DateTimeFormat('en-US', {
  calendar,
  day: '2-digit',
  timeZone: 'UTC',
  weekday: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  calendar,
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
})

const formatDate = (value: Temporal.PlainDate) => {
  let month = ''
  let year = ''

  for (const part of dateFormatter.formatToParts(value)) {
    if (part.type === 'year') {
      year = part.value
    }

    if (part.type === 'month') {
      month = part.value
    }
  }

  return [month, year].join(' ')
}

const formatWeekDay = (value: Temporal.PlainDate) => {
  let day = ''
  let weekday = ''

  for (const part of weekDayFormatter.formatToParts(value)) {
    if (part.type === 'day') {
      weekday = part.value
    }

    if (part.type === 'weekday') {
      day = part.value
    }
  }

  return [day, weekday].join(' ')
}


interface Data {
  days: Array<{ current: boolean; title: string }>
  events: Array<InstanceType<typeof Event>['$props']>
  month: string
  time: { hour: number; row: number }
  week: string
}

const data = ref<Data>()

let called = 0

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
    'Book Club',
  ]

  cassiopeia.clear()

  return titles.map((title, index) => {
    called = called + 1
    const random = new SFC32([index + called * 1000])

    const bc = random.minmaxInt(0, 4)

    const bg = cassiopeia.add(
      `---color-${bc}-${random.minmaxInt(12, 25)}-${random.minmaxInt(150, 175)}`,
    )

    const textColor = cassiopeia.add(
      `---invert-${random.minmaxInt(0, 3)}-${random.minmaxInt(0, 5)}-${random.minmaxInt(0, 5)}`,
    )

    const borderColor = cassiopeia.add(
      `---color-${random.minmaxInt(0, 3)}-${random.minmaxInt(225, 249)}-${random.minmaxInt(225, 249)}-95`,
    )

    return {
      backgroundColor: `var(${bg}, black)`,
      borderColor: `var(${borderColor}, black)`,
      dayOfWeek: random.minmaxInt(0, 7),
      duration: random.minmaxInt(60, 121),
      hour: random.minmaxInt(4, 20),
      minute: random.minmaxInt(0, 41),
      textColor: `var(${textColor}, black)`,
      title,
    }
  })
}

const update = () => {
  const now = Temporal.Now.zonedDateTime(calendar, 'UTC')
  const time = Temporal.PlainTime.from(now)
  const date = Temporal.PlainDate.from(now)
  const events = createEvents()

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
        current,
        title: formatWeekDay(plainDate),
      }
    }),
    events,
    month: formatDate(date),
    time: { hour: (time.minute / 60) * 100, row: time.hour + 1 },
    week: `W${date.weekOfYear} `,
  }

  void cassiopeia.update(false)
}

// onBeforeUpdate(() => {
//   void cassiopeia.update(false)
// })

void update()
const { pause, resume } = useTimeoutPoll(update, 3 * 1000)

// void cassiopeia.update(false)

onMounted(() => {
  setTimeout(() => resume(), 3 * 1000)
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div>
    <div class="container">
      <div class="header">
        <div class="week sans-serif-italic">{{ data?.week }}</div>
        <div class="month">{{ data?.month }}</div>
      </div>
      <div class="subheader">
        <div class="filler"></div>
        <div class="filler"></div>
        <div v-for="(day, index) in data?.days" :key="index" :class="{ 'sans-serif-bold': day.current }" class="day">
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
        <Event v-for="(event, index) in data?.events" :key="index" :day-of-week="event.dayOfWeek" :hour="event.hour"
          :minute="event.minute" :duration="event.duration" :background-color="event.backgroundColor"
          :text-color="event.textColor" :border-color="event.borderColor" :title="event.title" />
        <div class="current-time sans-serif-bold" :style="{
          gridRow: data?.time.row,
          top: `calc(${data?.time.hour.toFixed(5)}% - 0.0625rem)`,
        }"></div>
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
$current-time-color: var(---color-3-254-254);
$grid-color: var(---color-2-225-0);
$background-weekday: var(---color-primary-252-5);
$background-weekend: var(---color-primary-249-9);

$header-color: var(---color-primary-250-8);
$subheader-color: var(---color-primary-253-15);

* {
  transition: background-color 30ms linear;
}

.control {
  background-color: $background-weekday;
}

.container {
  width: 100%;
  display: grid;
  grid-template-rows: $title-height $days-height auto;
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
  color: var(---color-2-2-25);
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
  color: var(---color-3-25-1);
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
  grid-column: 1;
  grid-row: 1;
}
</style>
