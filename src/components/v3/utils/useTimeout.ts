import { $, QRL, Signal, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export const useTimeout = (reset: QRL<() => void>, trigger: boolean, initialDelay: number) => {
  const delay = useSignal(initialDelay);

  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => trigger);
    if (!trigger) return;
    const timer = setTimeout(() => {
      reset();
    }, delay.value);
    taskCtx.cleanup(() => {
      clearTimeout(timer);
    });
  });

  return {
    setDelay: $((time: number) => {
      delay.value = time;
    }),
  };
};
