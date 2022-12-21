<script setup lang="ts">
import { createInterpolator } from '@cepheus/core'
import { onMounted, ref, watch } from 'vue'
import { createPlugin } from '../drafts'
import slider from './slider.vue'
import model from '../models/model.json'
import { createEngine } from '../engine'

function setup() {
  // let br = document.getElementById('sliderBrightness')
  // br.min = '0'
  // br.max = '100'
  // br.defaultValue = '95'

  const calendar = document.getElementById('calendar') as HTMLElement
  calendar.innerHTML = ' '

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const d = new Date()
  const month = monthNames[d.getMonth()]

  const colNum = 5
  for (let i = 0; i < colNum; i++) {
    const col = document.createElement('div')
    col.className = 'calendarColumn'
    col.id = 'calendarColumn' + i

    const head = document.createElement('div')
    head.className = 'calendarColumnHeader'

    const today = new Date()
    const date = month + ' ' + (today.getDate() + i)

    head.innerHTML = date

    col.appendChild(head)

    const hours = 18
    for (let i = 0; i < hours; i++) {
      const half = document.createElement('div')
      const full = document.createElement('div')
      half.className = 'calendar30'
      full.className = 'calendar60'

      col.appendChild(half)
      col.appendChild(full)
    }

    calendar.appendChild(col)
  }
}

function createEvent(
  col: HTMLElement,
  dur: string,
  title: string,
  meta: string,
  cat: string,
  pos: number,
  width?: string,
  customClass?: string
) {
  if (!width) {
    width = 'eventSingle'
  }
  // pos is position related to half-hour increments. Ie, how many rows down.
  const en = document.createElement('div')
  const head = document.createElement('span')
  const t = document.createTextNode(title)
  head.className = 'eventTitle'
  head.appendChild(t)

  const detail = document.createElement('span')
  const d = document.createTextNode(meta)
  detail.className = 'eventMeta'
  detail.appendChild(d)

  if (customClass !== undefined) {
    en.classList.add('event', dur, cat, width, customClass)
  } else {
    en.classList.add('event', dur, cat, width)
  }

  en.appendChild(head)
  en.appendChild(detail)
  en.style.top = 56 + pos * 33 + 'px'

  col.appendChild(en)
}

// function createColors() {
// const br = document.getElementById('sliderBrightness')
// const con = document.getElementById('sliderContrast')
// const sat = document.getElementById('sliderSaturation')
// const mode = document.getElementById('darkMode')
// let brVal = Number(br.value)
// const conVal = Number(con.value)
// const satVal = Number(sat.value)
// if (mode.checked == true) {
//   br.min = '0'
//   br.max = '30'
//   if (brVal > 30) {
//     brVal = 15
//     br.value = 15
//   }
//
//   document.documentElement.style.setProperty(
//     '--shadow-color',
//     'rgba(0, 0, 0, 0.5)'
//   )
// } else {
//   br.min = '85'
//   br.max = '100'
//   if (brVal < 80) {
//     brVal = 95
//     br.value = 95
//   }
//
//   document.documentElement.style.setProperty(
//     '--shadow-color',
//     'rgba(0, 0, 0, 0.1)'
//   )
// }
//
// myTheme.lightness = brVal
// myTheme.contrast = conVal
// myTheme.saturation = satVal
//
// const colorPairs = myTheme.contrastColorPairs
//
// for (const [key, value] of Object.entries(colorPairs)) {
//   document.documentElement.style.setProperty(`--${key}`, value)
// }
// }
// createColors()

const lightness = ref()
const chroma = ref()
const darkMode = ref(false)

