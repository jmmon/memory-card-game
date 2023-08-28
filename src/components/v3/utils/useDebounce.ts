import { QRL, useSignal, $, useTask$} from "@builder.io/qwik";

// export function useDebounce<T>(
//   action: QRL<(newValue: T) => void>,
//   delay: number = 500
// ) {
//   const signal = useSignal<T>();
//   const setValue = $((newValue: T) => {
//     signal.value = newValue;
//   });
//
//   // track value changes to restart the timer
//   useTask$((taskCtx) => {
//     taskCtx.track(() => signal.value);
//
//     if (signal.value === undefined) return;
//
//     const timer = setTimeout(() => {
//       action(signal.value as T);
//     }, delay);
//
//     taskCtx.cleanup(() => clearTimeout(timer));
//   });
//
//   return setValue;
// }


export function useDebounce<T>(
  action: QRL<(newValue: T) => void>,
  _delay: number = 500,
) {
  const signal = useSignal<T>();
  const delay = useSignal(_delay);
  const setValue = $((newValue: T) => {
    signal.value = newValue;
  });

  // track value changes to restart the timer
  useTask$((taskCtx) => {
    taskCtx.track(() => [ signal.value, delay.value ]);

    if (signal.value === undefined) return;

    const timer = setTimeout(() => {
      action(signal.value as T);
    }, delay.value);

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return { setValue, setDelay: $((num: number) => {delay.value = num}) };
}
