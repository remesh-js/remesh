import { Context } from './cqrs'
import { Serializable } from './serializable'

export type EventContext = {
  get: Context['get']
  assert: Context['assert']
}

export type EventCtor<T extends Serializable = Serializable> = new (data: T) => Event<T>

export type EventHandler<T extends Serializable = Serializable> = (data: T) => unknown

export type EventHandlerSet = Set<EventHandler<any>>

const eventHandlerSetMap = new WeakMap<EventCtor<any>, EventHandlerSet>()

const getEventHandlersSet = <T extends Serializable>(Event: EventCtor<T>): EventHandlerSet => {
  if (eventHandlerSetMap.has(Event)) {
    return eventHandlerSetMap.get(Event)!
  }
  const eventHandlerSet = new Set<EventHandler>()

  eventHandlerSetMap.set(Event, eventHandlerSet)

  return eventHandlerSet
}

export abstract class Event<T extends Serializable = void> {
  static listen<T extends Serializable>(this: EventCtor<T>, handler: EventHandler<T>) {
    const eventHandlerSet = getEventHandlersSet(this)
    eventHandlerSet.add(handler)
    return () => {
      eventHandlerSet.delete(handler)
    }
  }
  data: T
  constructor(data: T) {
    this.data = data
  }
}

type Todo = {
  id: number
  content: string
  completed: boolean
}

class TodoAddedEvent extends Event<Todo> {}

TodoAddedEvent.listen((event) => {
  event.id
})
