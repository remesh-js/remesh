import React from 'react'

export function useKeyPressHandler(
  keys: string | string[],
  callback: (event: React.KeyboardEvent<HTMLInputElement>, key: string) => void,
) {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const keyList = Array.isArray(keys) ? keys : [keys]
    for (const key of keyList) {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault()
        callback(event, key)
      }
    }
  }

  return handleKeyPress
}
