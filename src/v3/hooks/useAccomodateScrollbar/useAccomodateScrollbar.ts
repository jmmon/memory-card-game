import { useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { getScrollbarWidth } from "~/v3/utils/getScrollbarWidth";
import type { QRL, Signal } from "@builder.io/qwik";
import useElementScrollable from "../useElementScrollable";

// We will keep track of a list of elements that may have scrollbars
// which sometimes appear, so we're acoomodating the padding for them.
// We want to be able to call this hook to add a new element to the list.
//
// We can return a signal to be used as a ref to point to an element

/**
 * Applies padding equivalent to the width of the scrollbar to both sides, and accommodates for when the scrollbar appears and disappears.
 *
 * @param elRef - the element to track and bee accommodated
 *
 * */
type UpdateFunctionProps = {
  scrollbarWidth: number;
  isElementScrollable: boolean;
};

export function useAccomodateScrollbar<T extends HTMLElement,>(
  elRef: Signal<T | undefined>,
  updateFunction$?: QRL<(props: UpdateFunctionProps) => void>
) {

  console.log('useAccomodateScrollbar', {elRef: elRef?.value});
  const isElementScrollable = useElementScrollable<T>(elRef);
  const scrollbarWidth = useSignal(0);

  useVisibleTask$(({ track }) => {
    if (elRef && elRef.value) track(() => [elRef.value, isElementScrollable.value]);
    else return;

    console.log('useAccomodateScrollbar visTask:', {elRef: elRef.value});

    // run on first time to calculate scrollbar width
    if (scrollbarWidth.value === 0) {
      // runs once after render to initialize
      scrollbarWidth.value = getScrollbarWidth();
      if (elRef.value) {
        elRef.value.style.paddingLeft = `${scrollbarWidth.value}px`;
      }
    }

    if (typeof updateFunction$ !== 'undefined')
      updateFunction$({
        scrollbarWidth: scrollbarWidth.value,
        isElementScrollable: isElementScrollable.value,
      });

    // manually modify body padding
    if (elRef.value) {
      if (isElementScrollable.value) {
        elRef.value.style.paddingRight = "0px";
      } else {
        elRef.value.style.paddingRight = `${scrollbarWidth.value}px`;
      }
    }
  });

  return { scrollbarWidth, isElementScrollable };
}
