import { useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

/**
 * Checks if the body has more height than the window
 *
 * @param defaultVal=false - if you know you need to scroll, can set to true
 * @return bodyScrollable - signal that is true if body has scroll height available
 */
export const useElementScrollable = function <T extends HTMLElement>(
  elRef: Signal<T | undefined>,
  defaultVal = false
) {
  // console.log('useElementScrollable', {elRef: elRef?.value});
  const isElementScrollable = useSignal<boolean>(defaultVal);

  useVisibleTask$(({ track, cleanup }) => {
    console.log("useElementScrollable visTask:", { elRef: elRef.value });
    if (elRef && elRef.value) track(() => elRef?.value);
    else return;

    // if (typeof elRef.value === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      const el = elRef.value ?? document.body;
      const parent =
        (el.parentElement as HTMLElement & { innerHeight: number }) ?? window;
      isElementScrollable.value = el.scrollHeight > parent.innerHeight;
      console.log('observed resize:', { isElementScrollable: isElementScrollable.value });
    });

    resizeObserver.observe(elRef.value ?? document.body);

    cleanup(() => resizeObserver.unobserve(elRef.value ?? document.body));
  });

  return isElementScrollable as Readonly<Signal<boolean>>;
};
