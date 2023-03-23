<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
</script>

<template>
  <div>
    <Suspense>
      <div>
        <div class="top-8 w-10 text-right ml1 mb5">
          <Menu as="div" class="relative inline-block text-left">
            <MenuButton
              as="div"
              class="w-12 menu-button inline-flex justify-center rounded-md px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
            >
              More</MenuButton
            >
            <MenuItems
              class="menu-items absolute left-0 mt-2 w-56 origin-top-right divide-y rounded-md shadow-lg focus:outline-none"
            >
              <div class="menu-wrapper px-1 py-1 relative">
                <MenuItem v-slot="{ active }">
                  <router-link
                    to="/"
                    :class="[
                      active ? 'menu-link menu-link-active' : 'menu-link',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                    >Calendar</router-link
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    :class="[
                      active ? 'menu-link menu-link-active' : 'menu-link',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                    to="/constraint"
                    >Constraint</router-link
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    :class="[
                      active ? 'menu-link menu-link-active' : 'menu-link',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                    to="/swatches"
                    >Swatches</router-link
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    :class="[
                      active ? 'menu-link menu-link-active' : 'menu-link',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                    to="/triangle"
                    >Triangle</router-link
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    :class="[
                      active ? 'menu-link menu-link-active' : 'menu-link',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                    to="/fitting"
                    >Fitting</router-link
                  >
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
        <!-- route outlet -->
        <!-- component matched by the route will render here -->
        <router-view></router-view>
      </div>

      <!-- loading state via #fallback slot -->
      <template #fallback> Loading... </template>
    </Suspense>
  </div>
</template>

<style>
body {
  background-color: var(---color-1-20-1020);
  font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
}

.menu-button {
  color: var(---color-1-20-1000);
  background-color: var(---color-2-20-20);
  border: var(---color-2-20-50);
  border-radius: 5px;
  border-style: solid;
}

.menu-items {
  border: black;
  border-color: black;
  border-style: solid;
  background-color: var(---color-1-20-1000);
  color: var(---color-2-20-20);
}

.menu-items a {
  color: var(---color-2-20-20);
  border-color: black;
  text-decoration: none;
}

.menu-wrapper {
  z-index: 1;
  background-color: var(---color-1-20-1000);
  color: var(---color-2-20-20);
}

/* * { */
/*   margin: 0; */
/* } */
</style>