onMounted(() => {
  setup()
  const col0 = document.getElementById('calendarColumn0') as HTMLElement
  const col1 = document.getElementById('calendarColumn1') as HTMLElement
  const col2 = document.getElementById('calendarColumn2') as HTMLElement
  const col3 = document.getElementById('calendarColumn3') as HTMLElement
  const col4 = document.getElementById('calendarColumn4') as HTMLElement

  // Populate calendar with events
  // Col 0
  createEvent(col0, 'event30', 'Gym', '-', 'catPersonal', 1, 'eventDouble')
  createEvent(
    col0,
    'event90',
    'Office Hour',
    'UT-331',
    'catPrimary',
    1,
    'eventDouble'
  )
  createEvent(col0, 'event60', 'Research Planning', 'UT-105', 'catDefault', 6)
  createEvent(col0, 'event90', 'Office Hour', 'UT-201', 'catPrimary', 10)
  createEvent(col0, 'event60', 'Project Sync', 'UT-220', 'catBlue', 16)
  // Col 1
  createEvent(col1, 'event30', 'Gym', '-', 'catPersonal', 1)
  createEvent(col1, 'event120', 'Employee Meeting', 'UT-203', 'catImportant', 4)
  createEvent(
    col1,
    'event90',
    'Leonardo integration',
    'https://leonardocolor.io',
    'catBlue',
    12,
    'eventSingle',
    'is-selected'
  )

  // Col 2
  createEvent(col2, 'event30', 'Gym', '-', 'catPersonal', 1)
  createEvent(col2, 'event60', 'Workshop', 'UT-440', 'catBlue', 4)
  createEvent(
    col2,
    'event90',
    'Office Hour',
    'UT-201',
    'catPrimary',
    10,
    'eventDouble'
  )
  createEvent(
    col2,
    'event30',
    'Color sync',
    'UT-220',
    'catDefault',
    10,
    'eventDouble'
  )
  createEvent(col2, 'event30', 'Submission Deadline', '-', 'catUrgent', 18)

  // Col 3
  createEvent(col3, 'event30', 'Gym', '-', 'catPersonal', 1)
  createEvent(col3, 'event60', 'User Interview', 'UT-203', 'catDefault', 4)
  createEvent(col3, 'event60', 'User Interview', 'UT-203', 'catDefault', 7)
  createEvent(col3, 'event60', 'User Interview', 'UT-203', 'catDefault', 12)
  createEvent(
    col3,
    'event120',
    'Sprint Demo',
    'UT-440',
    'catImportant',
    16,
    'eventDouble'
  )
  createEvent(
    col3,
    'event60',
    'Color palette review',
    'UT-330',
    'catBlue',
    19,
    'eventDouble'
  )

  // Col 4
  createEvent(col4, 'event30', 'Gym', '-', 'catPersonal', 1)
  createEvent(col4, 'event60', 'Workshop', 'UT-440', 'catBlue', 4)
  createEvent(col4, 'event120', 'Backlog', 'UT-112', 'catPrimary', 8)

  const interpolator = createInterpolator(model)
  createEngine([createPlugin(interpolator)])

  watch([chroma.value.range()], ([value]) => {
    interpolator.updateChroma(value)
  })

  watch([lightness.value.range()], ([value]) => {
    interpolator.updateLightness(value)
  })

  watch([darkMode], ([value]) => {
    interpolator.updateDarkMode(value)
  })
})
</script>

