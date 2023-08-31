import type {
  PropFunction} from "@builder.io/qwik";
import {
  Slot,
  component$,
  useStylesScoped$,
} from "@builder.io/qwik";
import {  ModalHeader } from "../modal/modal";

export default component$<{
  isShowing: boolean;
  hideModal$: PropFunction<() => void>;
  classes?: string;
  bgClasses?: string;
  bgStyles?: any;
  title: string;
}>(
  ({
    isShowing,
    hideModal$,
    classes = "",
    bgClasses = "backdrop-blur-sm",
    title,
    bgStyles,
  }) => {
    useStylesScoped$(`
    .inverse-modal-container .game {
      /*transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); */
      transition: all 0.3s ease-in-out;

      pointer-events: auto;

      transform-style: preserve-3d;
      perspective: 90vw;
/*       transform-origin: right; */
    }
    .inverse-modal-container.show-settings .game {
/*       transform: scale(1.5) rotateY(90deg) translateX(150%); */
      transform: scale(1.5);
      pointer-events: none;
opacity: 0;
    }

    .inverse-modal-container .settings {
      opacity: 0%;
      transform: scale(0.6);
      transition: all 0.3s ease-in-out;
      pointer-events: none;
    }

    .inverse-modal-container.show-settings .settings {
      opacity: 100%;
      pointer-events: auto;
    }
  `);

    return (
      <div
        class={`inverse-modal-container relative w-full h-full ${isShowing ? "show-settings" : ""}`}
      >
        <div class={`game absolute top-0 left-0 w-full h-full`}>
          <Slot name="mainContent" />
        </div>

        <div
          class={`settings absolute top-0 left-0 w-full h-full flex flex-col gap-1 justify-center items-center`}
        >
          <ModalHeader
            hideModal$={hideModal$}
            buttonOpts={{
              onLeft: false,
              text: "Back",
            }}
            title={title}
          />

          <Slot name="revealedContent" />
        </div>
      </div>
    );
  }
);
