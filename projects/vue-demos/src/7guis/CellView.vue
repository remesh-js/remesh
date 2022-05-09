<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { CellsDomain } from 'remesh-domains-for-demos/dist/7guis/Cells'

import { onClickOutside } from '@vueuse/core'
import { onUpdated, ref } from 'vue'

const props = defineProps<{
  cellKey: string
}>()

const cellsDomain = useRemeshDomain(CellsDomain())
const cell = useRemeshQuery(cellsDomain.query.CellQuery(props.cellKey))

const handleChange = (e: Event) => {
  cellsDomain.command.SetCellContentCommand({ key: props.cellKey, input: (e.target as HTMLInputElement).value })
}

const handleUnselect = () => {
  if (cell.value.isEditing) {
    cellsDomain.command.UnselectCellCommand(props.cellKey)
  }
}
onUpdated(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  })
})

const inputRef = ref<HTMLInputElement | null>(null)

onClickOutside(inputRef, handleUnselect)
</script>

<template>
  <input
    ref="inputRef"
    v-if="cell.isEditing"
    :style="{
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      boxSizing: 'border-box',
      textAlign: 'center',
    }"
    :value="cell.content"
    @input="handleChange"
    @blur="handleUnselect"
    autofocus
  />
  <template v-else>
    {{ cell.displayContent }}
  </template>
</template>
