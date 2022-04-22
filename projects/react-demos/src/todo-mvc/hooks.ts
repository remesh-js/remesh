import React, { useCallback, useEffect, useRef, useState } from 'react'

export function useInputHandler(defaultValue: string) {
  const [value, setValue] = useState(defaultValue)

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }, [])

  return [value, onChange, setValue] as const
}

export function useKeyPressHandler(key: string, callback: (event: React.KeyboardEvent<HTMLInputElement>) => void) {
  const callbackRef = useRef(callback)

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key.toLocaleLowerCase() === key.toLocaleLowerCase()) {
        event.preventDefault()
        callbackRef.current(event)
      }
    },
    [key],
  )

  useEffect(() => {
    callbackRef.current = callback
  })

  return handleKeyPress
}
