import { useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

/**
 * Checks if the body has more height than the window
 *
 * @param defaultVal=false - if you know you need to scroll, can set to true
 * @return bodyScrollable - signal that is true if body has scroll height available
 */
// type HTMLElementWithInnerHeight = HTMLElement & { innerHeight: number };

export const useElementScrollable = function <T extends HTMLElement>(
  elRef: Signal<T | undefined>,
  defaultVal = false
) {
  const isElementScrollable = useSignal<boolean>(defaultVal);

  /** 
   * Sets up a ResizeObserver to watch the element and the parent
   * */
  //eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    console.log("useElementScrollable visTask:", { elRef: elRef.value });
    if (elRef.value) track(() => elRef.value);
    else return;

    const resizeObserver = new ResizeObserver(() => {
      const el = elRef.value as T;
      const parent =
        el.parentElement ? (el.parentElement as HTMLElement & { innerHeight: number }) : window;
      isElementScrollable.value = el.scrollHeight > parent.innerHeight;
      console.log('observed resize:', { isElementScrollable: isElementScrollable.value });
    });

    resizeObserver.observe(elRef.value);
    cleanup(() => elRef.value && resizeObserver.unobserve(elRef.value));
  });

  return isElementScrollable as Readonly<Signal<boolean>>;
};
