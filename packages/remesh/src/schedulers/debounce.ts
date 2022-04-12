import { debounceTime as debounceTimeOperator, tap } from 'rxjs/operators'

import { RemeshScheduler } from '../remesh'

export const debounce = <T = unknown>(...args: Parameters<typeof debounceTimeOperator>): RemeshScheduler<T> => {
  return (_, value$) => {
    return value$.pipe(debounceTimeOperator(...args))
  }
}
