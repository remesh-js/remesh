<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { Cells } from 'remesh-domains-for-demos/dist/7guis/Cells'

  const cells = useRemeshDomain(Cells())
  const columnKeyList = useRemeshQuery(cells.query.columnKeyList())
  const rowKeyList = useRemeshQuery(cells.query.rowKeyList())

  
</script>

<template>

</template>