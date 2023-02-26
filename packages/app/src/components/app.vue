<template>
  <div id="app">
    <p class="sans-serif flex">
      <!-- use the router-link component for navigation. -->
      <!-- specify the link by passing the `to` prop. -->
      <!-- `<router-link>` will render an `<a>` tag with the correct `href` attribute -->
      <router-link to="/">Home</router-link>
      <router-link to="/calendar">About</router-link>
    </p>
    <!-- route outlet -->
    <!-- component matched by the route will render here -->
    <router-view></router-view>
  </div>
</template>

<style scoped>
* {
  margin: 0;
}
</style>
