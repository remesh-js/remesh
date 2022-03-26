import {useCallback, useEffect, useRef, useState} from "react";

export function useInput(defaultValue: string) {
  const [value, setValue] = useState(defaultValue)

  const onChange = useCallback((event) => {
    setValue(event.target.value)
  }, [])

  return [value, onChange, setValue] as const
}

export function useOnEnter(callback: (event: Event) => void) {
  const cb = useRef(callback)

  useEffect(() => {
    cb.current = callback
  })

  return useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      cb.current(event)
    }
  }, [])
}
