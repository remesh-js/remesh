<script setup lang="ts">
import { useRemeshDomain, useRemeshSend } from 'remesh-vue'
import { CellsDomain } from 'remesh-domains-for-demos/dist/7guis/Cells'
import CellView from './CellView.vue'

const props = defineProps<{
  rowKey: string
  columnKeyList: Array<string>
}>()

const send = useRemeshSend()
const cellsDomain = useRemeshDomain(CellsDomain())

const handleClick = (event: Event, cellKey: string) => {
  if (event.target instanceof HTMLInputElement) {
    return
  }
  send(cellsDomain.command.SelectCellCommand(cellKey))
}
</script>

<template>
  <td
    :style="{
      width: '30px',
      border: '1px solid #bbb',
      backgroundColor: '#f6f6f6',
    }"
  >
    {{ props.rowKey }}
  </td>

  <td
    v-for="columnKey of props.columnKeyList"
    :key="`${columnKey}${props.rowKey}`"
    :style="{
      maxWidth: '80px',
      minWidth: '80px',
      border: '1px solid #bbb',
      overflow: 'hidden',
    }"
    @click="handleClick($event, `${columnKey}${props.rowKey}`)"
  >
    <CellView :cellKey="`${columnKey}${props.rowKey}`" />
  </td>
</template>