<template>
  <div>
    <div class="cont">
      <div class="flex mb10 justify-center flex-row">
        <slider ref="lightness"></slider>
        <div class="m5"></div>
        <slider ref="chroma"></slider>
        <div class="m5"></div>
        <!-- <div class="form-item"> -->
        <div class="form-control">
          <input
            id="darkMode"
            v-model="darkMode"
            name="darkMode"
            type="checkbox"
          />
          <label for="darkMode" style="color: var(---color-0-100-0-0)"
            >Dark Mode</label
          >
        </div>
        <!-- </div> -->
      </div>
      <!-- <header> -->
      <!--   <h2>Leonardo Demo App</h2> -->
      <!--   <div id="controls"> -->
      <!--     <div class="form-Item"> -->
      <!--       <label for="sliderBrightness">Brightness</label> -->
      <!--       <input id="sliderBrightness" name="sliderBrightness" type="range" step="1"></input> -->
      <!--     </div> -->
      <!--     <div class="form-Item"> -->
      <!--       <label for="sliderContrast">Contrast</label> -->
      <!--       <input id="sliderContrast" name="sliderContrast" type="range" min="1" max="5" step="0.05" value="1"></input> -->
      <!--     </div> -->
      <!--     <div class="form-Item"> -->
      <!--       <label for="sliderSaturation">Saturation</label> -->
      <!--       <input id="sliderSaturation" name="sliderSaturation" type="range" min="0" max="100" step="1" value="100"></input> -->
      <!--     </div> -->
      <!--     <div class="form-Item"> -->
      <!--       <input id="darkMode" name="darkMode" type="checkbox"/><label for="darkMode">Dark Mode</label> -->
      <!--     </div> -->
      <!--   </div> -->
      <!-- </header> -->
      <main id="demoApp">
        <div id="master">
          <div class="calendarTimeColumn">
            <span class="calendarTime"> 7am </span>
            <span class="calendarTime"> 8am </span>
            <span class="calendarTime"> 9am </span>
            <span class="calendarTime"> 10am </span>
            <span class="calendarTime"> 11am </span>
            <span class="calendarTime"> 12pm </span>
            <span class="calendarTime"> 1pm </span>
            <span class="calendarTime"> 2pm </span>
            <span class="calendarTime"> 3pm </span>
            <span class="calendarTime"> 4pm </span>
            <span class="calendarTime"> 5pm </span>
            <span class="calendarTime"> 6pm </span>
            <span class="calendarTime"> 7pm </span>
            <span class="calendarTime"> 8pm </span>
            <span class="calendarTime"> 9pm </span>
            <span class="calendarTime"> 10pm </span>
            <span class="calendarTime"> 11pm </span>
          </div>
          <div class="calendarWrapper">
            <div id="calendar"></div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/*
// Blues:
// http://localhost:8080/?color=2a77a7&base=ffffff&tint=71b4ca&shade=331f4f&ratios=1.3%2C3%2C4.5&mode=CAM02
// Reds:
// http://localhost:8080/?color=cb1404&base=ffffff&tint=ffbbb9&shade=b10000&ratios=1.3%2C3.5%2C5&mode=LAB
// Grays:
// http://localhost:8080/?color=707080&base=fafafb&tint=cacad0&shade=333351&ratios=1%2C1.25%2C1.94%2C3%2C3.99%2C5.22%2C6.96%2C9.3%2C12.45%2C15&mode=LAB
 */
@import url('https://fonts.googleapis.com/css?family=Nunito:300,400,600,700,800&display=swap');
:root {
  --background: var(---color-3-0-0-30);
  --largeText: var(---color-0-10-1-100);
  --smallText: var(---color-0-10-1-9);
  /* --borderColor: var(--gray200); */
  /* --shadowColor: var(--gray1100); */
  --hour-height: 64px;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

@media screen and (min-width: 320px) {
  :root {
    --calendarHeaderPadding: 0 188px 16px 0;
  }
}
@media screen and (min-width: 860px) {
  :root {
    --calendarHeaderPadding: 0 288px 16px 0;
  }
}

* {
  transition: background-color 200ms linear;
}

.cont {
  font-size: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--background);
  color: var(--smallText);
  display: flex;
  flex-direction: column;
  /* height: 100vh; */
  /* overflow: hidden; */
  font-family: 'Nunito', sans-serif;
}

/* Demo App Styles */
#demoApp {
  display: grid;
  grid-template-columns: auto;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  grid-template-areas: 'master';
  /* overflow: hidden; */
  /* height: calc(100vh - 48px); */
}

#master {
  grid-area: master;
  display: flex;
  flex-direction: row;
  height: 100vh;
  max-width: calc(100vw - var(--detail-width));
  background-color: var(--background);
  padding: 16px 0 16px 16px;
}

/* Calendar classes */
.calendarTimeColumn {
  padding-top: 114px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
  font-size: 12px;
}

.calendarTime {
  display: flex;
  height: calc(var(--hour-height) + 2px);
  align-items: center;
}

#calendar {
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
  border: 1px solid var(---color-0-3-1-4);
  border-right: 0;
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
}

.calendarColumn {
  display: flex;
  width: calc(100vw / 5 - 40px);
  position: relative;
  flex-direction: column;
  background-color: var(---color-3-0-0-30);
  border: 0;
  border-right: 1px solid var(---color-0-5-0-20);
  border-collapse: collapse;
}

.calendarColumnHeader {
  padding: 16px;
  background-color: var(---color-0-2-1-25);
  border-bottom: 1px solid var(---color-0-5-1-30);
  color: var(---color-0-30-1-1);
  font-weight: lighter;
  font-size: 18px;
}

