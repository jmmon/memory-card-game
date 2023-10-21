import type { QRL } from "@builder.io/qwik";

export type UseDebounceProps<T> = {
  args?: T;
  _action$: QRL<((newValue: T) => void) | (() => void)>;
  _delay: number ;
};
