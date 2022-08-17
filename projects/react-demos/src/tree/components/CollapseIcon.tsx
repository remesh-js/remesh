import * as React from 'react'

export type CollapseIconProps = React.ComponentPropsWithoutRef<'svg'>

export function CollapseIcon(props: CollapseIconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  )
}