/* Make first column appear selected */
#calendarColumn0 .calendarColumnHeader {
  border-top: 4px solid var(---color-0-4-40-20);
  padding: 12px 16px 16px 16px;
  color: var(---color-0-40-20-0);
}

.calendar30,
.calendar60 {
  display: flex;
  min-height: calc(var(--hour-height) / 2);
  align-items: center;
}

.calendar30 {
  border-bottom: 1px dashed var(---color-0-5-1-30);
}

.calendar60 {
  border-bottom: 1px solid var(---color-0-5-1-30);
}

.event {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  border-width: 1px;
  border-left-width: 6px;
  left: 6px;
  border-size: 1px;
  border-style: solid;
  overflow: hidden;
}

.eventSingle {
  width: calc(100% - 20px);
}
.eventDouble {
  width: calc((100% - 30px) / 2);
}
.eventTriple {
  width: calc((100% - 28px) / 3);
}
.eventDouble ~ .eventDouble {
  left: calc(50% + 2px);
}
.event30 {
  height: calc(var(--hour-height) / 2);
}
.event30 .eventMeta {
  display: none;
}
.event60 {
  height: var(--hour-height);
}
.event90 {
  height: calc(var(--hour-height) / 2 + var(--hour-height) + 2px);
}
.event120 {
  height: calc(var(--hour-height) * 2 + 2px);
}
/* Categories */
.catDefault {
  background-color: var(---color-0-1-1-9);
  border-color: var(---color-0-9-1-9);
}

.catDefault .eventTitle {
  color: var(---color-0-35-1-9);
}

.catDefault .eventMeta {
  color: var(---color-0-35-1-9);
}

.catPrimary {
  background-color: var(---color-0-2-10-5);
  border-color: var(---color-0-15-10-5);
}

.catPrimary .eventTitle {
  color: var(---color-0-35-10-5);
}

.catPrimary .eventMeta {
  color: var(---color-0-35-10-10);
}

.catPersonal {
  background-color: var(---color-3-0-15-15);
  border-color: var(---color-3-25-15-15);
}

.catPersonal .eventTitle {
  color: var(---color-3-65-15-15);
}

.catPersonal .eventMeta {
  color: var(---color-3-75-15-35);
}

.catImportant {
  background-color: var(---color-2-1-100-30);
  border-color: var(---color-2-15-10-5);
}

.catImportant .eventTitle {
  color: var(---color-2-65-10-5);
}

.catImportant .eventMeta {
  color: var(---color-2-65-10-15);
}

.catBlue {
  background-color: var(---color-0-1-25-50);
  border-color: var(---color-0-15-100-50);
}

.catBlue .eventTitle {
  color: var(---color-0-220-100-50);
}

.catBlue .eventMeta {
  color: var(---color-0-220-100-75);
}

.catBlue.is-selected {
  background-color: var(---color-0-200-245-10);
  border-color: var(---color-0-300-120-50);
}

.catBlue.is-selected .eventTitle {
  color: var(---color-0-0-0-500);
}

.catBlue.is-selected .eventMeta {
  color: var(---color-0-0-30-400);
}

.catUrgent {
  background-color: var(---color-1-0-50-15);
  border-color: var(---color-1-50-50-15);
}

.catUrgent .eventTitle {
  color: var(---color-1-170-50-15);
}

.catUrgent .eventMeta {
  color: var(---color-1-170-50-35);
}

.eventTitle,
.eventMeta {
  padding: 0 10px;
}

.eventTitle {
  font-size: 14px;
  font-weight: bold;
  padding-top: 8px;
}

.eventMeta {
  font-size: 12px;
}

p {
  line-height: 1.5;
}

.form-control {
  padding-top: 1rem;
  justify-content: center;
  align-items: center;
  font-family: system-ui, sans-serif;
  /* font-size: 2rem; */
  /* font-weight: bold; */
  line-height: 1.1;
  display: grid;
  grid-template-columns: 1em 2em;
  gap: 0.5em;
  width: 5rem;
}

input[type='checkbox'] {
  background-color: initial;
  cursor: default;
  appearance: auto;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: initial;
}
</style>
