<script setup lang="ts">
import Counter from './Counter.vue'
import CircleDrawer from './CircleDrawer.vue'
import TemperatureConverter from './TemperatureConverter.vue'
import Timer from './Timer.vue'
import FlightBooker from './FlightBooker.vue'
import CRUD from './CRUD.vue'
import Cells from './Cells.vue'
</script>

<template>
  <h1>7GUIs in Vue/Remesh/TypeScript</h1>
  <p>This is a live version of an implementation (source) of 7GUIs with Vue, TypeScript and Remesh.</p>
  <hr />
  <Counter />
  <hr />
  <TemperatureConverter />
  <hr />
  <FlightBooker />
  <hr />
  <Timer />
  <hr />
  <CRUD />
  <hr />
  <CircleDrawer />
  <hr />
  <Cells />
  <hr />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
