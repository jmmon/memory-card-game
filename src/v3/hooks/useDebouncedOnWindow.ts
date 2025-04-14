import { type KnownEventNames, type QRL, useOnWindow } from "@builder.io/qwik";
import { useDebouncerQrl } from "./useDebouncer";

const useDebouncedOnWindow = <R>(
  event: KnownEventNames,
  onResize: QRL<(e?: Event) => R>,
  delay: number,
) => {
  // use Qrl version since we just pass the QRL through; else must wrap with a function
  const onResizeDebounced = useDebouncerQrl(onResize, delay);
  useOnWindow(event, onResizeDebounced);
};

export default useDebouncedOnWindow;
