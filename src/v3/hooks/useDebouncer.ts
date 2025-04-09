import { type QRL, implicit$FirstArg, useSignal, $ } from "@builder.io/qwik";

// simple debounce, without adjustable delay

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
