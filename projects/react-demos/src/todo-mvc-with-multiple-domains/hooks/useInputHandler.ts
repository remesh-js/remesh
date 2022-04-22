import React, { useCallback, useState } from 'react'

export function useInputHandler(defaultValue: string) {
  const [value, setValue] = useState(defaultValue)

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }, [])

  return [value, onChange, setValue] as const
}
