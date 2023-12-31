import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";
import cardUtils from "~/v3/utils/cardUtils";
import { BOARD } from "~/v3/constants/board";
import CardView from "~/v3/components/molecules/card-view/card-view";

import type { BoardLayout, Coords, Card } from "~/v3/types/types";
import type { Signal } from "@builder.io/qwik";

// underside shows immediately, but hides after this far during return transition
export const CARD_HIDE_UNDERSIDE_AFTER_PERCENT = 0.9;

// if matching, delay return animation by this amount
// e.g. time allowed for card to vanish (before it would return to board)
export const CARD_FLIPPED_DELAYED_OFF_DURATION_MS = 250;

type FlipTransform = {
  translateX: number;
  translateY: number;
  rotateY: string;
  scale: number;
};

export default component$(({ card }: { card: Card }) => {
  const gameContext = useContext(GameContext);

  const isThisRemoved = useComputed$(() =>
    cardUtils.isCardInPairs(gameContext.game.successfulPairs, card.id)
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

  const isReturned = useSignal(true);

  // when card is flipped, control timers for isFaceShowing and isFaceShowing_delayedOff
  // when showing the back side, partway through we reveal the back side.
  // when going back to the board, partway through we hide the back side.
  useTask$((taskCtx) => {
    taskCtx.track(() => isCardFlipped.value);

    let undersideRevealDelayTimer: ReturnType<typeof setTimeout>;
    let flippedDelayTimer: ReturnType<typeof setTimeout>;
    let returnedTimer: ReturnType<typeof setTimeout>;

    if (isCardFlipped.value) {
      // when showing card
      isFaceShowing.value = true;
      isFaceShowing_delayedOff.value = true;
      isReturned.value = false;
    } else {
      // when hiding card, keep the underside visible for a while
      undersideRevealDelayTimer = setTimeout(() => {
        isFaceShowing.value = isCardFlipped.value;
      }, BOARD.CARD_FLIP_ANIMATION_DURATION * CARD_HIDE_UNDERSIDE_AFTER_PERCENT);

      flippedDelayTimer = setTimeout(() => {
        isFaceShowing_delayedOff.value = isCardFlipped.value;
      }, CARD_FLIPPED_DELAYED_OFF_DURATION_MS);

      returnedTimer = setTimeout(() => {
        isReturned.value = !isCardFlipped.value;
      }, BOARD.CARD_FLIP_ANIMATION_DURATION);
    }

    taskCtx.cleanup(() => {
      clearTimeout(undersideRevealDelayTimer);
      clearTimeout(flippedDelayTimer);
      clearTimeout(returnedTimer);
    });
  });

  /* SHUFFLE CARDS TRANSFORM
   * - transforms based off how to get from 0,0 to newCoords
   * - any changes in coords will change the transform
   *     so the card will slide to the correct position
   * */

  const shuffleTransform = useSignal("");

  const flipTransform = useSignal<FlipTransform>({
    translateX: 0,
    translateY: 0,
    rotateY: "0",
    scale: 1,
  });
  const coords = useSignal<Coords>({ x: 0, y: 0 });

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

    const newCoords = cardUtils.getXYFromPosition(
      card.position,
      gameContext.boardLayout.columns
    );

    shuffleTransform.value =
      cardUtils.generateShuffleTranslateTransformPercent(
        gameContext.cardLayout,
        newCoords
      );

    flipTransform.value = cardUtils.generateFlipTranslateTransform(
      gameContext.boardLayout,
      gameContext.cardLayout,
      newCoords
    );
    coords.value = newCoords;
  });

  const isSelected = useComputed$(() =>
    gameContext.game.selectedCardIds.includes(card.id)
  );

  // if flipTrasnform.value.translateX > 0, we're moving to the right. We should be higher z-index since we are on the left. And vice versa.
  // if tarnslateY > 0, we're moving down. We should be higher z-index since we are on the top. And vice versa.
  // (middle should have the lowest z-index)
  return (
    <div
      class={`card-shuffle-transform absolute top-0 left-0 aspect-[${BOARD.CARD_RATIO}] flex flex-col justify-center`}
      style={{
        width: gameContext.cardLayout.width + "px",
        height: gameContext.cardLayout.height + "px",
        borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
        zIndex:
          // use coords to create gradient of z-index, lowest in center and highest on edges/corners
          Math.floor(
            (Math.abs(
              (flipTransform.value.translateX === 0
                ? 0
                : flipTransform.value.translateX) / 50
            ) +
              Math.abs(
                flipTransform.value.translateY === 0
                  ? 0
                  : flipTransform.value.translateY / 50
              )) /
              2
          ) +
          // extra z-index for cards being flipped
          (isCardFlipped.value
            ? 120 // applies while card is first clicked
            : // : isFaceShowing.value || isFaceShowing_delayedOff.value || !isReturned.value
            isFaceShowing.value
            ? 60 // applies when flipping down
            : 0), // applies otherwise (when face down);
        transform: shuffleTransform.value,
      }}
      data-label="card-slot-container"
      data-position={card.position}
    >
      <div
        class={`aspect-[${BOARD.CARD_RATIO}] border border-slate-50/10 mx-auto bg-transparent`}
        style={{
          borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
          width: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "%",
          // height: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: "auto",
          aspectRatio: BOARD.CARD_RATIO,
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
              ? "pointer-events-none scale-[110%] opacity-0"
              : "cursor-pointer opacity-100"
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
            perspective: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "vw",
            height: "auto",
            aspectRatio: BOARD.CARD_RATIO,
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
            boardLayout={gameContext.boardLayout}
          />
        </div>
      </div>
    </div>
  );
});

const CardFlippingWrapper = ({
  card,
  isSelected,
  isCardFlipped,
  isRemoved,
  isFaceShowing_delayedOff,
  flipTransform,
  roundedCornersPx,
  isFaceShowing,
  boardLayout,
}: {
  card: Card;
  isSelected: Signal<boolean>;
  isCardFlipped: Signal<boolean>;
  isFaceShowing: Signal<boolean>;
  isRemoved: Signal<boolean>;
  isFaceShowing_delayedOff: Signal<boolean>;
  flipTransform: Signal<FlipTransform>;
  roundedCornersPx: number;
  boardLayout: BoardLayout;
}) => {
  return (
    <div
      data-id={card.id}
      class={`flex flex-col items-center justify-center w-full bg-transparent card-flip relative text-center`}
      style={{
        transform:
          isCardFlipped.value ||
          (isRemoved.value && isFaceShowing_delayedOff.value)
            ? `translate(${
                (flipTransform.value.translateX * boardLayout.colWidth) / 100
              }px, ${
                (flipTransform.value.translateY * boardLayout.rowHeight) / 100
              }px) 
      rotateY(${flipTransform.value.rotateY}) 
      scale(${flipTransform.value.scale})`
            : "",
        borderRadius: roundedCornersPx + "px",
        boxShadow: isSelected.value
          ? `0 0 ${roundedCornersPx}px ${roundedCornersPx}px var(--success-color)`
          : "",
        background: "var(--success-color)",

        height: "auto",
        aspectRatio: BOARD.CARD_RATIO,
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


