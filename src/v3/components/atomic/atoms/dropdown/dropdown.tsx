import {
  Slot,
  $,
  component$,
  useSignal,
  useVisibleTask$,
  useComputed$,
} from "@builder.io/qwik";
import Button from "../button/button";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";
import useDebounceSignal from "~/v3/hooks/useDebounce";

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

const INITIAL_MAX_HEIGHT = 500;

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
    startAsOpen = false,
    transitionTiming = 400,
  }: {
    buttonText: string;
    startAsOpen?: boolean;
    transitionTiming?: number;
  }) => {
    const isOpen = useSignal(!startAsOpen);
    const debouncedIsOpen = useSignal(!startAsOpen);
    const isInitialized = useSignal(false);

    const { callDebounce: callDebounce } = useDebounceSignal({
      _action$: $(() => {
        debouncedIsOpen.value = isOpen.value;
      }),
      _delay: transitionTiming,
    });

    const containerRef = useSignal<HTMLDivElement>();
    const maxExpandedHeight = useSignal(INITIAL_MAX_HEIGHT);

    /**
     * Updates maxExpandedHeight
     * Runs once on initialization after render, hitting the first case:
     * - Starts as NOT initialized,
     * - meaning the container is open but content is hidden, so we can get the max height
     * - Then re-set the open state (& debounced state) to what it should be (usually closed)
     *
     * This debounced state change will cause a second call of this task, due to tracking
     * So now maxExpandedHeight is not the default so we hit our second case:
     * - All this does is mark it as initialized, and return
     * - (after initialized, the dropdown content should act normally.)
     *
     * Finally, after it is initialized, we are in normal operation.
     * This task updates maxExpandedHeight after the container finishes opening,
     * so the content height may be dynamic
     * So when done opening, and if our maxExpandedHeight is not what it should be, we hit our third case:
     * - simply re-save the maxExpandedHeight (+ extra px)
     * */
    useVisibleTask$(({ track }) => {
      const isDoneOpening = track(() => debouncedIsOpen.value);

      if (
        maxExpandedHeight.value === INITIAL_MAX_HEIGHT &&
        isInitialized.value === false
      ) {
        maxExpandedHeight.value =
          (containerRef.value?.offsetHeight || 0) + EXTRA_PX;
        isOpen.value = startAsOpen;
        debouncedIsOpen.value = startAsOpen;
        return;
      }

      if (isInitialized.value === false) {
        isInitialized.value = true;
        return;
      }

      if (
        isDoneOpening &&
        maxExpandedHeight.value !==
          (containerRef.value?.offsetHeight || 0) - EXTRA_PX
      ) {
        maxExpandedHeight.value =
          (containerRef.value?.offsetHeight || 0) + EXTRA_PX;
        return;
      }
    });

    const computedContainerClasses = useComputed$(() => {
      return !isInitialized.value
        ? "pointer-events-none opacity-0 z-0 border-transparent"
        : `border-b-2 ${
            isOpen.value
              ? `border-slate-600 pointer-events-auto z-10 opacity-100 ${
                  debouncedIsOpen.value ? `overflow-auto` : `overflow-hidden`
                }`
              : "border-transparent pointer-events-none z-0 opacity-80 overflow-hidden"
          } transition-all`;
    });

    // const after = `after:transition-all after:content-[" "] after:bg-slate-200 after:border-rounded after:block after:w-full after:h-1 after:relative after:bottom-0 after:left-0 after:right-0`
    // const computedContainerClasses = useComputed$(() => {
    //   return !isInitialized.value
    //     ? "pointer-events-none opacity-0 z-0"
    //     : `${
    //         isOpen.value
    //           ? `pointer-events-auto z-10 opacity-100 ${
    //               debouncedIsOpen.value ? `overflow-auto` : `overflow-hidden`
    //             }`
    //           : "pointer-events-none z-0 opacity-80 overflow-hidden"
    //       } transition-all`;
    // });
    return (
      <div
        class={`flex flex-col items-center`}
      >
        <Button
          classes="border-none"
          onClick$={() => {
            isOpen.value = !isOpen.value;
            callDebounce();
          }}
          disabled={!isInitialized.value}
        >
          {buttonText}

          <span
            class={`transition-all inline-block ml-2 text-sky-300 ${
              isOpen.value && isInitialized.value
                ? `rotate-[0deg]`
                : `rotate-[180deg]`
            }`}
            style={{ transitionDuration: transitionTiming + "ms" }}
          >
            <ChevronSvg
              style={{ fill: "#c0c8ff", width: "1em", height: "1em" }}
            />
          </span>
        </Button>

        {/* content container */}
        <div
          ref={containerRef}
          class={`relative h-auto border-box mx-2 ${computedContainerClasses.value}`}
          style={{
            maxHeight: isOpen.value ? maxExpandedHeight.value + "px" : "0",
            transitionDuration: isInitialized.value
              ? transitionTiming + "ms"
              : "0ms",
          }}
        >
          <Slot />
        </div>
      </div>
    );
  }
);
