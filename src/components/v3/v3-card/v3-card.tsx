import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStylesScoped$,
  useTask$,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import type { BoardLayout, CardLayout, V3Card } from "../v3-game/v3-game";
import { CARD_SHUFFLE_DURATION } from "../v3-board/v3-board";
import { getCardsArrayFromPairs } from "../utils/v3CardUtils";

const ENLARGED_CARD_SCALE_VS_BOARD = 0.8;

const CARD_FLIP_ANIMATION_DURATION = 800;
const CARD_SHAKE_ANIMATION_DURATION = 700;

// underside shows immediately, but hides after this duration
const HIDE_UNDERSIDE_TIMER_RATIO = 75 / 10;
// if matching, delay return animation by this amount0;
const FLIPPED_DELAYED_OFF_DURATION_MS = 250;
// higher means shake starts sooner
const CARD_SHAKE_ANIMATION_START_LESS_DURATION_MS = 350;

type Coords = { x: number; y: number };

/*
 * getXYFromPosition
 * takes position (card slot index) and calculates board coordinates x and y coords
 * // e.g. 23 % 6 = 5; 16 % 6 = 4;
 * // e.g. 23 / 6 = 3.; 16 / 6 = 2.;
 * */
export const getXYFromPosition = (position: number, columnCount: number) => ({
  x: position % columnCount,
  y: Math.floor(position / columnCount),
});

/*
 * generateShuffleTransform
 * using old and new coords, create transform to make the move
 * applied instantly when shuffling, then transition is reverted over time to end up in the new position
 *
 * e.g. 0, 1, 2, 3 columns, new = 3; prev = 0
 * prev - new = -3 columns from new position back to old position
 * -3 columns * columnWidth = px
 * */
const generateShuffleTransform = (
  boardLayout: BoardLayout,
  prevCoords: Coords,
  newCoords: Coords
) => {
  const colWidth = boardLayout.width / boardLayout.columns;
  const rowHeight = boardLayout.height / boardLayout.rows;
  const translateX = (prevCoords.x - newCoords.x) * colWidth;
  const translateY = (prevCoords.y - newCoords.y) * rowHeight;
  // console.log({
  //   prevCoords,
  //   newCoords,
  //   translateX,
  //   translateY,
  //   colWidth,
  //   rowHeight,
  // });

  return `translateX(${translateX}px) 
      translateY(${translateY}px)`;
};

const buildTransformToCenter = (
  totalSlots: number,
  currentPosition: number,
  slotWidthPx: number
) => {
  const maximumSlotsToTransverse = (totalSlots - 1) / 2;
  const slotsToTransverse = maximumSlotsToTransverse - currentPosition;
  const translatePx = slotWidthPx * slotsToTransverse;
  return translatePx;
};

/*
 * generateFlipTransform
 * uses positioning and layouts to calculate transform required to flip card over and land in the center, scaled up.
 * numOfColsToTransverseMax e.g. 6cols => 2.5, 8cols => 3.5, 7cols => 3
 * */
const generateFlipTransform = (
  boardLayout: BoardLayout,
  cardLayout: CardLayout,
  newCoords: Coords
) => {
  const rowHeight = boardLayout.height / boardLayout.rows;
  const colWidth = boardLayout.width / boardLayout.columns;

  const isOnLeftSide = newCoords.x < boardLayout.columns / 2;

  // const numOfColsToTransverse_max = (boardLayout.columns - 1) / 2;
  // const colsToTransverse = numOfColsToTransverse_max - newCoords.x;
  // const translateXPx = colWidth * colsToTransverse;
  const translateXPx = buildTransformToCenter(
    boardLayout.columns,
    newCoords.x,
    colWidth
  );

  // const numOfRowsToTransverse_max = (boardLayout.rows - 1) / 2;
  // const rowsToTransverse = numOfRowsToTransverse_max - newCoords.y;
  // const translateYPx = rowHeight * rowsToTransverse;
  const translateYPx = buildTransformToCenter(
    boardLayout.rows,
    newCoords.y,
    rowHeight
  );

  // calculate scale
  const maxPxW = boardLayout.width * ENLARGED_CARD_SCALE_VS_BOARD;
  const maxPxH = boardLayout.height * ENLARGED_CARD_SCALE_VS_BOARD;
  // get ratio of card to board
  const ratioW = maxPxW / cardLayout.width;
  const ratioH = maxPxH / cardLayout.height;
  const scale = Math.min(ratioW, ratioH);

  return `translateX(${translateXPx}px) 
      translateY(${translateYPx}px) 
      rotateY(${isOnLeftSide ? "" : "-"}180deg) 
      scale(${scale})`;
};

