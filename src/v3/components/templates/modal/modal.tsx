import { component$, $, Slot } from "@builder.io/qwik";

import ModalHeader from "~/v3/components/molecules/modal-header/modal-header";

import type { PropFunction } from "@builder.io/qwik";

const DURATION = "duration-[300ms]";
// const IS_SHOWING_DELAY = 50;
const DEFAULT_CONTAINER_BG = "bg-slate-600";

type ModalOptions = { detectClickOutside: boolean };

const DEFAULT_OPTIONS = { detectClickOutside: true };

export default component$(
  ({
    isShowing,
    hideModal$,
    containerClasses = "",
    bgClasses = "backdrop-blur-sm",
    title,
    bgStyles,
    options = DEFAULT_OPTIONS,
  }: {
    isShowing: boolean;
    hideModal$: PropFunction<() => void>;
    containerClasses?: string;
    bgClasses?: string;
    bgStyles?: any;
    title: string;
    options?: Partial<ModalOptions>;
  }) => {
    containerClasses = DEFAULT_CONTAINER_BG + " " + containerClasses;

    const closeModal$ = $((e: MouseEvent) => {
      if (!options.detectClickOutside) return;
      if ((e.target as HTMLElement).dataset.name === "background") {
        hideModal$(); // fn to turn off boolean
      }
    });

    return (
      <div
        class={`top-0 left-0 absolute w-full h-full bg-black flex justify-center items-center transition-all ${DURATION} ${isShowing
          ? `pointer-events-auto ${bgClasses} z-[1000] bg-opacity-30 `
          : "pointer-events-none z-[-1] bg-opacity-0"
          }`}
        data-name="background"
        onClick$={closeModal$}
        style={bgStyles}
      >
        <div
          class={`min-w-[19rem] w-[60vw] max-w-[32rem] max-h-[90vh] relative mx-auto text-center ${containerClasses} rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] transition-all ${DURATION} ${isShowing
            ? "pointer-events-auto z-[1000] scale-100 opacity-100"
            : "pointer-events-none z-[-1] scale-[120%] opacity-0"
            }`}
          data-name="modal"
        >
          <ModalHeader hideModal$={hideModal$} title={title} />
          <div class="h-full w-full overflow-y-auto">
            <Slot />
          </div>
        </div>
      </div>
    );
  }
);
