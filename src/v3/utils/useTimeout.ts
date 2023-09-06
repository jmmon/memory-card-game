import {
  $,
  type QRL,
  type Signal,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

export const useTimeout = (
  reset: QRL<() => void>,
  trigger: Signal<boolean>,
  initialDelay: number
) => {
  const delay = useSignal(initialDelay);

  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => trigger.value);
    if (!trigger.value) return;
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

export const useDelayedTimeout = (
  on: QRL<() => void>,
  off: QRL<() => void>,
  trigger: Signal<boolean>,
  initialDelay: number,
  interval: number
) => {
  const startDelay = useSignal(initialDelay);
  const intervalSignal = useSignal(interval);

  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => trigger.value);

    if (!trigger.value) return;

    const startTimer = setTimeout(() => {
      on();
    }, startDelay.value);

    const endTimer = setTimeout(() => {
      off();
    }, startDelay.value + intervalSignal.value);

    taskCtx.cleanup(() => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    });
  });

  return {
    setDelay: $(
      ({ start, interval }: Partial<{ start: number; interval: number }>) => {
        if (start !== undefined) startDelay.value = start;
        if (interval !== undefined) intervalSignal.value = interval;
      }
    ),
  };
};

export const useInterval = (
  run: QRL<() => void>,
  trigger: Signal<boolean>,
  initialDelay: number,
  interval: number
) => {
  const startDelay = useSignal(initialDelay);
  const intervalSignal = useSignal(interval);
  const runInterval = useSignal(false);

  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => trigger.value);

    runInterval.value = false;
    if (!trigger.value) return;

    const startTimer = setTimeout(() => {
      runInterval.value = true;
    }, startDelay.value);

    taskCtx.cleanup(() => {
      clearTimeout(startTimer);
    });
  });

  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => runInterval.value);
    if (runInterval.value === false) return;

    const update = () => {
      run();
    }

    const intervalTimer = setInterval(update, intervalSignal.value);
    update();

    taskCtx.cleanup(() => {clearInterval(intervalTimer)});
  });

  return {
    setDelay: $(
      ({ start, interval }: Partial<{ start: number; interval: number }>) => {
        if (start !== undefined) startDelay.value = start;
        if (interval !== undefined) intervalSignal.value = interval;
      }
    ),
  };
};
