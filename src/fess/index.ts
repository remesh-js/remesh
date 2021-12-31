export * from './fess';
import {
  FessEvent,
  FessState,
  listen,
  FessStore,
  FessListenerContext,
  FessListener,
} from './fess';

const CountState = FessState({
  name: 'Count',
  default: 0,
});

const IncreCountEvent = FessEvent({
  name: 'IncreCount',
});

const DecreCountEvent = FessEvent({
  name: 'DecreCount',
});

listen(CountState.Changed, ({ }, count) => {
  console.log('changed', count);
});

listen(IncreCountEvent, ({ set, get }) => {
  const count = get(CountState);
  set(CountState, count + 1);
});

listen(DecreCountEvent, ({ set, get }) => {
  const count = get(CountState);
  set(CountState, count - 1);
});

const Timer = () => {
  const TimerState = FessState<ReturnType<
    typeof globalThis.setInterval
  > | null>({
    name: 'Timer',
    default: null,
  });

  const TickState = FessState({
    name: 'Tick',
    default: -1,
  });

  const StartTimerEvent = FessEvent<number>({
    name: 'StartTimer',
  });

  const StopTimerEvent = FessEvent({
    name: 'StopTimer',
  });

  listen(StartTimerEvent, ({ get, set, emit }, period) => {

    emit(StopTimerEvent())

    const handleTick = () => {
      const tick = get(TickState);
      const newTick = tick + 1;
      set(TickState, newTick);
    };

    const timer = setInterval(handleTick, period);

    set(TimerState, timer);
  });

  listen(StopTimerEvent, ({ get, set }) => {
    const timer = get(TimerState);
    if (timer !== null) {
      clearInterval(timer);
      set(TimerState, null);
    }
  });

  return {
    TickState,
    StartTimerEvent,
    StopTimerEvent,
  }
};

const store = FessStore();

const timer = Timer();

listen(timer.TickState.Changed, ({ get }, tick) => {
  console.log('tick', tick);

  const count = get(CountState);
  if (count < 20) {
    store.emitEvent(IncreCountEvent());
  } else {
    store.emitEvent(timer.StopTimerEvent());
  }
})


store.emitEvent(timer.StartTimerEvent(100));


