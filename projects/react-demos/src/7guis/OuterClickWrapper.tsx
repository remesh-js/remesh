import { ComponentPropsWithoutRef, useEffect, useRef } from 'react'

export const OuterClickWrapper = (props: OuterClickWrapperProps) => {
  const { onOuterClick, ...restProps } = props
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target as Node)?.parentElement) {
        return
      }

      const isOuterClick = !!(containerRef.current && !containerRef.current.contains(event.target as Node))

      if (isOuterClick) {
        onOuterClick?.(event)
      }
    }

    document.addEventListener('click', handleClick, false)
    return () => {
      document.removeEventListener('click', handleClick, false)
    }
  }, [])

  return <div ref={containerRef} {...restProps}></div>
}
type OuterClickWrapperProps = ComponentPropsWithoutRef<'div'> & {
  onOuterClick?: (event: MouseEvent) => void
}
