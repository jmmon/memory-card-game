import { useSignal, $, useTask$ } from "@builder.io/qwik";
import type { UseDebounceProps } from "./types";

/**
 * @param _action$ - a function that will be called after the delay
 * @param args - a value to pass in to the action, saved in a signal
 *   and returned from the hook to be controlled externally if needed
 * @param _delay=500 - delay in milliseconds before calling the action,
 *   also returned in a signal
 *
 */
export function useDebounceSignal<T>({
  _action$,
  args,
  _delay = 500,
}: UseDebounceProps<T>) {
  /**
   * Signal to hold the args to pass in to the _action$. Can be set
   *   dynamically, aside from when calling callDebounce()
   * */
  const argsSignal = useSignal<T>(args as T);

  /**
   * Signal to control the delay, if it needs to be set
   *   dynamically, aside from when calling callDebounce()
   * */
  const delaySignal = useSignal(_delay);

  /**
   * controls the starting of the timer
   * 0 is for "uninitialized" check in task, and 1 and 2 are to flip the boolean
   * */
  const flip = useSignal<0 | 1 | 2>(0);

  /**
   * Runs the action after a delay. Saves new values if passed in, and
   *   flips a boolean to trigger the task.
   *
   * @param [newValue] - a new value to pass into the action
   * @param [delay] - a delay in milliseconds
   * */
  const callDebounce = $(
    ({ newValue, delay }: { newValue?: T; delay?: number } = {}) => {
      if (delay !== undefined) {
        delaySignal.value = delay;
      }

      if (newValue !== undefined) {
        argsSignal.value = newValue;
      }

      // trigger our task
      flip.value = flip.value >= 2 ? 1 : ((flip.value + 1) as 1 | 2);
    }
  );

  /**
   * tracks our flip signal, to start the timer.
   * Starts timer with current delay, to call action with current args.
   * Also handles cleanup of the timer.
   * */
  useTask$((taskCtx) => {
    taskCtx.track(() => [flip.value]);

    // return if uninitialized
    if (flip.value === 0) return;

    // set up the timer to run the action, passing in the value and using the delay
    const timer = setTimeout(() => {
      _action$(argsSignal.value as T);
    }, Math.max(0, delaySignal.value));

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return { callDebounce, delaySignal, argsSignal };
}

// export function useDebounceObj<T>({
//   action,
//   _delay = 500,
// }: {
//   action: QRL<(newValue?: T) => void>;
//   _delay: number;
// }) {
//   const signal = useSignal<T>();
//   const delay = useSignal(_delay);
//   const setValue = $((newValue: T) => {
//     signal.value = newValue;
//   });
//   const setDelay = $((num: number) => {
//     delay.value = Math.max(0, num);
//   });
//
//   // track value changes to restart the timer
//   useTask$((taskCtx) => {
//     taskCtx.track(() => [signal.value, delay.value]);
//
//     if (signal.value === undefined) return;
//
//     const timer = setTimeout(() => {
//       action(signal.value as T);
//     }, Math.max(0, delay.value));
//
//     taskCtx.cleanup(() => clearTimeout(timer));
//   });
//
//   return { setValue, setDelay };
// }
//
