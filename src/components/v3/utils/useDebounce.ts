import type { QRL } from "@builder.io/qwik";
import { useSignal, $, useTask$ } from "@builder.io/qwik";

export function useDebounce<T>(
  action: QRL<(newValue?: T) => void>,
  _delay: number = 500
) {
  const signal = useSignal<T>();
  const delay = useSignal(_delay);
  const setValue = $((newValue: T) => {
    signal.value = newValue;
  });
  const setDelay = $((num: number) => {
    delay.value = num;
  });

  // track value changes to restart the timer
  useTask$((taskCtx) => {
    taskCtx.track(() => [signal.value, delay.value]);

    if (signal.value === undefined) return;

    const timer = setTimeout(() => {
      action(signal.value as T);
    }, delay.value);

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return { setValue, setDelay };
}


// some better way??
// debounce a signal, just return a new changed value x ms after the watched val changes
// then the handler on the other side can track this signal change and run the action
// downside: requires 2 tasks: one to run the delay and one to watch the delay.

// export function useDebounce2<T>(
//   action: QRL<() => void>,
//   _delay: number = 500
// ) {
//   const delay = useSignal(_delay);
//   const setDelay = $((num: number) => {
//     delay.value = num;
//   });
//   const signal = useSignal(false);
//
//   // track value changes to restart the timer
//   useTask$((taskCtx) => {
//     taskCtx.track(() => [signal.value, delay.value]);
//
//     if (signal.value === false) return;
//
//     const timer = setTimeout(() => {
//       action();
//     }, delay.value);
//
//     taskCtx.cleanup(() => clearTimeout(timer));
//   });
//
//   return { run: $(() => {signal.value = true}), setDelay };
// }
