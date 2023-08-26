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
          class={` text-center ${classes} rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] lg:p-[2%] transition-all duration-300 ${
            isShowing
              ? "pointer-events-auto opacity-100 scale-100 z-[100]"
              : "pointer-events-none opacity-0 scale-150 z-[-1]"
          }`}
          data-name="modal"
        >
          <header class="w-full grid grid-cols-[0.3fr_1fr_0.3fr] justify-center items-center">
<div></div>
            <h3 class="">{title}</h3>
            <button
              class="ml-auto border-slate-400 border rounded-lg py-1.5 px-2 transition-all bg-slate-800/90 hover:bg-slate-600"
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
