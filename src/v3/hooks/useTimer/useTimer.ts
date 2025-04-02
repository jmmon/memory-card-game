import { $, useStore, useTask$ } from "@builder.io/qwik";
import type { UseTimerOpts, iTimerState } from "./types";

/**
 * Not currently using these handler props, but may come in handy
 * */
export const useTimer = ({
  onPause$,
  onStart$,
  onStop$,
  onReset$,
  onResume$,
}: Partial<UseTimerOpts> = {}) => {
  const state = useStore<iTimerState>({
    /**
     * @param status - actually controls the timer
     * */
    status: "STOPPED",
    /**
     * @param time - currently accumulated time in ms
     * */
    time: 0,
    /**
     * @param last - previous loop Date.now(),
     *   to calculate time passed since last update
     * */
    last: 0,
    /**
     * @param isStarted - Marks the start of the timer session
     *   Marked as true when the game starts (first click of a card)
     * */
    isStarted: false,
    /**
     * @param isPaused - Toggle to control paused state
     *   Has no effect if `isStarted` is false or `isEnded` is true
     * */
    isPaused: false,
    /**
     * @param isEnded - Marks the end of the game
     *   Used to prevent resuming the game after the game is ended
     * */
    isEnded: false,
    /**
     * @param blink - Sends a blinking signal while paused
     *   Just for looks, to blink the timer display (probably should be external)
     * */
    blink: false,
  });

  /**
   * Start timer, and run callback if exists
   * */
  const start = $(() => {
    state.isPaused = false;
    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task

    if (typeof onStart$ !== "undefined") onStart$();
  });

  /**
   * Stop timer, and run callback if exists
   * */
  const stop = $(() => {
    state.isEnded = true;
    state.status = "STOPPED";

    if (typeof onStop$ !== "undefined") onStop$();
  });

  /**
   * Resume timer, and run callback if exists
   * Only resume the timer via status
   * */
  const resume = $(() => {
    state.isPaused = false;

    if (state.isStarted === false || state.isEnded) return;

    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task

    if (typeof onResume$ !== "undefined") onResume$();
  });

  /**
   * Pause timer, and run callback if exists
   * Only pauses the timer when game is started and not ended
   * */
  const pause = $(() => {
    state.isPaused = true;
    if (!state.isStarted || state.isEnded) return;

    state.status = "STOPPED";
    if (typeof onPause$ !== "undefined") onPause$();
  });

  /**
   * Reset the timer to original settings, and run call back if exists
   * */
  const reset = $(() => {
    state.last = 0;
    state.time = 0;
    state.isStarted = false;
    state.isEnded = false;
    state.isPaused = false;
    state.status = "STOPPED";

    if (typeof onReset$ !== "undefined") onReset$();
  });

  /**
   * Creates and destroys the setIntervals based on status
   * */
  useTask$(({ track, cleanup }) => {
    const status = track(() => state.status);

    // resume and pause have no effect if not started (first run)
    if (!state.isStarted) return;

    let intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    let blinkId: ReturnType<typeof setInterval> | undefined = undefined;

    // Our update function
    const updateRunningTime = () => {
      const now = Date.now();

      const isLongPause = now - state.last > 500;
      const isInitialization = state.last === 0;

      let last = state.last;
      if (isInitialization || isLongPause) {
        last = now;
      }

      state.time += now - last; // 0 for first run (now - now)
      state.last = now; // sets to Date.now() on first run
    };

    if (status === "RUNNING") {
      // wrap in fn because typescript
      intervalId = setInterval(updateRunningTime, 98);

      updateRunningTime(); // run immediately also
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (status === "STOPPED" && state.isPaused) {
      blinkId = setInterval(() => {
        state.blink = !state.blink;
      }, 800);
      state.blink = false;
    }

    // clean up the intervals
    cleanup(() => {
      if (intervalId) clearInterval(intervalId);
      intervalId = undefined;

      if (blinkId) clearInterval(blinkId);
      blinkId = undefined;
    });
  });

  const timer = {
    state,
    start,
    stop,
    pause,
    reset,
    resume,
  };

  return timer;
};
