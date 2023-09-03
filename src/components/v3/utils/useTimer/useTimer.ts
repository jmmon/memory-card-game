import { $, QRL, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";

type UseTimerOpts = {
  onPause: QRL<() => void>;
  onStart: QRL<() => void>;
  onStop: QRL<() => void>;
  onReset: QRL<() => void>;
  isPaused: boolean;
};
export const useTimer = ({
  onPause,
  onStart,
  onStop,
  onReset,
}: Partial<UseTimerOpts> = {}) => {
  const state = useStore({
    status: "STOPPED",
    start: 0, // local start time (for this session)
    end: 0, // local end time
    total: 0, // total game time
    isStarted: false,
    isPaused: false,
    isEnded: false,
    runningTime: 0,
    blink: false,
  });

  const start = $(() => {
    state.start = Date.now();
    state.end = 0;
    state.isPaused = false;
    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task
    console.log({ state });

    if (typeof onStart !== "undefined") onStart();
  });

  const stop = $(() => {
    state.isEnded = true;
    state.end = Date.now();
    state.total += state.end - state.start;
    state.start = 0;
    state.status = "STOPPED";
    console.log({ state });

    if (typeof onStop !== "undefined") onStop();
  });

  const resume = $(() => {
    state.isPaused = false;
    if (!state.isStarted || state.isEnded) return;

    state.start = Date.now();
    state.end = 0;
    state.isPaused = false;
    state.isStarted = true;
    state.status = "RUNNING"; // tracked by task
    console.log({ state });
  });

  const pause = $(() => {
    state.isPaused = true;
    if (!state.isStarted || state.isEnded) return;

    state.end = Date.now();
    state.total += state.end - state.start;
    state.start = 0;
    state.status = "STOPPED";

    if (typeof onPause !== "undefined") onPause();
  });

  const reset = $(() => {
    state.total = 0;
    state.start = 0;
    state.end = 0;
    state.isStarted = false;
    state.isEnded = false;
    state.isPaused = false;
    state.status = "STOPPED";
    console.log({ state });

    if (typeof onReset !== "undefined") onReset();
  });


  // onMount:
  useVisibleTask$((taskCtx) => {
    const status = taskCtx.track(() => state.status);
    console.log({ state });

    // no need to set up interval if not started
    if (!state.isStarted) return;

    // when stopping,
    const updateRunningTime = (
      { isStopped }: { isStopped?: boolean } = { isStopped: false }
    ) => {
      state.runningTime = isStopped
        ? state.total
        : state.total + (Date.now() - state.start);
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let blinkId: ReturnType<typeof setInterval> | null = null;

    if (blinkId) clearInterval(blinkId);
    if (intervalId) clearInterval(intervalId);

    if (status === "RUNNING") {
      intervalId = setInterval(() => {
        // wrap in fn because typescript
        updateRunningTime();
      }, 100);
      updateRunningTime(); // run immediately also
    } else if (status === "STOPPED") {
      updateRunningTime({ isStopped: true }); // make sure it's synched with total

      if (state.isPaused) {
        blinkId = setInterval(() => {
          state.blink= !state.blink;
        }, 1000);
        state.blink = true;
      }
    }

    taskCtx.cleanup(() => {
      if (intervalId) clearInterval(intervalId);
      if (blinkId) clearInterval(blinkId);
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
