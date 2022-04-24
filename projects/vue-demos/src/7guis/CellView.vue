<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue';
import { Cells } from 'remesh-domains-for-demos/dist/7guis/Cells';

const props = defineProps<{
    cellKey: string
}>()
  const cells = useRemeshDomain(Cells())
  const cell = useRemeshQuery(cells.query.cell(props.cellKey))

  const handleChange = (e: Event) => {
    cells.command.setCellContent({ key: props.cellKey, input: (e.target as HTMLInputElement).value })
  }

  const handleBlur = () => {
      if (cell.value.isEditing) {
        cells.command.unselectCell(props.cellKey)
    }
  }

</script>

<template>
    <input v-if="cell.isEditing"
        :style="{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            boxSizing: 'border-box',
            textAlign: 'center',
        }"
        :value="cell.content"
        @input="handleChange"
        @blur="handleBlur"
        :autoFocus="true"
    />
    <template v-else>
        {{ cell.displayContent }}
    </template>
</template>