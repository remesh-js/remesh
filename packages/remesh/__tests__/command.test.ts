import {
  RemeshCommand,
  RemeshCommandOutput,
  RemeshDomain,
  RemeshEvent,
  RemeshQuery,
  RemeshState,
  RemeshStore,
} from '../src'
import { of, switchMap } from 'rxjs'
import { map } from 'rxjs/operators'
import * as utils from './utils'

let store: RemeshStore

beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('command', () => {
  const NameState = RemeshState({
    name: 'NameState',
    default: 'remesh',
  })

  const NameQuery = RemeshQuery({
    name: 'NameQuery',
    impl: ({ get }) => {
      return get(NameState())
    },
  })

  const NameChangeEvent = RemeshEvent({
    name: 'NameChangeEvent',
  })

  const AgeState = RemeshState({
    name: 'AgeState',
    default: 0,
  })

  const AgeQuery = RemeshQuery({
    name: 'AgeQuery',
    impl: ({ get }) => {
      return get(AgeState())
    },
  })

  it('use RemeshCommand + store.send to drive update state', () => {
    expect(store.query(NameQuery())).toBe('remesh')

    const ChangeNameCommand = RemeshCommand({
      name: 'ChangeNameCommand',
      impl({}) {
        return NameState().new('ddd')
      },
    })

    store.send(ChangeNameCommand())

    expect(store.query(NameQuery())).toBe('ddd')
  })

  it('get state with RemeshCommandContext.get, and can receive data with the second arg', () => {
    const ChangeNameCommand = RemeshCommand({
      name: 'ChangeNameCommand',
      impl({ get }, hi: string) {
        return NameState().new(`${hi},${get(NameState())}`)
      },
    })

    store.send(ChangeNameCommand('hello'))

    expect(store.query(NameQuery())).toBe('hello,remesh')
  })

  it('can set state, send command and emit event in any times', () => {
    const UpdateAgeCommand = RemeshCommand({
      name: 'UpdateAgeCommand',
      impl({}, age: number) {
        return AgeState().new(age)
      },
    })

    const ChangeNameCommand = RemeshCommand({
      name: 'ChangeNameCommand',
      impl({}) {
        return [NameState().new('ddd'), NameChangeEvent(), UpdateAgeCommand(1)]
      },
    })

    const changed = jest.fn()
    store.subscribeEvent(NameChangeEvent, changed)

    store.send(ChangeNameCommand())

    expect(changed).toHaveBeenCalled()
    expect(store.query(NameQuery())).toBe('ddd')
    expect(store.query(AgeQuery())).toBe(1)
  })

  it('ignite', () => {
    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const RankingState = domain.state({
          name: 'RankingState',
          default: 0,
        })

        const RankingQuery = domain.query({
          name: 'RankingQuery',
          impl: ({ get }) => {
            return get(RankingState())
          },
        })

        const RankingUpdateCommand = domain.command({
          name: 'RankingUpdateCommand',
          impl({}, ranking: number) {
            return RankingState().new(ranking)
          },
        })

        domain.effect({
          name: 'RankingUpdateEffect',
          impl: () => {
            return of(RankingUpdateCommand(99))
          },
        })

        return { query: { RankingQuery } }
      },
    })

    const testDomain = store.getDomain(TestDomain())

    store.igniteDomain(TestDomain())

    expect(store.query(testDomain.query.RankingQuery())).toBe(99)
  })
})

