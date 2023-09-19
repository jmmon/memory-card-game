import type { QwikMouseEvent, PropFunction } from "@builder.io/qwik";
import { component$, $, Slot } from "@builder.io/qwik";

const DURATION = "duration-[300ms]";
// const IS_SHOWING_DELAY = 50;
const DEFAULT_CONTAINER_BG = "bg-slate-600";

type ModalOptions = { detectClickOutside: boolean };

const DEFAULT_OPTIONS = { detectClickOutside: true };
export default component$(
  ({
    isShowing = true,
    hideModal$,
    containerClasses = "",
    bgClasses = "backdrop-blur-sm",
    title,
    bgStyles,
    options = DEFAULT_OPTIONS,
  }: {
    isShowing?: boolean;
    hideModal$: PropFunction<() => void>;
    containerClasses?: string;
    bgClasses?: string;
    bgStyles?: any;
    title: string;
    options?: Partial<ModalOptions>;
  }) => {
    containerClasses = DEFAULT_CONTAINER_BG + " " + containerClasses;
    const closeModal$ = $((e: QwikMouseEvent) => {
      if (!options.detectClickOutside) return;
      if ((e.target as HTMLElement).dataset.name === "background") {
        hideModal$(); // fn to turn off boolean
      }
    });

    return (
      <div
        class={`top-0 left-0 absolute w-full h-full bg-black flex justify-center items-center transition-all ${DURATION} ${
          isShowing
            ? `pointer-events-auto ${bgClasses} z-[100] bg-opacity-30 `
            : "pointer-events-none z-[-1] bg-opacity-0"
        }`}
        data-name="background"
        onClick$={closeModal$}
        style={bgStyles}
      >
        <div
          class={`min-w-[16rem] w-[50vw] max-w-max max-h-[90vh] relative mx-auto text-center ${containerClasses} rounded-lg lg:rounded-3xl flex flex-col gap-1 p-[1.5%] transition-all ${DURATION} ${
            isShowing
              ? "pointer-events-auto z-[100]"
              : "pointer-events-none z-[-1]"
          } ${isShowing ? "opacity-100 scale-100" : "opacity-0 scale-[120%]"}`}
          data-name="modal"
        >
          <ModalHeader hideModal$={hideModal$} title={title} />
          <div class="w-full h-full ">
            <Slot />
          </div>
        </div>
      </div>
    );
  }
);

export const CloseButton = ({
  text = "X",
  hideModal$,
}: {
  text?: string;
  hideModal$: PropFunction<() => void>;
}) => (
  <button
    class="text-slate-600 hover:text-slate-400 ml-auto border-slate-400 border rounded-lg py-1.5 px-2 transition-all bg-slate-800/90 hover:bg-slate-600"
    onClick$={hideModal$}
  >
    {text}
  </button>
);

export const ModalHeader = ({
  hideModal$,
  title,
  buttonOpts = { onLeft: false, text: "x" },
}: {
  hideModal$: PropFunction<() => void>;
  title: string;
  buttonOpts?: Partial<{ onLeft?: boolean; text?: string }>;
}) => {
  const button = <CloseButton hideModal$={hideModal$} text={buttonOpts.text} />;

  return (
    <header class="grid max-h-full grid-cols-[0.3fr_1fr_0.3fr] justify-center items-center">
      {buttonOpts.onLeft ? button : <div></div>}
      <h3 class="text-lg text-slate-100">{title}</h3>
      {!buttonOpts.onLeft ? button : <div></div>}
    </header>
  );
};
