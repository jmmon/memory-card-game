import {
  isServer,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";
import { DebugTypeEnum, LogLevel } from "../constants/game";
import logger from "../services/logger";

/**
 * @property triggerCondition - condition to start the delay timeout
 * @property delay - delay in ms
 * @property action - action after delay
 * @property checkConditionOnTimeout=false - check condition on timeout before taking action
 * */
export const useTimeoutObj = ({
  action,
  triggerCondition,
  delay,
  checkConditionOnTimeout = false,
}: {
  action: QRL<() => void | any>;
  triggerCondition: Signal<boolean>;
  delay: number | Signal<number>;
  checkConditionOnTimeout?: boolean;
}) => {
  // const delaySignal = useSignal(delay);
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SETUP useTimeoutObj", {
    triggerCondition: triggerCondition.value,
    initialDelay: delay,
    checkConditionOnTimeout,
  });

  useTask$(({ track, cleanup }) => {
    track(triggerCondition);
    if (isServer || !triggerCondition.value) return;

    logger(DebugTypeEnum.TASK, LogLevel.ONE, "~~ useTimeoutObj condition met");

    const timer = setTimeout(
      () => {
        logger(DebugTypeEnum.TASK, LogLevel.ONE, "~~ useTimeoutObj timeout", {
          checkConditionOnTimeout,
          triggerCondition: triggerCondition.value,
        });
        if (checkConditionOnTimeout && !triggerCondition.value) return;
        action();
      },
      typeof delay === "number" ? delay : delay.value,
    );

    cleanup(() => {
      clearTimeout(timer);
    });
  });
};

/**
 * @property triggerCondition - condition to start the initial delay timeout
 * @property initialDelay - delay before first run
 * @property actionOnStart - action after initialDelay
 * @property interval - interval in ms
 * @property actionOnEnd - action after initialDelay + interval
 * @property checkConditionOnStartTimeout=false - check condition on start timeout before taking action
 * @property checkConditionOnEndTimeout=false - check condition on end timeout before taking action
 * @returns signals to set delay and interval
 * */
export const useDelayedTimeoutObj = ({
  triggerCondition,
  initialDelay,
  actionOnStart,
  interval,
  actionOnEnd,
  checkConditionOnStartTimeout = false,
  checkConditionOnEndTimeout = false,
}: {
  triggerCondition: Signal<boolean>;
  initialDelay: number;
  actionOnStart: QRL<() => void | any>;
  interval: number;
  actionOnEnd: QRL<() => void | any>;
  checkConditionOnStartTimeout?: boolean;
  checkConditionOnEndTimeout?: boolean;
}) => {
  const delaySignal = useSignal(initialDelay);
  const intervalSignal = useSignal(interval);
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SETUP useDelayedTimeoutObj", {
    triggerCondition: triggerCondition.value,
    initialDelay,
    interval,
  });

  useTask$(({ track, cleanup }) => {
    track(triggerCondition);
    if (isServer || !triggerCondition.value) return;

    logger(
      DebugTypeEnum.TASK,
      LogLevel.ONE,
      "~~ useDelayedTimeoutObj condition met",
    );

    const startTimer = setTimeout(() => {
      if (checkConditionOnStartTimeout && !triggerCondition.value) return;
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useDelayedTimeoutObj startTimeout",
      );
      actionOnStart();
    }, delaySignal.value);

    const endTimer = setTimeout(() => {
      if (checkConditionOnEndTimeout && !triggerCondition.value) return;
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useDelayedTimeoutObj endTimeout",
      );
      actionOnEnd();
    }, delaySignal.value + intervalSignal.value);

    cleanup(() => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    });
  });

  return {
    delaySignal,
    intervalSignal,
  };
};

/**
 * @property action - action to perform every regularInterval
 * @property triggerCondition - condition to start the initial delay timeout
 * @property interval - interval in ms
 * @property initialDelay=undefined - delay before first run
 * @property runImmediatelyOnCondition=true - run the action immediately after initial delay (at start of interval)
 * @returns signals to set delay and interval
 * */