describe('effect', () => {
  it('basic', async () => {
    const getFeatures = () => utils.delay(1000).then(() => Promise.resolve(['ddd', 'cqrs', 'event-driven']))

    const FeaturesDomain = RemeshDomain({
      name: 'FeaturesDomain',
      impl(domain) {
        const FeaturesState = domain.state({
          name: 'FeaturesState',
          default: [] as string[],
        })

        const FeaturesQuery = domain.query({
          name: 'FeaturesQuery',
          impl: ({ get }) => {
            return get(FeaturesState())
          },
        })

        const FeaturesUpdateCommand = domain.command({
          name: 'FeaturesUpdateCommand',
          impl({}, features: string[]) {
            return FeaturesState().new(features)
          },
        })

        const FetchFeaturesEvent = domain.event({
          name: 'FetchFeaturesEvent',
        })

        domain.effect({
          name: 'FetchFeaturesEffect',
          impl: ({ fromEvent }) => {
            return fromEvent(FetchFeaturesEvent).pipe(
              switchMap(() => getFeatures()),
              map(FeaturesUpdateCommand),
            )
          },
        })

        return { query: { FeaturesQuery }, event: { FetchFeaturesEvent } }
      },
    })

    const featuresDomain = store.getDomain(FeaturesDomain())
    store.igniteDomain(FeaturesDomain())
    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeQuery(featuresDomain.query.FeaturesQuery(), changed)
    store.send(featuresDomain.event.FetchFeaturesEvent())
    jest.runOnlyPendingTimers()

    jest.useRealTimers()
    await utils.delay(1)
    expect(changed).toHaveBeenCalledWith(['ddd', 'cqrs', 'event-driven'])
  })

  it('fromQuery/fromEvent/fromCommand', async () => {
    const CountDomain = RemeshDomain({
      name: 'CountDomain',
      impl(domain) {
        const CountState = domain.state({
          name: 'CountState',
          default: 0,
        })

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl: ({ get }) => {
            return get(CountState())
          },
        })

        const UpdateCountCommand = domain.command({
          name: 'UpdateCountCommand',
          impl({}, count: number) {
            return CountState().new(count)
          },
        })

        const CountChangedEvent = domain.event<number>({
          name: 'CountChangedEvent',
        })

        const CountIncreaseEvent = domain.event({
          name: 'CountIncreaseEvent',
        })

        domain.effect({
          name: 'FromEventToUpdateEffect',
          impl({ fromEvent, get }) {
            return fromEvent(CountIncreaseEvent).pipe(
              map(() => get(CountState()) + 1),
              map(UpdateCountCommand),
            )
          },
        })

        domain.effect({
          name: 'FromQueryToEventEffect',
          impl({ fromQuery }) {
            return fromQuery(CountQuery()).pipe(
              map((value) => {
                return CountChangedEvent(value)
              }),
            )
          },
        })

        domain.effect({
          name: 'FromCommandToEventEffect',
          impl({ fromCommand }) {
            return fromCommand(UpdateCountCommand).pipe(
              map((value) => {
                return CountChangedEvent(value)
              }),
            )
          },
        })

        return { query: { CountQuery }, event: { CountChangedEvent, CountIncreaseEvent } }
      },
    })

    const countDomain = store.getDomain(CountDomain())
    const changed = jest.fn()

    store.igniteDomain(CountDomain())
    store.subscribeEvent(countDomain.event.CountChangedEvent, changed)
    store.send(countDomain.event.CountIncreaseEvent())

    await utils.delay(1)

    expect(changed).toHaveBeenCalledTimes(2)
    expect(store.query(countDomain.query.CountQuery())).toBe(1)
  })

  it('supports commandQuery', () => {
    type Account = {
      id: number
      status: 'active' | 'inactive'
      balance: number
    }

    const AccountDomain = RemeshDomain({
      name: 'AccountDomain',
      impl(domain, accountId: number) {
        const AccountEntity = domain.entity<Account>({
          name: 'AccountEntity',
          key: (account) => `${account.id}`,
        })

        const UpdateAccountCommand = domain.command({
          name: 'UpdateAccountCommand',
          impl({}, account: Account) {
            return AccountEntity(account.id).new(account)
          },
        })

        domain.effect({
          name: 'AccountEntityEffect',
          impl({}) {
            return [UpdateAccountCommand({ id: accountId, status: 'inactive', balance: 0 }), ActivateAccountCommand()]
          },
        })

        const AccountQuery = domain.query({
          name: 'AccountQuery',
          impl: ({ get }) => {
            return get(AccountEntity(accountId))
          },
        })

        const DebtQuery = domain.query({
          name: 'DebtQuery',
          impl: ({ get }) => {
            const account = get(AccountQuery())
            return account.balance < 0
          },
        })

        const CloseAccountCommand = domain.command({
          name: 'CloseAccountCommand',
          impl: ({ get }) => {
            const account = get(AccountQuery())
            const newAccountState: Account = {
              ...account,
              status: 'inactive',
            }

            return AccountEntity(accountId).new(newAccountState)
          },
        })

        const ActivateAccountCommand = domain.command({
          name: 'ActivateAccountCommand',
          impl: ({ get }) => {
            const account = get(AccountQuery())
            const newAccountState = {
              ...account,
              status: 'active',
            } as Account

            return AccountEntity(accountId).new(newAccountState)
          },
        })

        const DepositCommand = domain.command({
          name: 'DepositCommand',
          impl({ get }, amount: number) {
            const account = get(AccountQuery())
            return AccountEntity(accountId).new({ ...account, balance: account.balance + amount })
          },
        })

        const WithdrawFailedEvent = domain.event<string>({
          name: 'WithdrawFailedEvent',
        })

        const WithdrawCommand = domain.command({
          name: 'WithdrawCommand',
          impl({ get }, amount: number) {
            const isDebt = get(DebtQuery())

            if (isDebt) {
              return WithdrawFailedEvent('debt')
            }

            const account = get(AccountQuery())

            if (account.balance < amount) {
              return WithdrawFailedEvent('insufficient')
            }

            return AccountEntity(accountId).new({ ...account, balance: account.balance - amount })
          },
        })

        const TransferFailedEvent = domain.event<string>({
          name: 'TransferFailedEvent',
        })

        const TransferCommand = domain.command({
          name: 'TransferCommand',
          impl({ get }, { to, amount }: { to: number; amount: number }): RemeshCommandOutput {
            const toAccountDomain = domain.getDomain(AccountDomain(to))
            const toAccountCommand = get(toAccountDomain.query.CommandQuery())

            const fromAccountState = get(AccountQuery())

            if (toAccountCommand.status !== 'inactive') {
              if (fromAccountState.balance < amount) {
                return TransferFailedEvent('insufficient')
              }
              return [toAccountCommand.DepositCommand(amount), WithdrawCommand(amount)]
            }
            return TransferFailedEvent(`account ${to} is inactive`)
          },
        })

        const DebtCommands = {
          status: 'debt' as const,
          DepositCommand,
        }

        const InactiveCommands = {
          status: 'inactive' as const,
          ActivateAccountCommand,
        }

        const ActiveCommands = {
          status: 'active' as const,
          DepositCommand,
          WithdrawCommand,
          TransferCommand,
          CloseAccountCommand,
        }

        const CommandQuery = domain.query({
          name: 'CommandQuery',
          impl({ get }) {
            const isDebt = get(DebtQuery())

            if (isDebt) {
              return DebtCommands
            }

            const account = get(AccountQuery())

            if (account.status === 'inactive') {
              return InactiveCommands
            }

            return ActiveCommands
          },
        })

        return {
          query: {
            AccountQuery,
            DebtQuery,
            CommandQuery,
          },
          event: {
            WithdrawFailedEvent,
          },
        }
      },
    })

    const aAccountDomain = store.getDomain(AccountDomain(1))
    const bAccountDomain = store.getDomain(AccountDomain(2))

    store.igniteDomain(AccountDomain(1))
    store.igniteDomain(AccountDomain(2))

    expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
      status: 'active',
      id: 1,
      balance: 0,
    })

    expect(store.query(bAccountDomain.query.AccountQuery())).toEqual({
      status: 'active',
      id: 2,
      balance: 0,
    })

    let aAccountCommand = store.query(aAccountDomain.query.CommandQuery())

    if (aAccountCommand.status === 'active') {
      store.send(aAccountCommand.DepositCommand(100))

      expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 1,
        balance: 100,
      })
    }

    expect(store.query(bAccountDomain.query.AccountQuery())).toEqual({
      status: 'active',
      id: 2,
      balance: 0,
    })

    aAccountCommand = store.query(aAccountDomain.query.CommandQuery())

    if (aAccountCommand.status === 'active') {
      store.send(aAccountCommand.WithdrawCommand(50))

      expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 1,
        balance: 50,
      })
    }

    expect(store.query(bAccountDomain.query.AccountQuery())).toEqual({
      status: 'active',
      id: 2,
      balance: 0,
    })

    aAccountCommand = store.query(aAccountDomain.query.CommandQuery())

    if (aAccountCommand.status === 'active') {
      store.send(aAccountCommand.TransferCommand({ to: 2, amount: 50 }))

      expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 1,
        balance: 0,
      })

      expect(store.query(bAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 2,
        balance: 50,
      })

      store.send(aAccountCommand.CloseAccountCommand())

      expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
        status: 'inactive',
        id: 1,
        balance: 0,
      })

      expect(store.query(bAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 2,
        balance: 50,
      })
    }

    aAccountCommand = store.query(aAccountDomain.query.CommandQuery())

    if (aAccountCommand.status === 'inactive') {
      store.send(aAccountCommand.ActivateAccountCommand())

      expect(store.query(aAccountDomain.query.AccountQuery())).toEqual({
        status: 'active',
        id: 1,
        balance: 0,
      })
    }
  })
})
