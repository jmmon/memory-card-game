import { component$, $, Slot } from "@builder.io/qwik";

import type { ClassList, QRL } from "@builder.io/qwik";
import Backdrop from "../../pages/backdrop/backdrop";

const DURATION = "duration-[300ms]";
// const IS_SHOWING_DELAY = 50;
const DEFAULT_CONTAINER_BG: ClassList = "bg-slate-600";

type ModalOptions = { detectClickOutside: boolean };

const DEFAULT_OPTIONS: Partial<ModalOptions> = { detectClickOutside: true };

type Props = {
  isShowing: boolean;
  hideModal$: QRL<() => void>;
  containerClasses?: ClassList;
  bgClasses?: ClassList;
  containerStyles?: any;
  wrapperSyles?: any;
  options?: Partial<ModalOptions>;
};

export default component$<Props>(
  ({
    isShowing,
    hideModal$,
    containerClasses,
    bgClasses,
    containerStyles,
    wrapperSyles,
    options = DEFAULT_OPTIONS,
  }) => {
    containerClasses = DEFAULT_CONTAINER_BG + " " + containerClasses;

    const clickBackdrop$ = $((e: MouseEvent) => {
      if (!options.detectClickOutside) return;
      // can't use t directly, have to grab from MouseEvent or else any click will close the modal
      if ((e.target as HTMLElement).getAttribute('data-name') === "backdrop") {
        hideModal$(); // fn to turn off boolean
      }
    });

    // bg z-index needs to be more than card flip z-index (30) but less than header z-index (50)
    return (
      <Backdrop
        isShowing={isShowing}
        bgClasses={`${bgClasses}`}
        onClick={clickBackdrop$}
      >
        <div
          class={`bg-opacity-[98%] shadow-2xl ${containerClasses} min-w-[19rem] w-full sm:w-[80vw] sm:max-w-[32rem] max-h-[80vh] relative mx-auto text-center sm:rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] transition-all ${DURATION} ${
            isShowing
              ? "pointer-events-auto z-10 scale-100 opacity-100"
              : "pointer-events-none z-[-1] scale-[120%] opacity-0"
          }`}
          data-name="modal"
          style={containerStyles}
        >
          <Slot name="header" />

          <div class="h-full w-full overflow-y-auto rounded-lg" style={wrapperSyles}>
            <Slot />
          </div>

          <Slot name="footer" />
        </div>
      </Backdrop>
    );
  },
);
