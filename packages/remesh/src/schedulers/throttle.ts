import { tap, throttleTime as throttleTimeOperator } from 'rxjs/operators'

import { RemeshScheduler } from '../remesh'

export const throttle = <T = unknown>(...args: Parameters<typeof throttleTimeOperator>): RemeshScheduler<T> => {
  return (_, value$) => {
    return value$.pipe(throttleTimeOperator(...args))
  }
}
