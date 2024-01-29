import { $, useSignal, useTask$ } from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";

export const useTimeoutObj = ({
  action,
  triggerCondition,
  initialDelay,
  checkConditionOnTimeout = false,
}: {
  action: QRL<() => void | any>;
  triggerCondition: Signal<boolean>;
  initialDelay: number;
  checkConditionOnTimeout?: boolean;
}) => {
  const delay = useSignal(initialDelay);

  useTask$((taskCtx) => {
    taskCtx.track(() => triggerCondition.value);
    if (!triggerCondition.value) return;

    const timer = setTimeout(() => {
      if (!checkConditionOnTimeout) return action();
      if (triggerCondition.value) return action();
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

export const useDelayedTimeoutObj = ({
  actionOnStart,
  actionOnEnd,
  triggerCondition,
  initialDelay,
  interval,
}: {
  actionOnStart: QRL<() => void | any>;
  actionOnEnd: QRL<() => void | any>;
  triggerCondition: Signal<boolean>;
  initialDelay: number;
  interval: number;
}) => {
  const startDelay = useSignal(initialDelay);
  const intervalSignal = useSignal(interval);

  useTask$((taskCtx) => {
    taskCtx.track(() => triggerCondition.value);

    if (!triggerCondition.value) return;

    const startTimer = setTimeout(actionOnStart, startDelay.value);

    const endTimer = setTimeout(
      actionOnEnd,
      startDelay.value + intervalSignal.value
    );

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

export const useIntervalObj = ({
  action,
  triggerCondition,
  regularInterval,
  initialDelay,
}: {
  action: QRL<() => void>;
  triggerCondition: Signal<boolean>;
  regularInterval: number;
  initialDelay?: number;
}) => {
  const startDelay = useSignal(initialDelay);
  const intervalSignal = useSignal(regularInterval);
  const runInterval = useSignal(false);

  useTask$((taskCtx) => {
    taskCtx.track(() => triggerCondition.value);

    runInterval.value = false;
    if (!triggerCondition.value) return;

    const startTimer = setTimeout(() => {
      runInterval.value = true;
    }, startDelay.value);

    taskCtx.cleanup(() => {
      clearTimeout(startTimer);
    });
  });

  useTask$((taskCtx) => {
    taskCtx.track(() => runInterval.value);
    if (runInterval.value === false) return;

    const intervalTimer = setInterval(action, intervalSignal.value);

    action();

    taskCtx.cleanup(() => {
      clearInterval(intervalTimer);
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
