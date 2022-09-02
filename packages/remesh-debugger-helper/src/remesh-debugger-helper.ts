export const formatTime = (time: Date) => {
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const milliseconds = time.getMilliseconds().toString().padStart(3, '0')

  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

export const formatNow = () => {
  const time = new Date()

  return formatTime(time)
}

export type RemeshDebugSource = 'state' | 'query' | 'domain' | 'event' | 'command'

export type RemeshDebugOptions = {
  include?: RemeshDebugSource[]
  exclude?: RemeshDebugSource[]
}

export const RemeshDebuggerHelper = (options?: RemeshDebugOptions) => {
  const config = {
    include: ['state', 'domain', 'query', 'event', 'command'],
    ...options,
  }

  const onActive = (source: RemeshDebugSource, fn: () => unknown) => {
    if (config.exclude?.includes(source)) {
      return
    }

    if (config.include) {
      if (config.include.includes(source)) {
        fn()
      }
    } else {
      fn()
    }
  }

  return {
    onActive,
  }
}
