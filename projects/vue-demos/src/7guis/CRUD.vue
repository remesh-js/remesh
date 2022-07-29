<script setup lang="ts">
import { ref } from 'vue'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-vue'

import { CRUDDomain } from 'remesh-domains-for-demos/dist/7guis/CRUD'

import { onClickOutside } from '@vueuse/core'

const send = useRemeshSend()
const domain = useRemeshDomain(CRUDDomain())
const filteredList = useRemeshQuery(domain.query.FilteredListQuery())
const filter = useRemeshQuery(domain.query.FilterPrefixQuery())
const created = useRemeshQuery(domain.query.CreatedQuery())
const selected = useRemeshQuery(domain.query.SelectedQuery())

const containerRef = ref<HTMLDivElement | null>(null)

const handleFilterChange = (e: Event) => {
  send(domain.command.UpdateFilterPrefixCommand((e.target as HTMLInputElement).value))
}

const handleSelect = (itemId: string | null) => {
  send(domain.command.SelectItemCommand(itemId))
}

const handleNameChange = (e: Event) => {
  if (selected.value) {
    send(
      domain.command.UpdateSelectedNameCommand({
        name: (e.target as HTMLInputElement).value,
      }),
    )
  } else {
    send(domain.command.UpdateCreatedCommand({ name: (e.target as HTMLInputElement).value }))
  }
}

const handleSurnameChange = (e: Event) => {
  if (selected.value) {
    send(
      domain.command.UpdateSelectedNameCommand({
        surname: (e.target as HTMLInputElement).value,
      }),
    )
  } else {
    send(domain.command.UpdateCreatedCommand({ surname: (e.target as HTMLInputElement).value }))
  }
}

const handleCreate = () => {
  if (selected.value === null) {
    send(domain.command.CreateNameItemCommand())
  }
}

const handleSync = () => {
  if (selected.value) {
    send(domain.command.SyncSelectedCommand())
  }
}

const handleDelete = () => {
  if (selected.value) {
    send([domain.command.DeleteItemCommand(selected.value.id), domain.command.SelectItemCommand(null)])
  }
}

onClickOutside(containerRef, () => {
  handleSelect(null)
})
</script>

<template>
  <div
    ref="containerRef"
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
        <div
          v-for="item of filteredList"
          :key="item.id"
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
        <button :disabled="selected !== null" :style="{ marginRight: '10px' }" @click="handleCreate">Create</button>
        <button :disabled="selected === null" :style="{ marginRight: '10px' }" @click="handleSync">Update</button>
        <button :disabled="selected === null" :style="{ marginRight: '10px' }" @click="handleDelete">Delete</button>
      </div>
    </div>
  </div>
</template>
