/* eslint-disable jest/no-conditional-expect */
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
import { map, tap } from 'rxjs/operators'
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

        const FetchFeaturesCommand = domain.command({
          name: 'FetchFeaturesCommand',
          impl({}) {
            return FetchFeaturesEvent()
          },
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

        return { query: { FeaturesQuery }, command: { FetchFeaturesCommand }, event: { FetchFeaturesEvent } }
      },
    })

    const featuresDomain = store.getDomain(FeaturesDomain())
    store.igniteDomain(FeaturesDomain())
    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeQuery(featuresDomain.query.FeaturesQuery(), changed)
    store.send(featuresDomain.command.FetchFeaturesCommand())
    jest.runOnlyPendingTimers()

    jest.useRealTimers()
    await utils.delay(1)
    expect(changed).toHaveBeenCalledWith(['ddd', 'cqrs', 'event-driven'])
  })

  it('fromQuery/fromEvent', async () => {
    const fromQueryCallback = jest.fn()
    const fromEventCallback = jest.fn()
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
            return [CountState().new(count), CountChangedEvent(count)]
          },
        })

        const CountChangedEvent = domain.event<number>({
          name: 'CountChangedEvent',
        })

        domain.effect({
          name: 'FromEventToUpdateEffect',
          impl({ fromEvent, get }) {
            return fromEvent(CountChangedEvent).pipe(
              map(() => null),
              tap(fromQueryCallback),
            )
          },
        })

        domain.effect({
          name: 'FromQueryToEventEffect',
          impl({ fromQuery }) {
            return fromQuery(CountQuery()).pipe(
              map(() => null),
              tap(fromEventCallback),
            )
          },
        })

        return {
          query: { CountQuery },
          command: { UpdateCountCommand },
          event: { CountChangedEvent },
        }
      },
    })

    const countDomain = store.getDomain(CountDomain())
    const changed = jest.fn()

    store.igniteDomain(CountDomain())
    store.subscribeEvent(countDomain.event.CountChangedEvent, changed)
    store.send(countDomain.command.UpdateCountCommand(1))

    await utils.delay(1)

    expect(changed).toHaveBeenCalledTimes(1)
    expect(fromQueryCallback).toHaveBeenCalledTimes(1)
    expect(fromEventCallback).toHaveBeenCalledTimes(1)
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
        const AccountState: RemeshState<Account> = domain.state<Account>({
          name: 'AccountState',
          defer: true,
        })

        const UpdateAccountCommand = domain.command({
          name: 'UpdateAccountCommand',
          impl({}, account: Account) {
            return AccountState().new(account)
          },
        })

        domain.effect({
          name: 'AccountStateEffect',
          impl({}) {
            return [UpdateAccountCommand({ id: accountId, status: 'inactive', balance: 0 }), ActivateAccountCommand()]
          },
        })

        const AccountQuery = domain.query({
          name: 'AccountQuery',
          impl: ({ get }) => {
            return get(AccountState())
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

            return AccountState().new(newAccountState)
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

            return AccountState().new(newAccountState)
          },
        })

        const DepositCommand = domain.command({
          name: 'DepositCommand',
          impl({ get }, amount: number) {
            const account = get(AccountQuery())
            return AccountState().new({ ...account, balance: account.balance + amount })
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

            return AccountState().new({ ...account, balance: account.balance - amount })
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

  it('call command/event when before/after a command called', () => {
    const fn0 = jest.fn()
    const fn1 = jest.fn()
    const fn2 = jest.fn()

    let count = 0

    const ACommand = RemeshCommand({
      name: 'ACommand',
      impl: ({}, arg: unknown) => {
        fn0(arg, count++)
        return null
      },
    })

    const BCommand = RemeshCommand({
      name: 'BCommand',
      impl: ({}, arg: unknown) => {
        fn1(arg, count++)
        return null
      },
    })

    const CCommand = RemeshCommand({
      name: 'CCommand',
      impl: ({}, arg: unknown) => {
        fn2(arg, count++)
        return null
      },
    })

    BCommand.before(({}, arg) => {
      return ACommand(arg)
    })

    BCommand.after(({}, arg) => {
      return CCommand(arg)
    })

    const store = RemeshStore()

    store.send(BCommand('input0'))

    expect(fn0).lastCalledWith('input0', 0)
    expect(fn1).lastCalledWith('input0', 1)
    expect(fn2).lastCalledWith('input0', 2)

    store.send(BCommand('input1'))

    expect(fn0).lastCalledWith('input1', 3)
    expect(fn1).lastCalledWith('input1', 4)
    expect(fn2).lastCalledWith('input1', 5)
  })
})
