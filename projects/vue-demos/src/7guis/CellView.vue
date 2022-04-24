<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { Cells } from 'remesh-domains-for-demos/dist/7guis/Cells'

import { onClickOutside } from '@vueuse/core'
import { onUpdated, ref } from 'vue'

const props = defineProps<{
  cellKey: string
}>()

const cells = useRemeshDomain(Cells())
const cell = useRemeshQuery(cells.query.cell(props.cellKey))

const handleChange = (e: Event) => {
  cells.command.setCellContent({ key: props.cellKey, input: (e.target as HTMLInputElement).value })
}

const handleUnselect = () => {
  if (cell.value.isEditing) {
    cells.command.unselectCell(props.cellKey)
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
