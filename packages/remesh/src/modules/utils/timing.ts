import { OperatorFunction } from 'rxjs'
import { map, startWith, debounceTime, throttleTime } from 'rxjs/operators'

export type DebounceConfig = {
  type: 'debounce'
  dueTime: number
}

export type ThrottleConfig = {
  type: 'throttle'
  duration: number
  leading?: boolean
  trailing?: boolean
}

export type TimingConfig = DebounceConfig | ThrottleConfig

export const getTimingOperatorFunction = <T>(config?: TimingConfig): OperatorFunction<T, T> => {
  if (!config) {
    return map((x) => x)
  }

  if (config.type === 'debounce') {
    return debounceTime(config.dueTime)
  }

  if (config.type === 'throttle') {
    return throttleTime(config.duration, undefined, {
      leading: config.leading,
      trailing: config.trailing,
    })
  }
  throw new Error(`Unexpected timing: ${config}`)
}
