import { component$, useSignal, Slot, useVisibleTask$, type ClassList } from "@builder.io/qwik";
import Button from "~/v3/components/atoms/button/button";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";

type DropdownProps = {
  buttonText: string;
  buttonClasses?: ClassList;
  buttonClassesWhileOpen?: ClassList;
  startAsOpen?: boolean;
  transitionTiming?: number;
  wrapperClasses?: ClassList;
  clearFocusOnClose?: boolean;
}

export default component$<DropdownProps>(
  ({
    buttonText,
    buttonClasses,
    buttonClassesWhileOpen,
    startAsOpen = false,
    transitionTiming = 400,
    wrapperClasses,
    clearFocusOnClose = false,
  }) => {
    const isOpen = useSignal(startAsOpen);
    const contentContainerRef = useSignal<HTMLDivElement>();
    const buttonRef = useSignal<HTMLButtonElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => isOpen.value);

      // prevent tab focus when dropdown content is hidden
      contentContainerRef.value?.querySelectorAll('input').forEach((input) => {
        input.tabIndex = isOpen.value ? 0 : -1;
      });

      if (!clearFocusOnClose) return;
      if (!isOpen.value) {
        buttonRef.value?.blur();
      }
    });

    return (
      <div class={`flex flex-col items-center w-full ${wrapperClasses}`}>
        <Button
          buttonRef={buttonRef}
          classes={`border-none ${buttonClasses} ${isOpen.value ? buttonClassesWhileOpen : ""}`}
          onClick$={() => {
            isOpen.value = !isOpen.value;
          }}
        >
          {buttonText}
          <span
            class={`transition-all inline-block ml-2 text-sky-300 ${isOpen.value ? `rotate-[0deg]` : `rotate-[180deg]`
              }`}
            style={{ transitionDuration: transitionTiming + "ms" }}
          >
            <ChevronSvg
              style={{ fill: "#c0c8ff", width: "1em", height: "1em" }}
            />
          </span>
        </Button>

        <div
          aria-open={isOpen.value}
          class={`grid grid-rows-[0fr] w-full transition-all ${isOpen.value ? "grid-rows-[1fr]" : ""
            }`}
          style={{
            transitionDuration: transitionTiming + "ms",
          }}
        >
          <div
            ref={contentContainerRef}
            class={`overflow-hidden transition-all border-box rounded-lg border-l border-b border-transparent ${isOpen.value
              ? "shadow-inner-2 border-l-slate-500 border-b-slate-500 opacity-100 scale-[1]"
              : "opacity-20 scale-[0.95]"
              }`}
            style={{
              transitionDuration: transitionTiming + "ms",
            }}
          >
            <Slot />
          </div>
        </div>
      </div>
    );
  }
);
