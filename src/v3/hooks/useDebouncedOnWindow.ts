import { type KnownEventNames, type QRL, useOnWindow } from "@builder.io/qwik";
import { useDebouncer$ } from "./useDebouncer";

const useDebouncedOnWindow = <R>(
  event: KnownEventNames,
  onResize: QRL<(e?: Event) => R>,
  delay: number,
) => {
  const onResizeDebounced = useDebouncer$(() => onResize(), delay);
  useOnWindow(event, onResizeDebounced);
};

export default useDebouncedOnWindow;
