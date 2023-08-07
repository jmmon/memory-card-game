import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStylesScoped$,
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
const CARD_SHAKE_ANIMATION_DURATION = 600;

type V3CardProps = {
  card: V3Card;
  // flippedCardId: Signal<number>;
  // pairs: Signal<`${number}:${number}`[]>;
  // slotDimensions: Signal<{ width: number; height: number }>;
  // gap: number;
};

export const getXYFromPosition = (position: number, columnCount: number) => ({
  // 23 % 6 = 5; 16 % 6 = 4;
  x: position % columnCount,
  // 23 / 6 = 3.; 16 / 6 = 2.;
  y: Math.floor(position / columnCount),
});

export default component$(({ card }: V3CardProps) => {
  const appStore = useContext(AppContext);

  const isRemoved = useComputed$(() => {
    return appStore.game.successfulPairs
      .reduce((accum: number[], cur) => {
        const [c1, c2] = cur.split(":");
        accum.push(Number(c1), Number(c2));
        return accum;
      }, [])
      .includes(card.id);
  });

  const isRemovedDelayedTrue = useSignal(false);

  useTask$((taskCtx) => {
    taskCtx.track(() => isRemoved.value);
    let timer: ReturnType<typeof setTimeout>;

    if (!isRemoved.value) {
      isRemovedDelayedTrue.value = false;
    } else {
      timer = setTimeout(() => {
        isRemovedDelayedTrue.value = true;
      }, CARD_FLIP_ANIMATION_DURATION);
    }

    taskCtx.cleanup(() => {
      if (timer) clearTimeout(timer);
    });
  });

  const isThisCardFlipped = useComputed$(() => {
    return appStore.game.flippedCardId === card.id;
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

  const coords = useComputed$(() => {
    return getXYFromPosition(card.position, appStore.boardLayout.columns);
  });

  const flipTransform = useComputed$(() => {
    const colsOffsetMax = (appStore.boardLayout.columns - 1) / 2; // 6 => 2.5, 8 => 3.5, 7 => 3
    const rowsOffsetMax = (appStore.boardLayout.rows - 1) / 2;
    const rowHeight = appStore.boardLayout.height / appStore.boardLayout.rows;
    const colWidth = appStore.boardLayout.width / appStore.boardLayout.columns;

    const colRatio = colsOffsetMax - coords.value.x; // depends on COLUMN_COUNT
    const translateX = colWidth * colRatio;

    const rowRatio = rowsOffsetMax - coords.value.y; // depends on ROW_COUNT
    const translateY = rowHeight * rowRatio;

    const isOnLeftSide = coords.value.x < appStore.boardLayout.columns / 2;

    const transform = `translateX(${translateX}px) 
        translateY(${translateY}px) 
        rotateY(${isOnLeftSide ? "" : "-"}180deg) 
        scale(2)`; // maybe should be dynamic depending on screen size??
    // console.log({ transform });
    return transform;
  });

  const rounded = "rounded-[12px]"; // should be based on size, but can't use percent because the shape is rectangular so corners won't be the same
  /* perspective: for 3D effect, adjust based on width, and card area compared to viewport */

  useStylesScoped$(`
    .shake-card {
      animation: shake-card ${CARD_SHAKE_ANIMATION_DURATION}ms;
    }
    @keyframes shake-card {
      0% {
        transform: translateX(0%);
      }
      05% {
        transform: translateX(-5%);  
        box-shadow: 5px 0px 5px 5px rgba(255, 63, 63, 0.4);
      }
      18% {
        transform: translateX(4%);  
        box-shadow: -4px 0px 4px 4px rgba(255, 63, 63, 0.4);
      }
      51% {
        transform: translateX(-3%);  
        box-shadow: 3px 0px 3px 3px rgba(255, 63, 63, 0.4);
      }
      79% {
        transform: translateX(2%);  
        box-shadow: -2px 0px 2px 2px rgba(255, 63, 63, 0.4);
      }
      100% {
        transform: translateX(0%);  
        box-shadow: none;
      }
    }
`);

  const shakeSignal = useSignal(false);

  useTask$((taskCtx) => {
    taskCtx.track(() => card.isMismatched);
    // console.log({ card, isMismatched: card.isMismatched });
    if (!card.isMismatched) return;

    // delay until the animation is over, then start the shake
    let timer1: ReturnType<typeof setTimeout>;

    timer1 = setTimeout(() => {
      // runs when card returns to its place
      shakeSignal.value = true;
      card.isMismatched = false;
    }, CARD_FLIP_ANIMATION_DURATION - 100);

    taskCtx.cleanup(() => {
      timer1 && clearTimeout(timer1);
    });
  });


  useTask$((taskCtx) => {
    taskCtx.track(() => shakeSignal.value);
    // console.log({ card, isMismatched: card.isMismatched });
    if (!shakeSignal.value) return;

    // delay until the animation is over, then start the shake
    let timer1: ReturnType<typeof setTimeout>;

    timer1 = setTimeout(() => {
      shakeSignal.value = false;
    }, CARD_SHAKE_ANIMATION_DURATION);

    taskCtx.cleanup(() => {
      timer1 && clearTimeout(timer1);
    });
  });

  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] flex flex-col justify-center transition-all`}
      style={{
        width: appStore.cardLayout.width + "px",
        height: appStore.cardLayout.height + "px",
        gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
        gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
        zIndex: isThisCardFlipped.value || isBackTextShowing.value ? 20 : 0,
      }}
    >
      <div
        class={`w-[90%] h-[90%] mx-auto [perspective:1400px] bg-transparent border ${rounded} border-gray-50/20 flip-card transition-all ${
          isRemovedDelayedTrue.value &&
          appStore.game.flippedCardId !== card.id &&
          appStore.game.flippedCardId !== card.pairId
            ? "opacity-0 scale-105"
            : "opacity-100 scale-100 cursor-pointer"
        } ${shakeSignal.value === true ? "shake-card" : ""}`}
        data-id={card.id}
      >
        <div
          class={`w-full h-full relative text-center [transform-style:preserve-3d]   [transition-property:transform] ${rounded}`}
          data-id={card.id}
          style={{
            transform: isThisCardFlipped.value ? flipTransform.value : "",
            transitionDuration: CARD_FLIP_ANIMATION_DURATION + "ms",
          }}
        >
          <div
            class={`absolute w-full h-full border-2 border-gray-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden] ${rounded}`}
            data-id={card.id}
          >
            <div
              data-id={card.id}
              data-name="circle"
              class="w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto flex flex-col justify-center items-center"
            >
              <small data-id={card.id} class="block">
                {card.id}
              </small>
              <small
                data-id={card.id}
                class={`text-red block ${
                  card.isMismatched || shakeSignal.value
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                MISMATCH
              </small>
            </div>
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
    </div>
  );
});
