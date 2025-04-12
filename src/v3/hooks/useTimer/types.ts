import type { QRL } from "@builder.io/qwik";
import type { useTimer } from "./useTimer";

export enum StatusEnum {
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
}
export type Status = keyof typeof StatusEnum;

export type iTimerState = {
  /**
   * @param status - actually controls the timer
   * */
  status: StatusEnum;

  /**
   * @param time - currently accumulated time in ms
   * */
  time: number;

  /**
   * @param last - previous loop Date.now(),
   *   to calculate time passed since last update
   * */
  last: number;

  /**
   * @param isStarted - Marks the start of the timer session
   *   Marked as true when the game starts (first click of a card)
   * */
  isStarted: boolean;
  /**
   * @param isPaused - Toggle to control paused state
   *   Has no effect if `isStarted` is false or `isEnded` is true
   * */
  isPaused: boolean;
  /**
   * @param isEnded - Marks the end of the game
   *   Used to prevent resuming the game after the game is ended
   * */
  isEnded: boolean;
  /**
   * @param blink - Sends a blinking signal while paused
   *   Just for looks, to blink the timer display (probably should be external)
   * */
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
