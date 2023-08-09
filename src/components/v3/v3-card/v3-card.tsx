import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStylesScoped$,
  useTask$,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import { Pair, V3Card } from "../v3-game/v3-game";

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
const CARD_SHUFFLE_DURATION = 1000;

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

const getCardsArrayFromPairsReduce = (accum: number[], cur: Pair) => {
  const [c1, c2] = cur.split(":");
  accum.push(Number(c1), Number(c2));
  return accum;
};

const getCardsArrayFromPairs = (arr: Pair[]) => {
  return arr.reduce(getCardsArrayFromPairsReduce, []);
};

export default component$(({ card }: V3CardProps) => {
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
      if (timer) clearTimeout(timer);
    });
  });

  // is our card the flipped card?
  const isThisCardFlipped = useComputed$(() => {
    return appStore.game.flippedCardId === card.id;
  });

  // show and hide the back face, so the backs of cards can't be inspected when face-down
  const isUnderSideShowing = useSignal(false);

  // runs when a card is flipped
  useTask$((taskCtx) => {
    taskCtx.track(() => isThisCardFlipped.value);
    let revealDelayTimer: ReturnType<typeof setTimeout>;
    const durationRatio = 50 / 100;

    // when showing the back side, partway through we reveal the back side.
    // when going back to the board, partway through we hide the back side.
    revealDelayTimer = setTimeout(() => {
      isUnderSideShowing.value = isThisCardFlipped.value;
    }, CARD_FLIP_ANIMATION_DURATION_HALF + (isThisCardFlipped.value ? -1 : 1) * CARD_FLIP_ANIMATION_DURATION_HALF * durationRatio);

    taskCtx.cleanup(() => {
      if (revealDelayTimer) clearTimeout(revealDelayTimer);
    });
  });

  // so when shuffling, position is updated so card is moved immediately.
  // We should calculate the transition from prevPosition => position as the position is updated.
  // NOW I have the transition.
  // - INVERSE the transition immediately so to move the card backward to prevPosition.
  // - apply transition-duration
  // - turn off transition so it moves forward (remove the class/props)

  const shuffleTransform = useSignal("");

  // shuffle will change the card position, causing this to run
  // get grid coords from that card position;
  const coords = useComputed$(() => {
    const prevCoords = getXYFromPosition(
      card.prevPosition ?? 0,
      appStore.boardLayout.columns
    );
    const newCoords = getXYFromPosition(
      card.position,
      appStore.boardLayout.columns
    );

    //e.g. 0, 1, 2, 3 columns, new = 3; prev = 0
    // 3 - 0 = 3 columns
    // 3 columns * columnWidth = px
    const colWidth = appStore.boardLayout.width / appStore.boardLayout.columns;
    const rowHeight = appStore.boardLayout.height / appStore.boardLayout.rows;
    const translateX = (newCoords.x - prevCoords.x) * colWidth;
    const translateY = (newCoords.y - prevCoords.y) * rowHeight;
    console.log({
      prevCoords,
      newCoords,
      translateX,
      translateY,
      colWidth,
      rowHeight,
    });

    shuffleTransform.value = `translateX(${translateX}px) 
        translateY(${translateY}px)`;
    return newCoords;
  });

  // calculates the transform required to flip this card to the center of the screen
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
    return transform;
  });

  useTask$((taskCtx) => {
    taskCtx.track(() => shuffleTransform.value);
    let timer: ReturnType<typeof setTimeout>;

    if (shuffleTransform.value === "") {
      return;
    }
    timer = setTimeout(() => {
      // turn off transform
      console.log('turning off shuffle transform');
      shuffleTransform.value = "";
    }, CARD_SHUFFLE_DURATION);

    taskCtx.cleanup(() => {
      timer && clearTimeout(timer);
    });
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
    let timeout: ReturnType<typeof setTimeout>;

    // turn on shake after duration (once card returns to its spaces)
    timeout = setTimeout(() => {
      card.isMismatched = false;
      shakeSignal.value = true;
    }, CARD_FLIP_ANIMATION_DURATION - 200);

    taskCtx.cleanup(() => {
      timeout && clearTimeout(timeout);
    });
  });

  // handle turn off shake animation
  useTask$((taskCtx) => {
    taskCtx.track(() => shakeSignal.value);
    if (shakeSignal.value === false) return;

    // delay until the animation is over, then start the shake
    let timeout: ReturnType<typeof setTimeout>;

    // turn off shake after duration
    timeout = setTimeout(() => {
      shakeSignal.value = false;
    }, CARD_SHAKE_ANIMATION_DURATION);

    taskCtx.cleanup(() => {
      timeout && clearTimeout(timeout);
    });
  });

  /* perspective: for 3D effect, adjust based on width, and card area compared to viewport */

  return (
    <div
      class={`mx-auto aspect-[2.25/3.5] flex flex-col justify-center ${
        shuffleTransform.value === ""
          ? shuffleTransform.value +
            ` [transition-duration:${CARD_SHUFFLE_DURATION}] transition-[transform]`
          : "transition-all"
      }`}
      style={{
        width: appStore.cardLayout.width + "px",
        height: appStore.cardLayout.height + "px",
        gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
        gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
        zIndex: isThisCardFlipped.value
          ? 20 // applies while card is being flipped up but not while being flipped down
          : isUnderSideShowing.value
          ? 10 // applies starting halfway in flip up, and ending halfway in flip down
          : 0, // applies otherwise (when face down);
        borderRadius: appStore.cardLayout.roundedCornersPx + "px",
      }}
    >
      <div
        class={`w-[90%] h-[90%] mx-auto [perspective:1400px] bg-transparent border border-gray-50/20 flip-card transition-all [animation-timing-function:ease-in-out] ${
          isRemovedDelayedTrue.value &&
          appStore.game.flippedCardId !== card.id &&
          appStore.game.flippedCardId !== card.pairId
            ? "opacity-0 scale-105"
            : "opacity-100 scale-100 cursor-pointer"
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
            transform: isThisCardFlipped.value ? flipTransform.value : "",
            transitionDuration: CARD_FLIP_ANIMATION_DURATION + "ms",
            borderRadius: appStore.cardLayout.roundedCornersPx + "px",
          }}
        >
          <div
            class={`absolute w-full h-full border-2 border-gray-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden]`}
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
              {/* <small data-id={card.id} class="block"> */}
              {/*   {card.id} */}
              {/* </small> */}
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
            class={`absolute w-full border border-white h-full flex justify-center items-center text-black bg-gray-300 [transform:rotateY(180deg)] [backface-visibility:hidden] `}
            data-id={card.id}
            style={{
              borderRadius: appStore.cardLayout.roundedCornersPx + "px",
            }}
          >
            {isUnderSideShowing.value &&
              (card.image ? (
                <img src={card.image} class="w-full h-full" />
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
