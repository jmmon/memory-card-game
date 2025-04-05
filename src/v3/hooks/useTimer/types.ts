import type { QRL } from "@builder.io/qwik";
import { useTimer } from "./useTimer";

export enum StatusEnum {
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
}
export type Status = keyof typeof StatusEnum;

export type iTimerState = {
  status: StatusEnum;

  time: number;
  last: number;

  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  blink: boolean;
};

export type UseTimerOpts = {
  onPause$: QRL<() => void>;
  onStart$: QRL<() => void>;
  onStop$: QRL<() => void>;
  onReset$: QRL<() => void>;
  onResume$: QRL<() => void>;
  isPaused: boolean;
};

export type iTimer = ReturnType<typeof useTimer>;
