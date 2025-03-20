import type { Signal } from "@builder.io/qwik";
import {
  type PropFunction,
  component$,
  useSignal,
  useStylesScoped$,
  useTask$,
} from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import HEAD_CONSTANTS from "~/v3/constants/head";

export const CARD_FLIP_ANIMATION_DURATION = 800;
export const CARD_FLIP_ANIMATION_DURATION_HALF =
  CARD_FLIP_ANIMATION_DURATION / 2;

export default component$(() => {
  const isFrontShowing = useSignal(false);
  const isRemoved = useSignal(false);

  return (
    <div class="w-full h-full flex flex-col gap-4 items-center ">
      <button
        onClick$={() => {
          isRemoved.value = !isRemoved.value;
          console.log("click, removed now equals", isRemoved.value);
        }}
      >
        {isRemoved.value ? "Unremove Card" : "Remove Card"}
      </button>

      <FlippableCard
        cardText="This is the text of the card"
        handleToggle$={() => {
          isFrontShowing.value = !isFrontShowing.value;
          console.log("flip card, isFrontShowing =", isFrontShowing.value);
        }}
        isFrontShowing={isFrontShowing}
        isRemoved={isRemoved}
      />
    </div>
  );
});

type FlippableCardProps = {
  cardText: string;
  handleToggle$: PropFunction<() => void>;
  isFrontShowing: Signal<boolean>;
  isRemoved: Signal<boolean>;
};

export const FlippableCard = component$(
  ({
    cardText,
    handleToggle$,
    isFrontShowing,
    isRemoved,
  }: FlippableCardProps) => {
    // timer-controlled so text doesn't show in the DOM when back of card is showing
    const isTextShowing = useSignal<boolean>(false);

    useStylesScoped$(`
    /* container, set width/height */
    .flip-card {
      width: 250px;
      height: 400px;
      background-color: transparent; 
      border: 1px solid #f1f1f120;
      border-radius: 10px;
      perspective: 700px; /* for 3D effect, adjust based on width, and card area compared to viewport */

      margin: auto; /* center in frame */
    }

    /* front and back varying styles */
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform ${CARD_FLIP_ANIMATION_DURATION}ms;
      transform-style: preserve-3d;
    }

    /* set up front/back, make backface hidden */
    .flip-card-inner .back,
    .flip-card-inner .front {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid #f1f1f1;

      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;    
    }

    /* front and back varying styles */
    .flip-card-inner .front {
      background-color: #bbb;
      color: black;
      transform: rotateY(180deg);
    }
    .flip-card-inner .back {
      background-color: dodgerblue;
      color: white;
    }

    .flip-card-inner .back .circle {
      border-radius: 50%;
      background-color: #ffffff40;
      width: 100px;
      height: 100px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }


    /* this runs the horizontal flip when we have 'flipped' class added */
    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg) scale(2);
    }

    `);

    useTask$((taskCtx) => {
      taskCtx.track(() => isFrontShowing.value);
      let timer: ReturnType<typeof setTimeout>;

      // when switched to not showing, need to start timer to hide text after 0.4s (half the transition time)
      // duration is ~half the transition time, but adding/subtracting 100ms for margin to make sure the text doesn't show up after the flip
      if (!isFrontShowing.value) {
        timer = setTimeout(() => {
          isTextShowing.value = false;
        }, CARD_FLIP_ANIMATION_DURATION_HALF + 100);
      } else {
        // when switched to showing, should show text immediately
        timer = setTimeout(() => {
          isTextShowing.value = true;
        }, CARD_FLIP_ANIMATION_DURATION_HALF - 100);
      }

      taskCtx.cleanup(() => {
        clearTimeout(timer);
      });
    });

    return (
      <div
        class={`flip-card ${isFrontShowing.value ? "flipped" : ""
          } rounded-md transition-all cursor-pointer ${isRemoved.value ? "opacity-0" : "opacity-100"
          }`}
        onClick$={handleToggle$}
      >
        <div class="flip-card-inner rounded-md">
          <div class={`back  rounded-md`}>
            <div class="circle"></div>
          </div>
          <div class={`front  rounded-md`}>
            <div class={` flex justify-center items-center w-full h-full `}>
              {isTextShowing.value ? cardText : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const head: DocumentHead = {
  title: `v1.5 - ${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "Prototype v1.5 - Flippable cards animations",
    },
  ],
};
