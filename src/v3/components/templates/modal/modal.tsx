import { component$, $, Slot } from "@builder.io/qwik";

import ModalHeader from "~/v3/components/molecules/modal-header/modal-header";

import type { ClassList, PropFunction } from "@builder.io/qwik";

const DURATION = "duration-[300ms]";
// const IS_SHOWING_DELAY = 50;
const DEFAULT_CONTAINER_BG: ClassList = "bg-slate-600";

type ModalOptions = { detectClickOutside: boolean };

const DEFAULT_OPTIONS: Partial<ModalOptions> = { detectClickOutside: true };

type ModalProps = {
  isShowing: boolean;
  hideModal$: PropFunction<() => void>;
  containerClasses?: ClassList;
  bgClasses?: ClassList;
  bgStyles?: any;
  containerStyles?: any;
  wrapperSyles?: any;
  title: string;
  options?: Partial<ModalOptions>;
};

export default component$<ModalProps>(
  ({
    isShowing,
    hideModal$,
    containerClasses = "",
    bgClasses = "backdrop-blur-sm",
    title,
    bgStyles,
    containerStyles,
    wrapperSyles,
    options = DEFAULT_OPTIONS,
  }) => {
    containerClasses = DEFAULT_CONTAINER_BG + " " + containerClasses;

    const closeModal$ = $((e: MouseEvent) => {
      if (!options.detectClickOutside) return;
      if ((e.target as HTMLElement).dataset.name === "background") {
        hideModal$(); // fn to turn off boolean
      }
    });

    // bg z-index needs to be more than card flip z-index (30) but less than header z-index (50)
    // w-full sm:min-w-[31rem] sm:w-[60vw]
    return (
      <div
        data-name="background"
        class={`top-0 left-0 absolute w-full h-full bg-black flex justify-center items-center transition-all ${DURATION} ${
          isShowing
            ? `pointer-events-auto ${bgClasses} z-[35] bg-opacity-20 `
            : "pointer-events-none z-[-1] bg-opacity-0"
        }`}
        onClick$={closeModal$}
        style={bgStyles}
      >
        <div
          class={`bg-opacity-[98%] shadow-2xl ${containerClasses} min-w-[19rem] w-full sm:w-[80vw] sm:max-w-[32rem] max-h-[80vh] relative mx-auto text-center sm:rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] transition-all ${DURATION} ${
            isShowing
              ? "pointer-events-auto z-[1000] scale-100 opacity-100"
              : "pointer-events-none z-[-1] scale-[120%] opacity-0"
          }`}
          data-name="modal"
          style={containerStyles}
        >
          <ModalHeader hideModal$={hideModal$} title={title} />
          <div class="h-full w-full overflow-y-auto" style={wrapperSyles}>
            <Slot />
          </div>
        </div>
      </div>
    );
  },
);
