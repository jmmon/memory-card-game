import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import { V3Card } from "../v3-game/v3-game";

/*
 * Card has id, text, flip state
 * parent controls position, width,
 *
 * Should adjust board to fit as many cards as possible/needed
 *
 * "zoom in" effect should scale the card to fill the entire height of the board or of the game (responsive)
 *
 * */

// States:
// external:
// coords: computed depending on grid and position, could come from parent
// flipTransform: depends on the grid; this could be from parent or computed here
//
// internal:
// isRemoved: a computed value, successfulPairs.includes(card.id)
// isThisCardFlipped: computed value, card.id === flippedCardId
// isBackTextShowing: controlled by timer to hide/show backside from the DOM

const CARD_FLIP_ANIMATION_DURATION = 800;
const CARD_FLIP_ANIMATION_DURATION_HALF = 400;

type V3CardProps = {
  card: V3Card;
  // flippedCardId: Signal<number>;
  // pairs: Signal<`${number}:${number}`[]>;
  // slotDimensions: Signal<{ width: number; height: number }>;
  // gap: number;
};

const coords = {
  value: {
    x: 0,
    y: 0,
  },
};

const flipTransform = { value: "" };

export default component$(({ card }: V3CardProps) => {
  const appStore = useContext(AppContext);

  const isRemoved = useComputed$(() => {
    return appStore.successfulPairs
      .reduce((accum: number[], cur) => {
        const [c1, c2] = cur.split(":");
        accum.push(Number(c1), Number(c2));
        return accum;
      }, [])
      .includes(card.id);
  });

  const isThisCardFlipped = useComputed$(() => {
    return appStore.flippedCardId === card.id;
  });

  const isBackTextShowing = useSignal(false);

  useTask$((taskCtx) => {
    taskCtx.track(() => isThisCardFlipped.value);
    let timer: ReturnType<typeof setTimeout>;

    // when switched to not showing, need to start timer to hide text after 0.4s (half the transition time)
    // duration is ~half the transition time, but adding/subtracting 100ms for margin to make sure the text doesn't show up after the flip
    if (!isThisCardFlipped.value) {
      timer = setTimeout(() => {
        isBackTextShowing.value = false;
      }, CARD_FLIP_ANIMATION_DURATION_HALF + 100);
    } else {
      // when switched to showing, should show text immediately
      timer = setTimeout(() => {
        isBackTextShowing.value = true;
      }, CARD_FLIP_ANIMATION_DURATION_HALF - 100);
    }

    taskCtx.cleanup(() => {
      if (timer) clearTimeout(timer);
    });
  });

  const rounded = "rounded-[12px]"; // should be based on size, but can't use percent because the shape is rectangular so corners won't be the same
  /* perspective: for 3D effect, adjust based on width, and card area compared to viewport */
  return (
    <div
      class={` basis-[10%] [perspective:1400px] aspect-[2.25/3.5] m-auto w-full max-w-full h-auto max-h-full bg-transparent border ${rounded} border-gray-50/20 flip-card transition-all ${
        isRemoved.value &&
        appStore.flippedCardId !== card.id &&
        appStore.flippedCardId !== card.pairId
          ? "opacity-0"
          : "opacity-100 cursor-pointer"
      }`}
      data-id={card.id}
      style={{
        // gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
        // gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
        zIndex: isThisCardFlipped.value || isBackTextShowing.value ? 1000 : 0,
      }}
    >
      <div
        class={`w-full h-full relative text-center [transform-style:preserve-3d]   [transition-property:transform]  duration-[${CARD_FLIP_ANIMATION_DURATION}ms] ${rounded}`}
        data-id={card.id}
        style={
          isThisCardFlipped.value
            ? {
                transform: flipTransform.value,
              }
            : ""
        }
      >
        <div
          class={`absolute w-full h-full border-2 border-gray-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden] ${rounded}`}
          data-id={card.id}
        >
          <div
            data-id={card.id}
            class="w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto"
          ></div>
        </div>
        <div
          class={`absolute w-full h-full border-2 border-gray-50 text-black bg-gray-300 [transform:rotateY(180deg)] [backface-visibility:hidden] ${rounded}`}
          data-id={card.id}
        >
          <div
            class={`flex justify-center items-center w-full h-full`}
            data-id={card.id}
          >
            {isBackTextShowing.value ? card.text : ""}
          </div>
        </div>
      </div>
    </div>
  );
});
