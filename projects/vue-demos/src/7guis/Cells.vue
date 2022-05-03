<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { Cells } from 'remesh-domains-for-demos/dist/7guis/Cells'
import RowView from './RowView.vue'

const cells = useRemeshDomain(Cells())
const columnKeyList = useRemeshQuery(cells.query.columnKeyList())
const rowKeyList = useRemeshQuery(cells.query.rowKeyList())
</script>

<template>
  <div>
    <h2>Cells</h2>
    <table
      :style="{
        borderCollapse: 'collapse',
        border: '1px solid #bbb',
        textAlign: 'center',
      }"
    >
      <thead>
        <tr
          :style="{
            backgroundColor: '#f6f6f6',
          }"
        >
          <th :style="{ width: '30px', display: 'block' }"></th>
          <th
            v-for="key of columnKeyList"
            :key="key"
            :style="{
              maxWidth: '80px',
              border: '1px solid #bbb',
            }"
          >
            {{ key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rowKey of rowKeyList" :key="rowKey">
          <RowView :rowKey="rowKey" :columnKeyList="columnKeyList" />
        </tr>
      </tbody>
    </table>
  </div>
</template>
