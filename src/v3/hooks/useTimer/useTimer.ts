import { $, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";

type UseTimerOpts = {
  onPause: QRL<() => void>;
  onStart: QRL<() => void>;
  onStop: QRL<() => void>;
  onReset: QRL<() => void>;
  onResume: QRL<() => void>;
  isPaused: boolean;
};

export const useTimer = ({
  onPause,
  onStart,
  onStop,
  onReset,
  onResume,
}: Partial<UseTimerOpts> = {}) => {
  const state = useStore({
    status: "STOPPED",
    time: 0,
    last: 0,
    isStarted: false,
    isPaused: false,
    isEnded: false,
    blink: false,
  });

  const start = $(() => {
    state.isPaused = false;
    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task

    if (typeof onStart !== "undefined") onStart();
  });

  const stop = $(() => {
    state.isEnded = true;
    state.status = "STOPPED";

    if (typeof onStop !== "undefined") onStop();
  });

  const resume = $(() => {
    state.isPaused = false;
    if (!state.isStarted || state.isEnded) return;

    state.isPaused = false;
    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task
    if (typeof onResume !== "undefined") onResume();
  });

  const pause = $(() => {
    state.isPaused = true;
    if (!state.isStarted || state.isEnded) return;

    state.status = "STOPPED";
    if (typeof onPause !== "undefined") onPause();
  });

  const reset = $(() => {
    state.last = 0;
    state.time = 0;
    state.isStarted = false;
    state.isEnded = false;
    state.isPaused = false;
    state.status = "STOPPED";

    if (typeof onReset !== "undefined") onReset();
  });

  // onMount and on stopping and starting the timer
  useVisibleTask$((taskCtx) => {
    const status = taskCtx.track(() => state.status);

    // resume and pause have no effect if not started
    if (!state.isStarted) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let blinkId: ReturnType<typeof setInterval> | null = null;

    const updateRunningTime = () => {
      const now = Date.now();
      const last =
        state.last === 0 || now - state.last > 500 ? now : state.last;
      state.time += now - last;
      state.last = now;
    };

    if (status === "RUNNING") {
      // wrap in fn because typescript
      intervalId = setInterval(() => {
        updateRunningTime();
      }, 95);

      updateRunningTime(); // run immediately also
    } else if (status === "STOPPED") {
      if (state.isPaused) {
        blinkId = setInterval(() => {
          state.blink = !state.blink;
        }, 800);
        state.blink = false;
      }
    }

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
