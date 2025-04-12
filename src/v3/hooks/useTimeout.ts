import {
  isServer,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";
import { DebugTypeEnum, LogLevel } from "../constants/game";
import logger from "../services/logger";

/**
 * @property action - action after delay
 * @property triggerCondition - condition to start the delay timeout
 * @property delay - delay in ms
 * @property checkConditionOnTimeout - check condition on timeout before taking action
 * @returns signals to set delay
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
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "useTimeoutObj setup", {
    triggerCondition: triggerCondition.value,
    initialDelay: delay,
    checkConditionOnTimeout,
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => triggerCondition.value);
    if (!triggerCondition.value) return;

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

  // return {
  //   delaySignal,
  // };
};

/**
 * @property actionOnStart - action after initialDelay
 * @property actionOnEnd - action after initialDelay + interval
 * @property triggerCondition - condition to start the initial delay timeout
 * @property interval - interval in ms
 * @property initialDelay - delay before first run
 * @property checkConditionOnStartTimeout=false - check condition on start timeout before taking action
 * @property checkConditionOnEndTimeout=false - check condition on end timeout before taking action
 * @returns signals to set delay and interval
 * */
export const useDelayedTimeoutObj = ({
  actionOnStart,
  actionOnEnd,
  triggerCondition,
  initialDelay,
  interval,
  checkConditionOnStartTimeout = false,
  checkConditionOnEndTimeout = false,
}: {
  actionOnStart: QRL<() => void | any>;
  actionOnEnd: QRL<() => void | any>;
  triggerCondition: Signal<boolean>;
  initialDelay: number;
  interval: number;
  checkConditionOnStartTimeout?: boolean;
  checkConditionOnEndTimeout?: boolean;
}) => {
  const delaySignal = useSignal(initialDelay);
  const intervalSignal = useSignal(interval);
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "useDelayedTimeoutObj setup", {
    triggerCondition: triggerCondition.value,
    initialDelay,
    interval,
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => triggerCondition.value);
    if (!triggerCondition.value) return;

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
 * @property runImmediatelyOnCondition=true - run the action immediately when the triggerCondition is met
 * @returns signals to set delay and interval
 * */
export const useIntervalObj = ({
  action,
  triggerCondition,
  interval,
  initialDelay,
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
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "useIntervalObj setup", {
    triggerCondition: triggerCondition.value,
    initialDelay,
    interval,
    runImmediatelyOnCondition,
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => triggerCondition.value);
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

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isIntervalRunning.value);
    if (isIntervalRunning.value === false) return;

    const intervalTimer = setInterval(() => {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj interval running",
      );
      action();
    }, intervalDuration.value);

    if (runImmediatelyOnCondition) {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj runImmediatelyOnCondition",
      );
      action();
    }

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
 * useIntervalOccurrences?
 *  should run x occurrences, signal so it can change when deckSize changes
 *  should have an interval which is signal so it can also adjust by deckSize
 *  should have a break time, or could just run extra occurrences and check the condition inside the action
 *  - e.g run 52 intervals triggering intervalAction and then trigger a timeout, after which there is a endAction which is run
 *  - e.g. opposite of the useInterval, and only run for x occurrences
 * */

/**
 * @property triggerCondition - condition to start the interval
 * @property interval - interval in ms
 * @property intervalAction - action to perform every interval
 * @property occurrences - how many occurrences the interval runs
 * @property endingActionDelay - delay after all occurrences
 * @property endingAction - action to perform after all occurrences + ending delay
 * @returns signals to set delay and interval
 * */
export const useOccurrencesInterval = ({
  triggerCondition,
  intervalAction,
  interval,
  occurrences,
  endingAction,
  endingActionDelay,
}: {
  triggerCondition: Signal<boolean>;
  intervalAction: QRL<() => void>;
  interval: Signal<number>;
  occurrences: Signal<number>;
  endingAction: QRL<() => void>;
  endingActionDelay: Signal<number>;
}) => {
  logger(DebugTypeEnum.HOOK, LogLevel.ONE, "useIntervalObj setup", {
    triggerCondition: triggerCondition.value,
    initialDelay: endingActionDelay,
    interval,
  });

  const intervalTimer = useSignal<number>();
  const endingActionTimer = useSignal<number>();

  useTask$(({ track }) => {
    track(triggerCondition);
    console.log("triggerCondition", triggerCondition.value);
    if (isServer || triggerCondition.value === false) return;

    if (endingActionTimer.value) {
      clearTimeout(endingActionTimer.value);
      endingActionTimer.value = undefined;
      // console.log("clearing timeout");
    }

    if (intervalTimer.value) {
      clearInterval(intervalTimer.value);
      intervalTimer.value = undefined;
      // console.log("clearing interval");
    }

    let occurrencesCounter = occurrences.value - 1;
    intervalAction(); // run immediately, then on interval

    intervalTimer.value = window.setInterval(() => {
      logger(
        DebugTypeEnum.TASK,
        LogLevel.ONE,
        "~~ useIntervalObj interval running",
      );
      occurrencesCounter--;
      intervalAction();

      if (occurrencesCounter === 0) {
        if (intervalTimer.value) {
          clearInterval(intervalTimer.value);
          intervalTimer.value = undefined;
          console.log("clearing interval");
        }
      }
    }, interval.value);

    // console.log("creating timeout:", interval.value * occurrences.value + endingActionDelay.value);
    endingActionTimer.value = window.setTimeout(
      () => {
        
        // console.log("running endingAction");
        endingAction();
      },
      interval.value * occurrences.value + endingActionDelay.value,
    );
  });

  // return {
  //   initialDelayDuration,
  //   intervalDuration,
  // };
};
