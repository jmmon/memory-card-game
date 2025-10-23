import type {
  CSSProperties} from "@builder.io/qwik";
import {
  component$,
  useSignal,
  Slot,
  type ClassList,
  $,
  type Signal,
  type QRL,
  useComputed$,
  useVisibleTask$
} from "@builder.io/qwik";
import Button from "~/v3/components/atoms/button/button";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";
import { FONT_SIZES } from "~/v3/constants/styles";

type DropdownProps = {
  buttonText?: string;
  buttonClasses?: ClassList;
  buttonClassesWhileOpen?: ClassList;
  buttonStyles?: CSSProperties;
  contentClasses?: ClassList;
  transitionTiming?: number;
  wrapperClasses?: ClassList;
  clearFocusOnClose?: boolean;
} & ({
  startAsOpen?: undefined;
  isOpen: Signal<boolean>;
  onClick$: QRL<() => void>;
} | {
  startAsOpen?: boolean;
  isOpen?: undefined;
  onClick$?: undefined;
});

type InteractiveElements = HTMLElementTagNameMap["button" | "input" | "a" | "select" | "textarea" | "area"];

const Dropdown = component$<DropdownProps>(
  ({
    buttonText,
    buttonClasses,
    buttonClassesWhileOpen,
    buttonStyles,
    contentClasses,
    startAsOpen = false,
    transitionTiming = 400,
    wrapperClasses,
    clearFocusOnClose = true,
    isOpen,
    onClick$,
  }) => {
    const _isOpen = useSignal(startAsOpen);
    const contentContainerRef = useSignal<HTMLDivElement>();
    const buttonRef = useSignal<HTMLButtonElement>();

    const handleChangeTabIndex = $((_isOpen: boolean) => {
      // prevent tab focus when dropdown content is hidden
      contentContainerRef.value
        ?.querySelectorAll("button, input, a, select, textarea, area")
        .forEach((input) => {
          (input as InteractiveElements).tabIndex = _isOpen ? 0 : -1;
        });
    });

    const handleToggle = $((shouldOpen: boolean) => {
      _isOpen.value = shouldOpen;
      handleChangeTabIndex(shouldOpen);

      if (!shouldOpen && clearFocusOnClose) {
        buttonRef.value?.blur();
      }
    });

    // set initital tab index for closed
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      handleChangeTabIndex(false);
    });

    const computedIsOpen = useComputed$(() =>
      isOpen !== undefined ? isOpen.value : _isOpen.value,
    );

    return (
      <div
        class={`transition-all flex flex-col ${FONT_SIZES.SMALL} items-center w-full ${wrapperClasses}`}
        data-label="wrapper"
      >
        <Button
          buttonRef={buttonRef}
          styles={buttonStyles}
          class={`z-10 border-none flex items-center justify-center ${buttonClasses} ${computedIsOpen.value ? buttonClassesWhileOpen : ""}`}
          onClick$={() => {
            onClick$?.(); // if acting as controlled component
            handleToggle(!computedIsOpen.value);
          }}
        >
          {buttonText ?? ""}
          <Slot name="button" />
          <span
            class={`transition-all ml-2 text-slate-300`}
          >
            <ChevronSvg style={{
              transitionDuration: transitionTiming + "ms",
              width: "1em",
              height: "1em",
              transform: `rotate(${computedIsOpen.value ? "0" : "180"}deg)`
            }} />
          </span>
        </Button>

        <div
          aria-open={isOpen && isOpen.value}
          class={`grid grid-rows-[0fr] w-full transition-all bg-transparent ${
            computedIsOpen.value ? "grid-rows-[1fr]" : ""
          }`}
          style={{
            transitionDuration: transitionTiming + "ms",
          }}
        >
          <div
            data-label="dropdown-content"
            ref={contentContainerRef}
            class={`overflow-hidden transition-all border-box rounded-lg border-l border-b border-transparent ${
              computedIsOpen.value
                ? "shadow-inner-2 border-l-slate-500 border-b-slate-500 opacity-100 scale-[1]"
                : "opacity-20 scale-[0.95] translate-y-[-0.25rem]"
            } ${contentClasses}`}
            style={{
              transitionDuration: transitionTiming + "ms",
            }}
          >
            <Slot />
          </div>
        </div>
      </div>
    );
  },
);

export default Dropdown;
