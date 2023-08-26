import type { QwikMouseEvent, PropFunction } from "@builder.io/qwik";
import { component$, $, Slot } from "@builder.io/qwik";

export default component$(
  ({
    isShowing,
    hideModal,
    classes = " bg-slate-600 ",
    bgClasses = "backdrop-blur-sm",
title,
  }: {
    isShowing: boolean;
    hideModal: PropFunction<() => void>;
    classes?: string;
    bgClasses?: string;
title: string;
  }) => {
    const closeModal = $((e: QwikMouseEvent) => {
      // console.log((e.target as HTMLElement).dataset.name);
      if (
        (e.target as HTMLElement).dataset.name === "background" &&
        isShowing
      ) {
        hideModal(); // fn to turn off boolean
      }
    });

    return (
      <div
        class={` ${bgClasses} top-0 left-0 absolute w-full h-full bg-black flex justify-center transition-all duration-300 items-center ${
          isShowing ? "z-[100] bg-opacity-30" : "z-[-10] bg-opacity-0"
        }`}
        data-name="background"
        onClick$={closeModal}
      >
        <div
          class={` text-center ${classes} rounded-3xl flex flex-col gap-1 p-4 lg:p-12 transition-all duration-300 ${
            isShowing
              ? "pointer-events-auto opacity-100 scale-100 z-[100]"
              : "pointer-events-none opacity-0 scale-150 z-[-1]"
          }`}
          data-name="modal"
        >
          <header class="w-full flex justify-between items-center">
            <div></div>
            <h3>{title}</h3>
            <button
              class="border-slate-400 border rounded-lg p-2 transition-all bg-slate-800/90 hover:bg-slate-600"
              onClick$={hideModal}
            >
              X
            </button>
          </header>
          <Slot />
        </div>
      </div>
    );
  }
);
