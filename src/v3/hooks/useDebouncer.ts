import { type QRL, implicit$FirstArg, useSignal, $ } from "@builder.io/qwik";

// simple debounce, without adjustable delay
// takes any args in return function

export const useDebouncerQrl = <A extends readonly unknown[], R>(
  fn: QRL<(...args: A) => R>,
  delay: number,
): QRL<(...args: A) => void> => {
  const timeoutId = useSignal<number>();

  return $((...args: A): void => {
    window.clearTimeout(timeoutId.value);
    timeoutId.value = window.setTimeout(() => {
      void fn(...(args as any)); // fix ts error...
    }, delay);
  });
};

export const useDebouncer$ = implicit$FirstArg(useDebouncerQrl);


// debounce with adjustable delay
// only takes an object as return function args
// can call without args, and the first argument then will be the delay
export const useAdjustableDebouncerQrl = <A extends Object, R>(
  fn: QRL<((args: A) => R) | (() => R)>,
  delay: number,
): QRL<(args?: A, delay?: number) => void> => {
  const timeoutId = useSignal<number>();

  return $((args?: A, updatedDelay?: number): void => {
    window.clearTimeout(timeoutId.value);
    // capture args as number in case only one non-object arg is passed
    const newDelay = (args && typeof args !== "object" && !updatedDelay) 
      ? (args as unknown as number) 
      : (typeof updatedDelay === "number") 
        ? updatedDelay
        : delay;
    timeoutId.value = window.setTimeout(
      () => {
        if (typeof args === "object") {
          void fn(args as any); // fix ts error...
          return;
        }
        fn();
      },
      Math.max(0, newDelay),
    );
  });
};

export const useAdjustableDebouncer$ = implicit$FirstArg(
  useAdjustableDebouncerQrl,
);