export default component$(({ card }: { card: V3Card }) => {
  const appStore = useContext(AppContext);

  // break matches into cards, and see if our card is included
  const isRemoved = useComputed$(() => {
    return getCardsArrayFromPairs(appStore.game.successfulPairs).includes(
      card.id
    );
  });

  // delayed indicator, turns true once the flipped card returns to the board
  const isRemovedDelayedTrue = useSignal(false);

  // when card is removed, trigger our isRemovedDelayedTrue
  // after card has enough time to return to the board
  useTask$((taskCtx) => {
    taskCtx.track(() => isRemoved.value);
    let timer: ReturnType<typeof setTimeout>;

    if (isRemoved.value === false) {
      isRemovedDelayedTrue.value = false;
    } else {
      timer = setTimeout(() => {
        isRemovedDelayedTrue.value = true;
      }, CARD_FLIP_ANIMATION_DURATION);
    }

    taskCtx.cleanup(() => {
      clearTimeout(timer);
    });
  });

  // is our card the flipped card?
  const isCardFlipped = useComputed$(() => {
    return appStore.game.flippedCardId === card.id;
  });

  // show and hide the back face, so the backs of cards can't be inspected when face-down
  const isUnderSideShowing = useSignal(false);
  const isCardFlippedDelayedOff = useSignal(false);

  // runs when a card is flipped
  useTask$((taskCtx) => {
    taskCtx.track(() => isCardFlipped.value);

    // when showing the back side, partway through we reveal the back side.
    // when going back to the board, partway through we hide the back side.

    let revealDelayTimer: ReturnType<typeof setTimeout>;
    let flippedDelayTimer: ReturnType<typeof setTimeout>;
    if (isCardFlipped.value) {
      // when showing card
      isUnderSideShowing.value = isCardFlipped.value;
      isCardFlippedDelayedOff.value = isCardFlipped.value;
    } else {
      // when hiding card, keep the underside visible for a while
      revealDelayTimer = setTimeout(() => {
        isUnderSideShowing.value = isCardFlipped.value;
      }, CARD_FLIP_ANIMATION_DURATION * HIDE_UNDERSIDE_TIMER_RATIO);

      flippedDelayTimer = setTimeout(() => {
        isCardFlippedDelayedOff.value = isCardFlipped.value;
      }, FLIPPED_DELAYED_OFF_DURATION_MS);
    }

    taskCtx.cleanup(() => {
      clearTimeout(revealDelayTimer);
      clearTimeout(flippedDelayTimer);
    });
  });

  // so when shuffling, position is updated so card is moved immediately.
  // We should calculate the transition from prevPosition => position as the position is updated.
  // NOW I have the transition.
  // - INVERSE the transition immediately so to move the card backward to prevPosition.
  // - apply transition-duration
  // - turn off transition so it moves forward (remove the class/props)

  const shuffleTransform = useSignal("");
  const flipTransform = useSignal("");

  // shuffling will change the card position, causing this to run
  // calc & save prev/cur grid coords from that card position;
  const coords = useComputed$(() => {
    const prevCoords = getXYFromPosition(
      card.prevPosition ?? 0,
      appStore.boardLayout.columns
    );
    const newCoords = getXYFromPosition(
      card.position,
      appStore.boardLayout.columns
    );

    shuffleTransform.value = generateShuffleTransform(
      appStore.boardLayout,
      prevCoords,
      newCoords
    );
    flipTransform.value = generateFlipTransform(
      appStore.boardLayout,
      appStore.cardLayout,
      newCoords
    );
    return newCoords;
  });

  useStylesScoped$(`
    .shake-card {
      animation: shake-card ${CARD_SHAKE_ANIMATION_DURATION}ms;
    }

    @keyframes shake-card {
      0% {
        transform: translateX(0%);
      }
      10% {
        transform: translateX(-7%);  
        box-shadow: 5px 0px 5px 5px rgba(255, 63, 63, 0.5);
      }
      23% {
        transform: translateX(5%);  
        box-shadow: -4px 0px 4px 4px rgba(255, 63, 63, 0.4);
      }
      56% {
        transform: translateX(-3%);  
        box-shadow: 3px 0px 3px 3px rgba(255, 63, 63, 0.3);
      }
      84% {
        transform: translateX(1%);  
        box-shadow: -2px 0px 2px 2px rgba(255, 63, 63, 0.2);
      }
      100% {
        transform: translateX(0%);  
        box-shadow: 1px 0px 1px 1px rgba(255, 63, 63, 0.1);
      }
    }
  `);

  const shakeSignal = useSignal(false);

  // handle turn on shake animation (after card is set back down animation)
  useTask$((taskCtx) => {
    taskCtx.track(() => card.isMismatched);
    // continue only if card is mismatched
    if (card.isMismatched === false) return;

    // delay until the animation is over, then start the shake
    // turn on shake after duration (once card returns to its spaces)
    const timeout = setTimeout(() => {
      card.isMismatched = false;
      shakeSignal.value = true;
    }, CARD_FLIP_ANIMATION_DURATION - CARD_SHAKE_ANIMATION_START_LESS_DURATION_MS);

    taskCtx.cleanup(() => {
      clearTimeout(timeout);
    });
  });

  // handle turn off shake animation
  useTask$((taskCtx) => {
    taskCtx.track(() => shakeSignal.value);
    if (shakeSignal.value === false) return;

    // delay until the animation is over, then start the shake
    // turn off shake after duration
    const timeout = setTimeout(() => {
      shakeSignal.value = false;
    }, CARD_SHAKE_ANIMATION_DURATION);

    taskCtx.cleanup(() => {
      clearTimeout(timeout);
    });
  });

  /* perspective: for 3D effect, adjust based on width, and card area compared to viewport */

  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] flex flex-col justify-center   ${
        appStore.game.isShufflingDelayed
          ? // delayedTransitionSignal.value
            `[transition-duration:${CARD_SHUFFLE_DURATION}ms] transition-[transform]`
          : ""
      }`}
      style={{
        width: appStore.cardLayout.width + "px",
        height: appStore.cardLayout.height + "px",
        gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
        gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
        zIndex: isCardFlipped.value
          ? 20 // applies while card is being flipped up but not while being flipped down
          : isUnderSideShowing.value
          ? 10 // applies starting halfway in flip up, and ending halfway in flip down
          : 0, // applies otherwise (when face down);
        borderRadius: appStore.cardLayout.roundedCornersPx + "px",

        // do transform immediately when starting shuffling
        transitionProperty: "transform",
        transform:
          (appStore.game.isShuffling && appStore.game.isShufflingDelayed) ||
          !appStore.game.isShuffling
            ? ""
            : shuffleTransform.value,

        transitionDuration: appStore.game.isShufflingDelayed
          ? CARD_SHUFFLE_DURATION + "ms"
          : "0ms",

        // transform:
        //   (delayedTransitionSignal.value && appStore.game.isShuffling) ||
        //   !appStore.game.isShuffling
        //     ? ""
        //     : shuffleTransform.value,
        //
        // // apply duration AFTER the initial transform is complete
        // transitionDuration: delayedTransitionSignal.value
        //   ? CARD_SHUFFLE_DURATION + "ms"
        //   : "0ms",
      }}
    >
      <div
        class={`w-[90%] h-[90%] mx-auto [perspective:1800px] bg-transparent border border-slate-50/20 flip-card transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ${
          // isRemovedDelayedTrue.value &&
          isRemoved.value &&
          appStore.game.flippedCardId !== card.id &&
          appStore.game.flippedCardId !== card.pairId
            ? "opacity-0 scale-[107%]"
            : "opacity-100 cursor-pointer"
        } ${shakeSignal.value === true ? "shake-card" : ""}`}
        style={{
          borderRadius: appStore.cardLayout.roundedCornersPx + "px",
        }}
        data-id={card.id}
      >
        <div
          class={`w-full h-full relative text-center [transform-style:preserve-3d] [transition-property:transform]`}
          data-id={card.id}
          style={{
            transform:
              isCardFlipped.value ||
              (isRemoved.value && isCardFlippedDelayedOff.value)
                ? flipTransform.value
                : "",
            transitionDuration: CARD_FLIP_ANIMATION_DURATION + "ms",
            transitionTimingFunction: "cubic-bezier(0.2, 1.285, 0.32, 1.075)",
            borderRadius: appStore.cardLayout.roundedCornersPx + "px",
          }}
        >
          <div
            class={`absolute w-full h-full border-2 border-slate-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden]`}
            data-id={card.id}
            style={{
              borderRadius: appStore.cardLayout.roundedCornersPx + "px",
            }}
          >
            <div
              data-id={card.id}
              data-name="circle"
              class="w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto flex flex-col justify-center items-center"
            >
              {/* <span data-id={card.id} class="block text-amber-200"> */}
              {/*   {card.id} */}
              {/* </span> */}

              {/* <small */}
              {/*   data-id={card.id} */}
              {/*   class={`text-red block ${ */}
              {/*     card.isMismatched || shakeSignal.value */}
              {/*       ? "opacity-100" */}
              {/*       : "opacity-0" */}
              {/*   }`} */}
              {/* > */}
              {/*   MISMATCH */}
              {/* </small> */}
            </div>
          </div>
          <div
            class={`absolute w-full border border-white h-full flex justify-center items-center text-black bg-slate-300 [transform:rotateY(180deg)] [backface-visibility:hidden] `}
            data-id={card.id}
            style={{
              borderRadius: appStore.cardLayout.roundedCornersPx + "px",
            }}
          >
            {isUnderSideShowing.value &&
              (card.image ? (
                <img
                  width="25"
                  height="35"
                  src={card.image}
                  class="w-full h-full"
                />
              ) : (
                <div
                  // class={`flex justify-center items-center w-full h-full`}
                  data-id={card.id}
                >
                  {card.text}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
});
