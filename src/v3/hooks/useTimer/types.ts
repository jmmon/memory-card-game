import type { QRL } from "@builder.io/qwik";

export type Status = "RUNNING" | "STOPPED";

export type iTimerState = {
  status: Status;

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
