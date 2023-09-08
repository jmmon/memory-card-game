import {
  type Signal,
  Slot,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import { GameContext } from "~/v3/context/gameContext";
import type { Card } from "~/v3/types/types";
import v3CardUtils, { CARD_RATIO_VS_CONTAINER } from "~/v3/utils/v3CardUtils";
import { CARD_FLIP_ANIMATION_DURATION, CARD_RATIO } from "../board/board";
import PlayingCardComponents from "../playing-card-components";

// underside shows immediately, but hides after this far during return transition
export const CARD_HIDE_UNDERSIDE_AFTER_PERCENT = 0.9;

// if matching, delay return animation by this amount
// e.g. time allowed for card to vanish (before it would return to board)
export const CARD_FLIPPED_DELAYED_OFF_DURATION_MS = 250;

export default component$(({ card }: { card: Card }) => {
  const gameContext = useContext(GameContext);

  const isThisRemoved = useComputed$(() =>
    v3CardUtils.isCardInPairs(gameContext.game.successfulPairs, card.id)
  );

  const isThisMismatched = useComputed$(() =>
    gameContext.game.mismatchPair.includes(String(card.id))
  );

  // is our card the flipped card?
  const isCardFlipped = useComputed$(
    () => gameContext.game.flippedCardId === card.id
  );

  // show and hide the back face, so the backs of cards can't be inspected when face-down
  const isFaceShowing = useSignal(false);
  // When pair is matched, instead of unflipping the card, wait this duration and then disappear the two cards
  const isFaceShowing_delayedOff = useSignal(false);

  // when card is flipped, control timers for isFaceShowing and isFaceShowing_delayedOff
  // when showing the back side, partway through we reveal the back side.
  // when going back to the board, partway through we hide the back side.
  useTask$((taskCtx) => {
    taskCtx.track(() => isCardFlipped.value);

    let undersideRevealDelayTimer: ReturnType<typeof setTimeout>;
    let flippedDelayTimer: ReturnType<typeof setTimeout>;

    if (isCardFlipped.value) {
      // when showing card
      isFaceShowing.value = true;
      isFaceShowing_delayedOff.value = true;
    } else {
      // when hiding card, keep the underside visible for a while
      undersideRevealDelayTimer = setTimeout(() => {
        isFaceShowing.value = isCardFlipped.value;
      }, CARD_FLIP_ANIMATION_DURATION * CARD_HIDE_UNDERSIDE_AFTER_PERCENT);

      flippedDelayTimer = setTimeout(() => {
        isFaceShowing_delayedOff.value = isCardFlipped.value;
      }, CARD_FLIPPED_DELAYED_OFF_DURATION_MS);
    }

    taskCtx.cleanup(() => {
      clearTimeout(undersideRevealDelayTimer);
      clearTimeout(flippedDelayTimer);
    });
  });

  /* SHUFFLE CARDS TRANSFORM
   * - new method!
   * - transforms based off how to get from 0,0 to newCoords
   * - any changes in coords will change the transform
   *     so the card will slide to the correct position
   * */

  const shuffleTransform = useSignal("");

  const flipTransform = useSignal("");

  // shuffling will change the card position, causing this to run
  // calc & save prev/cur grid coords from that card position;
  useTask$((taskCtx) => {
    taskCtx.track(() => [
      card.position,
      gameContext.boardLayout.width,
      gameContext.boardLayout.height,
      gameContext.boardLayout.rows,
      gameContext.boardLayout.columns,
    ]);

    const newCoords = v3CardUtils.getXYFromPosition(
      card.position,
      gameContext.boardLayout.columns
    );

    // const prevTransform = shuffleTransform.value;

    shuffleTransform.value =
      v3CardUtils.generateShuffleTranslateTransformPercent(
        gameContext.cardLayout,
        newCoords
      );

    // console.log({
    //   newCoords,
    //   card,
    //   prevTransform,
    //   shuffleTransform: shuffleTransform.value,
    // });

    flipTransform.value = v3CardUtils.generateFlipTranslateTransform(
      gameContext.boardLayout,
      gameContext.cardLayout,
      newCoords
    );
  });
  const isSelected = useComputed$(() =>
    gameContext.game.selectedCardIds.includes(card.id)
  );

  return (
    <div
      class={`card-shuffle-transform absolute top-0 left-0 aspect-[${CARD_RATIO}] flex flex-col justify-center`}
      style={{
        width: gameContext.cardLayout.width + "px",
        height: gameContext.cardLayout.height + "px",
        borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
        zIndex: isCardFlipped.value
          ? 20 // applies while card is first clicked
          : isFaceShowing.value
          ? 15 // applies when flipping down, before front disappears
          : 0, // applies otherwise (when face down);
        transform: shuffleTransform.value,
      }}
      data-label="card-slot-container"
      data-position={card.position}
    >
      <div
        class={`aspect-[${CARD_RATIO}] border border-slate-50/10 mx-auto bg-transparent`}
        style={{
          borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
          width: CARD_RATIO_VS_CONTAINER * 100 + "%",
          // height: CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: "auto",
          aspectRatio: CARD_RATIO,
        }}
        data-label="card-outline"
      >
        <div
          data-id={card.id}
          data-label="card"
          class={`box-border w-full border border-slate-50/25 bg-transparent transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ${
            isThisRemoved.value &&
            gameContext.game.flippedCardId !== card.id &&
            gameContext.game.flippedCardId !== card.pairId
              ? "opacity-0 scale-[110%] pointer-events-none"
              : "opacity-100 cursor-pointer"
          } ${
            isThisMismatched.value &&
            gameContext.game.isShaking &&
            gameContext.game.flippedCardId !== card.id
              ? "shake-card"
              : ""
          }
          `}
          style={{
            borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
            perspective: CARD_RATIO_VS_CONTAINER * 100 + "vw",
            height: "auto",
            aspectRatio: CARD_RATIO,
          }}
        >
          <CardFlippingWrapper
            isSelected={isSelected}
            card={card}
            isCardFlipped={isCardFlipped}
            isFaceShowing={isFaceShowing}
            isRemoved={isThisRemoved}
            isFaceShowing_delayedOff={isFaceShowing_delayedOff}
            flipTransform={flipTransform}
            roundedCornersPx={gameContext.cardLayout.roundedCornersPx}
          />
        </div>
      </div>
    </div>
  );
});

export const CardFlippingWrapper = ({
  card,
  isSelected,
  isCardFlipped,
  isRemoved,
  isFaceShowing_delayedOff,
  flipTransform,
  roundedCornersPx,
  isFaceShowing,
}: {
  card: Card;
  isSelected: Signal<boolean>;
  isCardFlipped: Signal<boolean>;
  isFaceShowing: Signal<boolean>;
  isRemoved: Signal<boolean>;
  isFaceShowing_delayedOff: Signal<boolean>;
  flipTransform: Signal<string>;
  roundedCornersPx: number;
}) => {
  return (
    <div
      data-id={card.id}
      class={`flex flex-col items-center justify-center w-full bg-transparent card-flip relative text-center`}
      style={{
        transform:
          isCardFlipped.value ||
          (isRemoved.value && isFaceShowing_delayedOff.value)
            ? flipTransform.value
            : "",
        borderRadius: roundedCornersPx + "px",
        boxShadow: isSelected.value
          ? `0 0 ${roundedCornersPx}px ${roundedCornersPx}px var(--success-color)`
          : "",
        background: 'var(--success-color)',

        height: "auto",
        aspectRatio: CARD_RATIO,
      }}
    >
      <CardView
        card={card}
        roundedCornersPx={roundedCornersPx}
        isFaceShowing={isFaceShowing}
      />
    </div>
  );
};

// holds the front and back of card
const CardView = component$(
  ({
    card,
    roundedCornersPx,
    isFaceShowing,
  }: {
    card: Card;
    roundedCornersPx: number;
    isFaceShowing: Signal<boolean>;
  }) => {
    const gameContext = useContext(GameContext);

    return (
      <>
        <CardFace
          roundedCornersPx={roundedCornersPx}
          data-label="card-front"
          classes="text-black [transform:rotateY(180deg)]"
          width={gameContext.cardLayout.width * CARD_RATIO_VS_CONTAINER}
          height={gameContext.cardLayout.height * CARD_RATIO_VS_CONTAINER}
        >
          {isFaceShowing.value && (
            <div
              style={{ width: "100%" }}
              dangerouslySetInnerHTML={PlayingCardComponents[card.text]}
            ></div>
          )}
        </CardFace>

        <CardFace
          roundedCornersPx={roundedCornersPx}
          data-label="card-back"
          classes="text-white"
          width={gameContext.cardLayout.width * CARD_RATIO_VS_CONTAINER}
          height={gameContext.cardLayout.height * CARD_RATIO_VS_CONTAINER}
        >
          <ImageBackFace loading="eager" decoding="sync" />
        </CardFace>
      </>
    );
  }
);

const CardFace = component$(
  ({
    roundedCornersPx,
    classes = "",
    width,
    height,
  }: {
    roundedCornersPx: number;
    classes: string;
    width: number;
    height: number;
  }) => {
    return (
      <div
        class={`card-face absolute flex items-center justify-center [backface-visibility:hidden] ${classes}`}
        data-label="card-front"
        style={{
          borderRadius: roundedCornersPx + "px",
          // width: width + "px",
          // height: height + "px",
          width: "100%",
          height: "auto",
          aspectRatio: CARD_RATIO,
        }}
      >
        <Slot />
      </div>
    );
  }
);
