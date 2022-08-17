import * as React from 'react'

export type ExpandIconProps = React.ComponentPropsWithoutRef<'svg'>

export function ExpandIcon(props: ExpandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  )
}
