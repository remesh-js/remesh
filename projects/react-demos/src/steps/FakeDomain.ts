import { RemeshDomain } from 'remesh'
import { interval } from 'rxjs'
import { take, map } from 'rxjs/operators'

export const FakeDomain = RemeshDomain({
  name: 'FakeDomain',
  impl(domain) {
    const AState = domain.state<number[]>({
      name: 'AState',
      default: [],
    })

    const AQuery = domain.query({
      name: 'AQuery',
      impl({ get }) {
        return get(AState())
      },
    })

    const ACommand = domain.command({
      name: 'ACommand',
      impl({ get }, value: number) {
        return [AState().new(get(AQuery()).concat(value))]
      },
    })

    const BState = domain.state<number[]>({
      name: 'BState',
      default: [],
    })

    const BQuery = domain.query({
      name: 'BQuery',
      impl({ get }) {
        return get(BState())
      },
    })

    const SummaryQuery = domain.query({
      name: 'SummaryQuery',
      impl({ get }) {
        return get(BQuery()).reduce((res, cur) => (res += cur), 0)
      },
    })

    const BCommand = domain.command({
      name: 'BCommand',
      impl({ get }, value: number) {
        return [BState().new(get(BQuery()).concat(value))]
      },
    })

    domain.effect({
      name: 'FakeEffect',
      impl() {
        return interval(200).pipe(
          take(10),
          map((value) => [ACommand(value), BCommand(value * 1000)]),
        )
      },
    })

    return {
      query: { AQuery, BQuery, SummaryQuery },
    }
  },
})
