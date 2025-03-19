import { component$, useStyles$, useSignal, Slot, useVisibleTask$ } from "@builder.io/qwik";
import Button from "~/v3/components/atoms/button/button";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";

export default component$(
  ({
    buttonText,
    buttonClasses,
    startAsOpen = false,
    transitionTiming = 400,
  }: {
    buttonText: string;
    buttonClasses?: string;
    startAsOpen?: boolean;
    transitionTiming?: number;
  }) => {
    const isOpen = useSignal(startAsOpen);
    const containerRef = useSignal<HTMLDivElement>();

    // prevent tab focus when dropdown content is hidden
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => isOpen.value);

      containerRef.value?.querySelectorAll('input')?.forEach((input) => {
        input.tabIndex = isOpen.value ? 0 : -1;
      });
    });

    useStyles$(`
    .dropdown-grid-container {
      display: grid;
      grid-template-rows: 0fr;
    }
    .dropdown-grid-container.is-open {
      grid-template-rows: 1fr;
    }
    .dropdown-grid-content {
      overflow: hidden;
    }
    `);


    return (
      <div class={`flex flex-col items-center`}>
        <Button
          q:slot="button"
          classes={`border-none ${buttonClasses}`}
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
          class={`dropdown-grid-container w-full transition-all ${isOpen.value ? "is-open" : ""
            }`}
          style={{
            transitionDuration: transitionTiming + "ms",
          }}
        >
          <div
            ref={containerRef}
            class={` dropdown-grid-content transition-all border-box border-b-2 ${isOpen.value
              ? "border-slate-600 opacity-100 scale-[1]"
              : "border-transparent opacity-20 scale-[0.95]"
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
