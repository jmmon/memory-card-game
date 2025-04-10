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
    track(triggerCondition);
    if (!triggerCondition.value) return;

    // useTask$(({ track, cleanup }) => {
    //   track(triggerCondition);
    //   if (isServer || !triggerCondition) return;

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
    track(triggerCondition);
    if (!triggerCondition.value) return;

    // useTask$(({ track, cleanup }) => {
    //   track(triggerCondition);
    //   if (isServer || !triggerCondition) return;

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
    track(triggerCondition);
    isIntervalRunning.value = false; // turn off interval
    if (!triggerCondition.value) return;

    // useTask$(({ track, cleanup }) => {
    //   track(triggerCondition);
    //   if (isServer) return;
    //   isIntervalRunning.value = false; // turn off interval
    //   if (!triggerCondition) return;

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
  // useVisibleTask$(({ track, cleanup }) => {
  //   track(isIntervalRunning);
  //   if (!isIntervalRunning.value) return;

  useTask$(({ track, cleanup }) => {
    track(isIntervalRunning);
    if (isServer || !isIntervalRunning.value) return;

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
