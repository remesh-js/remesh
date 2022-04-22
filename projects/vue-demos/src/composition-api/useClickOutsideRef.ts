import { ref, onMounted, onBeforeUnmount } from 'vue'

export const useClickOutsideRef = <T extends Element>(onOuterClick?: (event: MouseEvent) => unknown) => {
  const elemRef = ref<T | null>(null)

  const handleClick = (event: MouseEvent) => {
    if (!elemRef.value) {
      return
    }
    if (!event.target) {
      return
    }

    if (!(event.target as Node).parentElement) {
      return
    }

    const isOuterClick = !elemRef.value.contains(event.target as Node)

    if (isOuterClick) {
      onOuterClick?.(event)
    }

  }

  onMounted(() => {
    document.addEventListener('click', handleClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClick)
  })
  

  return elemRef
}