export const useIntervalObj = ({
  triggerCondition,
  initialDelay,
  interval,
  action,
  runImmediatelyOnCondition = true,
}: {
  action: QRL<() => void>;
  triggerCondition: Signal<boolean>;
  interval: number;
  initialDelay?: number;
  runImmediatelyOnCondition?: boolean;
}) => {
  const initialDelayDuration = useSignal(initialDelay);
  const intervalDuration = useSignal(interval);
  const isIntervalRunning = useSignal(false);
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SETUP useIntervalObj", {
    triggerCondition: triggerCondition.value,
    initialDelay,
    interval,
    runImmediatelyOnCondition,
  });

  useTask$(({ track, cleanup }) => {
    track(triggerCondition);
    if (isServer) return;
    isIntervalRunning.value = false; // turn off interval
    if (!triggerCondition.value) return;

    logger(
      DebugTypeEnum.TASK,
      LogLevel.ONE,
      "~~ useIntervalObj condition met",
      {
        hasInitialDelay: !!initialDelayDuration.value,
      },
    );

    // start interval immediately upon condition, if no initial delay
    if (!initialDelayDuration.value) {
      isIntervalRunning.value = true;
      return;
    }

    const startTimer = setTimeout(() => {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj initialDelay timeout complete",
      );
      isIntervalRunning.value = true;
    }, initialDelayDuration.value);

    cleanup(() => {
      clearTimeout(startTimer);
    });
  });

  useTask$(({ track, cleanup }) => {
    track(isIntervalRunning);
    if (isServer || !isIntervalRunning.value) return;

    if (runImmediatelyOnCondition) {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj runImmediatelyOnCondition",
      );
      action();
    }

    const intervalTimer = setInterval(() => {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj interval running",
      );
      action();
    }, intervalDuration.value);

    cleanup(() => {
      clearInterval(intervalTimer);
    });
  });

  return {
    initialDelayDuration,
    intervalDuration,
  };
};

/**
 * @property triggerCondition - condition to start the interval
 * @property interval - interval in ms
 * @property intervalAction - action to perform every interval
 * @property occurrences - how many occurrences the interval runs
 * @property endingActionDelay - delay after all occurrences
 * @property endingAction - action to perform after all occurrences + ending delay
 * */
export const useOccurrencesInterval = ({
  triggerCondition,
  interval,
  intervalAction,
  occurrences,
  endingActionDelay = 0,
  endingAction,
  runImmediatelyOnCondition = true,
}: {
  triggerCondition: Signal<boolean>;
  interval: Signal<number>;
  intervalAction: QRL<() => void>;
  occurrences: Signal<number>;
  endingActionDelay?: number | Signal<number>;
  endingAction: QRL<() => void>;
  runImmediatelyOnCondition?: boolean;
}) => {
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "SETUP useOccurrencesInterval", {
    triggerCondition: triggerCondition.value,
    initialDelay:
      typeof endingActionDelay === "number"
        ? endingActionDelay
        : endingActionDelay.value,
    interval: interval.value,
  });

  const intervalTimer = useSignal<number>();
  const endingActionTimer = useSignal<number>();

  useTask$(({ track }) => {
    track(triggerCondition);
    logger(DebugTypeEnum.HOOK, LogLevel.ONE, "TRACK useOccurrencesInterval", {
      isServer,
    });
    if (isServer || !triggerCondition.value) return;
    logger(
      DebugTypeEnum.HOOK,
      LogLevel.ONE,
      "~~ useOccurrencesInterval condition met, running first occurrence",
      {
        triggerCondition: triggerCondition.value,
      },
    );

    clearTimeout(endingActionTimer.value);
    endingActionTimer.value = undefined;

    clearInterval(intervalTimer.value);
    intervalTimer.value = undefined;

    const startTime = Date.now();
    let lastOccurrenceTime = 0;
    let occurrencesCounter = occurrences.value;

    if (runImmediatelyOnCondition) {
      occurrencesCounter--;
      intervalAction();
    }

    intervalTimer.value = window.setInterval(() => {
      const now = Date.now();
      logger(
        DebugTypeEnum.HOOK,
        LogLevel.TWO,
        "~~ useOccurrencesInterval: interval running",
        {
          interval: now - (lastOccurrenceTime || startTime) + "ms",
          duration: now - startTime + "ms",
          occurrence: occurrencesCounter,
        },
      );
      lastOccurrenceTime = now;

      occurrencesCounter--;
      intervalAction();

      if (occurrencesCounter > 0) {
        return;
      }
      clearInterval(intervalTimer.value);
      intervalTimer.value = undefined;

      if (!endingActionDelay) {
        // no need to set a timer for 0 delay
        endingAction();
        return;
      }

      // set timeout for ending action if we have a delay
      endingActionTimer.value = window.setTimeout(
        () => {
          const now = Date.now();
          logger(
            DebugTypeEnum.HOOK,
            LogLevel.TWO,
            "~~ useOccurrencesInterval: endingAction runs",
            {
              endingPause: now - lastOccurrenceTime + "ms",
              totalDuration: now - startTime + "ms",
            },
          );
          endingAction();
        },
        typeof endingActionDelay === "number"
          ? endingActionDelay
          : endingActionDelay.value,
      );

    }, interval.value);
  });
};
