import { $, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type {UseTimerOpts, State} from "./types";

export const useTimer = ({
  onPause$,
  onStart$,
  onStop$,
  onReset$,
  onResume$,
}: Partial<UseTimerOpts> = {}) => {
  const state = useStore<State>({
    /**
     * @param status - actually controls the timer
     * */
    timerStatus: "STOPPED",
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
    state.timerStatus = "RUNNING"; // tracked by task

    if (typeof onStart$ !== "undefined") onStart$();
  });

  /**
   * Stop timer, and run callback if exists
   * */
  const stop = $(() => {
    state.isEnded = true;
    state.timerStatus = "STOPPED";

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
    state.timerStatus = "RUNNING"; // tracked by task

    if (typeof onResume$ !== "undefined") onResume$();
  });

  /**
   * Pause timer, and run callback if exists
   * Only pauses the timer when game is started and not ended
   * */
  const pause = $(() => {
    state.isPaused = true;
    if (!state.isStarted || state.isEnded) return;

    state.timerStatus = "STOPPED";
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
    state.timerStatus = "STOPPED";

    if (typeof onReset$ !== "undefined") onReset$();
  });

  /**
   * Creates and destroys the setIntervals based on timerStatus
   * */
  useVisibleTask$((taskCtx) => {
    const status = taskCtx.track(() => state.timerStatus);

    // resume and pause have no effect if not started (first run)
    if (!state.isStarted) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let blinkId: ReturnType<typeof setInterval> | null = null;

    // Our update function
    const updateRunningTime = () => {
      const now = Date.now();
      const isLongPause = now - state.last > 500;
      const isInitialization = state.last === 0;

      let last = state.last;
      if (isInitialization || isLongPause) {
        last = now;
      }

      state.time += now - last;
      state.last = now;
    };

    if (status === "RUNNING") {
      // wrap in fn because typescript
      intervalId = setInterval(updateRunningTime, 95);

      updateRunningTime(); // run immediately also
    } else if (status === "STOPPED" && state.isPaused) {
      blinkId = setInterval(() => {
        state.blink = !state.blink;
      }, 800);
      state.blink = false;
    }

    // clean up the intervals
    taskCtx.cleanup(() => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;

      if (blinkId) clearInterval(blinkId);
      blinkId = null;
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

