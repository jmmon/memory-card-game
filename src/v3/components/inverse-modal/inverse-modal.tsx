import type { PropFunction } from "@builder.io/qwik";
import { Slot, component$, useStylesScoped$ } from "@builder.io/qwik";
import { ModalHeader } from "../modal/modal";

export default component$<{
  isShowing: boolean;
  hideModal$: PropFunction<() => void>;
  title: string;
settingsClasses?: string;
  direction: "left" | "right" | "top" | "bottom";

  // | "top left"
  // | "top right"
  // | "bottom left"
  // | "bottom right";
}>(({ isShowing, hideModal$, title, direction, settingsClasses }) => {
  useStylesScoped$(`
    .inverse-modal-container {
      background-color: black;
      --percent: ${120}%;
      --negativePercent: -${120}%;
      --scale: 0.6;
    }

    .inverse-modal-container .game {
      transition: all 0.3s cubic-bezier(0.25, 1.175, 0.5, 1.08);
/*       transition: all 0.3s ease-out; */


      pointer-events: auto;

      transform-style: preserve-3d;
      perspective: 90vw;
/*       transform-origin: right; */
    }


    .top {
      --transform: scale(var(--scale)) translateY(var(--percent)); 
    }
    .right {
      --transform: scale(var(--scale)) translateX(var(--percent)); 
    }
    .bottom {
      --transform: scale(var(--scale)) translateY(var(--negativePercent)); 
    }
    .left {
      --transform: scale(var(--scale)) translateX(var(--negativePercent)); 
    }

    .top-left {
    }
    .top-right {
    }
    .bottom-left {
    }
    .bottom-right {
    }

    .inverse-modal-container.show-settings .game {
      transform: var(--transform);
/*       transform: scale(var(--scale)); */
      pointer-events: none;
      opacity: 0;
    }


    .inverse-modal-container .settings {
      opacity: 0%;
      transform: scale(0.6);

/*       transition: all 0.3s ease-out; */
      transition: all 0.3s cubic-bezier(0.25, 1.175, 0.5, 1.08);
      pointer-events: none;
    }


    .inverse-modal-container.show-settings .settings {
      transform: scale(1);
      opacity: 100%;
      pointer-events: auto;
    }
  `);

  return (
    <div
      class={`inverse-modal-container relative w-full h-full ${
        isShowing ? "show-settings" : ""
      }`}
    >
      <div class={`${direction} game absolute top-0 left-0 w-full h-full`}>
        <Slot name="mainContent" />
      </div>

      <div
        class={`${settingsClasses} settings absolute top-0 left-0 w-full h-full flex flex-col gap-1 justify-center items-center`}
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
});
