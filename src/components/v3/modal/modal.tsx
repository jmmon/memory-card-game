import type { QwikMouseEvent, PropFunction } from "@builder.io/qwik";
import { component$, $, Slot, useTask$, useSignal } from "@builder.io/qwik";

const DURATION = "duration-[300ms]";
const IS_SHOWING_DELAY = 50;
const DEFAULT_CONTAINER_BG = "bg-slate-600";
export default component$(
  ({
    isShowing,
    hideModal,
    classes = "",
    bgClasses = "backdrop-blur-sm",
    title,
  }: {
    isShowing: boolean;
    hideModal: PropFunction<() => void>;
    classes?: string;
    bgClasses?: string;
    title: string;
  }) => {
    const containerClasses = DEFAULT_CONTAINER_BG + " " + classes;
    const closeModal = $((e: QwikMouseEvent) => {
      // console.log((e.target as HTMLElement).dataset.name);
      if (
        (e.target as HTMLElement).dataset.name === "background" &&
        isShowing
      ) {
        hideModal(); // fn to turn off boolean
      }
    });

    const isShowingDelay = useSignal(isShowing);

    useTask$((taskCtx) => {
      taskCtx.track(() => isShowing);

      const timer = setTimeout(() => {
        isShowingDelay.value = isShowing;
      }, IS_SHOWING_DELAY);

      taskCtx.cleanup(() => {
        clearTimeout(timer);
      });
    });

    return (
      <div
        class={` ${bgClasses} top-0 left-0 absolute w-full h-full bg-black flex justify-center items-center transition-all ${DURATION} ${
          isShowing && isShowingDelay.value
            ? "z-[100] bg-opacity-30"
            : "z-[-10] bg-opacity-0"
        }`}
        data-name="background"
        onClick$={closeModal}
      >
        <div
          class={`min-w-[16rem] w-[40vw] relative mx-auto text-center ${containerClasses} rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] transition-all ${DURATION} ${
            isShowing
              ? "pointer-events-auto z-[100]"
              : "pointer-events-none z-[-1]"
          } ${
            isShowing && !isShowingDelay.value
              ? "scale-100"
              : isShowing && isShowingDelay.value
              ? "opacity-100 scale-100 "
              : !isShowing && isShowingDelay.value
              ? "opacity-0"
              : "opacity-0 scale-[120%]"
          }`}
          data-name="modal"
        >
          <header class="grid max-h-full grid-cols-[0.3fr_1fr_0.3fr] justify-center items-center">
            <div></div>
            <h3 class="text-lg">{title}</h3>
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
