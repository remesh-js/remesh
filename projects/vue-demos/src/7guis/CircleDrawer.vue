<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { CircleDrawer, positionInCircle, Position } from 'remesh-domains-for-demos/dist/7guis/CircleDrawer'
import { useClickOutsideRef } from '../composition-api/useClickOutsideRef'

const domain = useRemeshDomain(CircleDrawer())
const drawState = useRemeshQuery(domain.query.drawState())
const tooltipsState = useRemeshQuery(domain.query.tooltipsState())
const selectedCircleInfo = useRemeshQuery(domain.query.selectedCircleInfo())
const canUndo = useRemeshQuery(domain.query.canUndo())
const canRedo = useRemeshQuery(domain.query.canRedo())


const getCircleInfo = (position: Position) => {
  const circle = drawState.value.circles.find((circle) => {
    return positionInCircle(position, circle)
  })

  if (!circle) {
    return null
  }

  const index = drawState.value.circles.indexOf(circle)

  return {
    index,
    circle,
  }
}

const handleRightClick = (e: MouseEvent) => {
  e.preventDefault()
  const position = { x: e.pageX, y: e.pageY }

  const circleInfo = getCircleInfo(position)

  if (circleInfo) {
    domain.command.setSelectedIndex(circleInfo.index)
    domain.command.updateTooltips({
      type: 'show-tips',
      index: circleInfo.index,
      circle: circleInfo.circle,
      pageX: e.pageX,
      pageY: e.pageY,
    })
  }
}

const handleLeftClick = (e: MouseEvent) => {
  if (tooltipsState.value.type !== 'default') {
    return
  }

  const position = { x: e.pageX, y: e.pageY }
  const circleInfo = getCircleInfo(position)

  if (!circleInfo) {
    domain.command.draw({ position, diameter: 30 })
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (tooltipsState.value.type !== 'default') {
    return
  }

  const position = { x: e.pageX, y: e.pageY }
  const circleInfo = getCircleInfo(position)

  if (circleInfo) {
    domain.command.setSelectedIndex(circleInfo.index)
  } else {
    domain.command.setSelectedIndex(-1)
  }
}

const handleOpenSlider = () => {
  if (tooltipsState.value.type === 'show-tips') {
    domain.command.updateTooltips({
      type: 'open-slider',
      index: tooltipsState.value.index,
      circle: tooltipsState.value.circle,
      pageX: tooltipsState.value.pageX,
      pageY: tooltipsState.value.pageY,
    })
  }
}

const handleCloseSlider = () => {
  domain.command.updateTooltips({
    type: 'default',
  })
}

const handleAdust = (event: Event) => {
  if (!event.target) {
    return
  }
  const value = parseInt((event.target as any).value, 10)

  if (selectedCircleInfo.value && !isNaN(value)) {
    domain.command.adjust({
      index: selectedCircleInfo.value.index,
      diameter: value,
    })
  }
}


const showTipsElemRef = useClickOutsideRef(() => {
  handleCloseSlider()
})

const openSlideElemRef = useClickOutsideRef(() => {
  handleCloseSlider()
})

</script>

<template>
  <div :style="{
    border: '1px solid #eaeaea',
    boxSizing: 'border-box',
    padding: 10,
  }">
    <h2>Circle Drawer</h2>
    <div :style="{
      width: '400px',
      textAlign: 'center',
      padding: 10,
    }">
      <button @click="domain.command.undo()" :style="{
        margin: '0 10px',
      }" :disabled="!canUndo">
        Undo
      </button>
      <button @click="domain.command.redo()" :style="{
        margin: '0 10px',
      }" :disabled="!canRedo">
        Redo
      </button>
    </div>
    <div :style="{
      width: '400px',
      height: '400px',
      border: '1px solid #eaeaea',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }" @click="handleLeftClick" @mousemove="handleMouseMove">
      <div v-for="(circle, index) in drawState.circles"
        :key="circle.position.x + '-' + circle.position.y + '-' + circle.diameter" :style="{
          position: 'absolute',
          left: circle.position.x - circle.diameter / 2 + 'px',
          top: circle.position.y - circle.diameter / 2 + 'px',
          width: circle.diameter + 'px',
          height: circle.diameter + 'px',
          borderRadius: circle.diameter / 2 + 'px',
          border: '1px solid #666',
          backgroundColor: selectedCircleInfo?.index === index ? '#eaeaea' : '',
        }" @contextmenu="handleRightClick">
      </div>

      <div v-if="tooltipsState.type === 'show-tips'" :key="'show-tips'" :style="{
        position: 'absolute',
        left: tooltipsState.pageX + 'px',
        top: tooltipsState.pageY + 'px',
        zIndex: 100,
        background: '#fff',
        border: '1px solid #666',
        padding: 10 + 'px',
      }" ref="showTipsElemRef" @click="handleOpenSlider">
        Adjust Diameter
      </div>

      <div v-if="tooltipsState.type === 'open-slider'" :key="'open-slider'" :style="{
        position: 'absolute',
        left: tooltipsState.pageX + 'px',
        top: tooltipsState.pageY + 'px',
        background: '#fff',
        border: '1px solid #666',
        zIndex: 100,
        padding: 10 + 'px',
      }" ref="openSlideElemRef">
        <p>Adjust Diameter</p>
        <div>
          <input type="range" :value="selectedCircleInfo?.circle.diameter ?? ''" min="1" max="150"
            @input="handleAdust" />
        </div>
      </div>
    </div>
  </div>
</template>