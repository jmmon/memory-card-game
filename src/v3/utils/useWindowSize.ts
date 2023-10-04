import { useStore, $, useOnWindow, useVisibleTask$ } from "@builder.io/qwik";

type WindowSize = { innerWidth: number; innerHeight: number };

const DEFAULT_OPTS = {
  innerWidth: 500,
  innerHeight: 400,
};

export const useWindowSize = (opts?: Partial<WindowSize>) => {
  const windowSize = useStore<WindowSize>({ ...DEFAULT_OPTS, ...opts });

  // helper function
  const setWindowSize = $(() => {
    windowSize.innerWidth = window.innerWidth;
    windowSize.innerHeight = window.innerHeight;
  });

  // init
  useVisibleTask$(setWindowSize);

  // resize
  useOnWindow("resize", setWindowSize);

  return windowSize;
};
