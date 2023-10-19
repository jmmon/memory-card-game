import {
  Slot,
  $,
  component$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useDebounceObj } from "~/v3/utils/useDebounce";
import Button from "../button/button";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";

/* to get the heights of the contents, could start with open state
 * then can save the height
 *
 * If the content has a further nested dropdown, I guess force them all open?
 *
 *
 * alternates:
 * manually set expandedHeight, but this does NOT account for nested dropdowns!
 *
 * */

const INITIAL_MAX_HEIGHT = 10000;

/*
 * start with it closed (or could be open)
 * it would be nice to hook the bottom of the hidden content to
 * the bottom of the container and modify the container height
 * - That way it slides down/up from behind the button
 *
 * */

const EXTRA_PX = 10;

export default component$(
  ({
    buttonText,
    showOnInit = false,
    transitionTiming = 150,
  }: {
    buttonText: string;
    showOnInit?: boolean;
    transitionTiming?: number;
  }) => {
    const isOpen = useSignal(!showOnInit);
    const debouncedIsOpen = useSignal(!showOnInit);
    const isInitialized = useSignal(false);

    const debounce = useDebounceObj({
      action: $(() => {
        debouncedIsOpen.value = isOpen.value;
      }),
      _delay: transitionTiming,
    });

    const handleToggle$ = $((newValue: boolean) => {
      debounce.setDelay(transitionTiming);
      debounce.setValue(newValue);
    });

    // for the test vz
    const containerRef = useSignal<HTMLElement>();
    const maxExpHeight = useSignal(INITIAL_MAX_HEIGHT);

    // expandedHeight should be dynamic, rather than having
    // to pass in a static value
    //
    // so as the height of the containerRef changes I
    // need to overwrite the max if it's higher?

    // update maxHeight after container finishes opening
    useVisibleTask$(({ track }) => {
      const isDoneOpening = track(() => debouncedIsOpen.value);
      switch (true) {
        // on init, set the height and immediately close.
        // This saves the height and then rerenders as closed (and still uninitialized)
        // Since we change debouncedIsOpen, `track` will run this fn again
        case maxExpHeight.value === INITIAL_MAX_HEIGHT &&
          isInitialized.value === false: {
          maxExpHeight.value =
            (containerRef.value?.offsetHeight || 0) + EXTRA_PX;
          isOpen.value = showOnInit;
          debouncedIsOpen.value = showOnInit;
          return;
        }

        // 2nd runtime will skip above, so this fires:
        // now we have our height so this can run to disable initialization
        // this will cause another rerender, now of the hidden and closed dropdown
        case isInitialized.value === false: {
          isInitialized.value = true;
          return;
        }

        // Finally, tracking the end of the opening animation
        // update the maxHeight when it is open, in case it's dynamic
        case isDoneOpening &&
          maxExpHeight.value - EXTRA_PX !==
            (containerRef.value?.offsetHeight || 0): {
          maxExpHeight.value =
            (containerRef.value?.offsetHeight || 0) + EXTRA_PX;
          return;
        }
      }
    });

    return (
      <div class={`flex flex-col items-center`}>
        <Button
          classes="border-none"
          onClick$={() => {
            isOpen.value = !isOpen.value;
            handleToggle$(isOpen.value);
          }}
          disabled={!isInitialized.value}
        >
          {buttonText}

          <span
            class={`transition-all duration-[${transitionTiming}ms] inline-block ml-2 text-sky-300 ${
              isOpen.value && isInitialized.value
                ? `rotate-[0deg]`
                : `rotate-[180deg]`
            }`}
          >
            <ChevronSvg
              style={{ fill: "#c0c8ff", width: "1em", height: "1em" }}
            />
          </span>
        </Button>

        <div
          ref={containerRef}
          class={`h-auto border-box mx-2 ${
            isInitialized.value
              ? `transition-all ${
                  isOpen.value
                    ? `border-b-2 border-slate-600 pointer-events-auto z-10 opacity-100 ${
                        debouncedIsOpen.value
                          ? `overflow-auto`
                          : `overflow-hidden`
                      }`
                    : "border-transparent pointer-events-none z-0 opacity-80 overflow-hidden"
                }`
              : "pointer-events-none opacity-0 z-0"
          }`}
          style={{
            maxHeight: isOpen.value ? maxExpHeight.value + "px" : "0",
          }}
        >
          <Slot />
        </div>
      </div>
    );
  }
);
