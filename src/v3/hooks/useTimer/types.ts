export type Status = "RUNNING" | "STOPPED";

export interface State {
  status: Status;

  time: number;
  last: number;

  isStarted: false;
  isPaused: false;
  isEnded: false;
  blink: false;
}

export type UseTimerOpts = {
  onPause$: QRL<() => void>;
  onStart$: QRL<() => void>;
  onStop$: QRL<() => void>;
  onReset$: QRL<() => void>;
  onResume$: QRL<() => void>;
  isPaused: boolean;
};
