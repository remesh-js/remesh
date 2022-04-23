<script setup lang="ts">
import { ref } from 'vue';
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'

import { CRUD } from 'remesh-domains-for-demos/dist/7guis/CRUD'

import { onClickOutside } from '@vueuse/core'

const domain = useRemeshDomain(CRUD())
const filteredList = useRemeshQuery(domain.query.filteredList())
const filter = useRemeshQuery(domain.query.filterPrefix())
const created = useRemeshQuery(domain.query.created())
const selected = useRemeshQuery(domain.query.selected())

const containerRef = ref<HTMLDivElement>(null!)

const handleFilterChange = (e: Event) => {
  domain.command.updateFilterPrefix((e.target as HTMLInputElement).value)
}

const handleSelect = (itemId: string | null) => {
  domain.command.selectItem(itemId)
}

const handleNameChange = (e: Event) => {
if (selected) {
    domain.command.updateSelectedName({
    name: (e.target as HTMLInputElement).value,
    })
} else {
    domain.command.updateCreated({ name: (e.target as HTMLInputElement).value })
}
}

const handleSurnameChange = (e: Event) => {
if (selected) {
    domain.command.updateSelectedName({
    surname: (e.target as HTMLInputElement).value,
    })
} else {
    domain.command.updateCreated({ surname: (e.target as HTMLInputElement).value })
}
}

const handleCreate = () => {
if (selected === null) {
    domain.command.createNameItem()
}
}

const handleSync = () => {
if (selected) {
    domain.command.syncSelected()
}
}

const handleDelete = () => {
if (selected.value) {
    domain.command.deleteItem(selected.value.id)
    domain.command.selectItem(null)
  }
}
onClickOutside(containerRef, () => {
        handleSelect(null)
})

</script>

<template>
    <div ref="containerRef"
      :style="{
        width: '400px',
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: '10px',
      }"
    >
      <h2>CRUD</h2>
      <div>
        <label for="">Filter prefix</label>
        <input type="text" :value="filter" @input="handleFilterChange" />
      </div>
      <div
        :style="{
          display: 'flex',
        }"
      >
        <div
          :style="{
            width: '50%',
            height: '100px',
            border: '1px solid #eaeaea',
            overflow: 'scroll',
          }"
        >
        <div v-for="item of filteredList" :key="item.id"
            :style="{
                  background: selected?.id === item.id ? 'blue' : '',
                  color: selected?.id === item.id ? 'white' : '',
                }"
            @click="handleSelect(item.id)"
        >
            {{ item.name + ', ' + item.surname }}
        </div>
        </div>
        <div :style="{ width: '50%', padding: '10px' }">
          <div>
            <label>Name:</label>
            <input type="text" :value="selected ? selected.name : created.name" @input="handleNameChange" />
          </div>
          <div>
            <label>Surname:</label>
            <input type="text" :value="selected ? selected.surname : created.surname" @input="handleSurnameChange" />
          </div>
        </div>

        <div>
          <button :disabled="selected !== null" :style="{ marginRight: '10px' }" 
                  @click="handleCreate" 
          >
            Create
          </button>
          <button :disabled="selected === null" :style="{ marginRight: '10px' }" 
                  @click="handleSync"
          >
            Update
          </button>
          <button :disabled="selected === null" :style="{ marginRight: '10px' }"
                  @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
</template>