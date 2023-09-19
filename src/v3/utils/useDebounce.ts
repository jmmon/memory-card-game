import type { PropFunction, QRL, Signal } from "@builder.io/qwik";
import { useSignal, $, useTask$ } from "@builder.io/qwik";

export function useDebounce<T>(
  action: QRL<(newValue?: T) => void>,
  _delay: number = 500
) {
  const signal = useSignal<T | undefined>();
  const delay = useSignal(_delay);
  const setValue = $((newValue: T | undefined) => {
    signal.value = newValue;
  });
  const setDelay = $((num: number) => {
    delay.value = Math.max(0, num);
  });

  // track value changes to restart the timer
  useTask$((taskCtx) => {
    taskCtx.track(() => [signal.value, delay.value]);

    if (signal.value === undefined) return;

    const timer = setTimeout(() => {
      console.log('running debounce action');
      action(signal.value as T);
      setValue(undefined)
    }, Math.max(0, delay.value));

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return { setValue, setDelay };
}

// some better way??
// debounce a signal, just return a new changed value x ms after the watched val changes
// then the handler on the other side can track this signal change and run the action
// downside: requires 2 tasks: one to run the delay and one to watch the delay.

export function useDebounce2<T>(
  signal: Signal<T>,
  action: PropFunction<(value: T) => void>,
  delay: Signal<number>
) {
  const debounced = useSignal<T>();

  // track value changes to restart the timer
  useTask$((taskCtx) => {
    taskCtx.track(() => [delay.value, signal.value]);

    const timer = setTimeout(async () => {
      await action(signal.value);
      debounced.value = signal.value;
    }, Math.max(0, delay.value));

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return {
    delay,
    setDelay: $((newDelay: number) => {
      delay.value = Math.max(0, newDelay);
    }),
    debounced,
  };
}
