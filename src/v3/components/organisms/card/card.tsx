import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import cardUtils from "~/v3/utils/cardUtils";
import BOARD from "~/v3/constants/board";
import CardView from "~/v3/components/molecules/card-view/card-view";

import type { iCoords, iCard } from "~/v3/types/types";
import type { FunctionComponent, Signal } from "@builder.io/qwik";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

type FlipTransform = {
  /** percent to translate the card during flip animation (to get to center) */
  translateX: number;
  /** percent to translate the card during flip animation (to get to center) */
  translateY: number;
  /** 180 or -180 degrees, depending on if coming from left or right */
  rotateY: string;
  /** percent to scale the card during flip animation (to make big) */
  scale: number;
};

type CardProps = {
  card: iCard;
  /** index of card in gameData.cards array */
  index: number;
};

export default component$<CardProps>(({ card, index }) => {
  const ctx = useGameContextService();

  const isThisRemoved = useComputed$(() =>
    cardUtils.isCardInPairs(ctx.state.gameData.successfulPairs, card.id),
  );

  const isThisMismatched = useComputed$(() =>
    ctx.state.gameData.mismatchPair.includes(String(card.id)),
  );

  // is our card the flipped card?
  const isCardFlipped = useComputed$(
    () => ctx.state.gameData.flippedCardId === card.id,
  );

  // two cards can be selected
  const isSelected = useComputed$(() =>
    ctx.state.gameData.selectedCardIds.includes(card.id),
  );

  // show and hide the back face, so the backs of cards can't be inspected when face-down
  const isFaceShowing = useSignal(false);
  // When pair is matched, instead of unflipping the card, wait this duration and then disappear the two cards
  const matchHideDelay = useSignal(false);

  // when card is flipped/unflipped, control timers for isFaceShowing and isFaceShowing_delayedOff
  // - when clicking, reveal the face immediately (though it is hidden behind the card back)
  // - when returning, keep the face showing a little bit before hiding again
  useTask$(({ track, cleanup }) => {
    track(() => isCardFlipped.value);

    let faceHideDelayTimer: ReturnType<typeof setTimeout>;
    let matchHideDelayTimer: ReturnType<typeof setTimeout>;

    if (isCardFlipped.value) {
      // when showing card
      isFaceShowing.value = true;
      matchHideDelay.value = true;
    } else {
      // when hiding card, keep the underside visible for a while
      faceHideDelayTimer = setTimeout(() => {
        isFaceShowing.value = isCardFlipped.value;
      }, BOARD.CARD_FLIP_ANIMATION_DURATION * 0.1);

      matchHideDelayTimer = setTimeout(() => {
        matchHideDelay.value = isCardFlipped.value;
      }, BOARD.CARD_MATCH_HIDE_DELAY_DURATION_MS);
    }

    cleanup(() => {
      clearTimeout(faceHideDelayTimer);
      clearTimeout(matchHideDelayTimer);
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
  const coords = useSignal<iCoords>({ x: 0, y: 0 });

  // shuffling will change the card position, causing this to run
  // calc & save prev/cur grid coords from that card position;
  useTask$(({ track }) => {
    track(() => [
      card.position,
      ctx.state.boardLayout.width,
      ctx.state.boardLayout.height,
      ctx.state.boardLayout.rows,
      ctx.state.boardLayout.columns,
    ]);

    const newCoords = cardUtils.getXYFromPosition(
      card.position,
      ctx.state.boardLayout.columns,
    );

    shuffleTransform.value = cardUtils.generateShuffleTranslateTransformPercent(
      ctx.state.cardLayout,
      newCoords,
    );

    flipTransform.value = cardUtils.generateFlipTranslateTransform(
      ctx.state.boardLayout,
      ctx.state.cardLayout,
      newCoords,
    );
    coords.value = newCoords;
  });

  const flipTransformAnimation = useComputed$(() =>
    isCardFlipped.value ||
    // also keep transformed for a bit after it is removed, if it is currently flipped
    (isThisRemoved.value && matchHideDelay.value)
      ? `translate(${
          (flipTransform.value.translateX * ctx.state.boardLayout.colWidth) /
          100
        }px, ${
          (flipTransform.value.translateY * ctx.state.boardLayout.rowHeight) /
          100
        }px) rotateY(${flipTransform.value.rotateY}) scale(${flipTransform.value.scale})`
      : "",
  );

  // if flipTrasnform.value.translateX > 0, we're moving to the right. We should be higher z-index since we are on the left. And vice versa.
  // if tarnslateY > 0, we're moving down. We should be higher z-index since we are on the top. And vice versa.
  // (middle should have the lowest z-index)
  return (
    <div
      class={`card-shuffle-transform absolute top-0 left-0 flex flex-col justify-center`}
      style={{
        // has the correct ratios
        width: ctx.state.cardLayout.width + "px",
        height: ctx.state.cardLayout.height + "px",
        borderRadius: ctx.state.cardLayout.roundedCornersPx + "px",
        aspectRatio: BOARD.CARD_RATIO,
        zIndex:
          index +
          // use coords to create gradient of z-index, lowest in center and highest on edges/corners
          Math.floor(
            (Math.abs(
              (flipTransform.value.translateX === 0
                ? 0
                : flipTransform.value.translateX) / 50,
            ) +
              Math.abs(
                flipTransform.value.translateY === 0
                  ? 0
                  : flipTransform.value.translateY / 50,
              )) /
              2,
          ) +
          // extra z-index for cards being flipped
          (isCardFlipped.value
            ? 240 // applies while card is first clicked
            : isFaceShowing.value || matchHideDelay.value
              ? 180 // applies when flipping down
              : 0), // applies otherwise (when face down);

        transform: shuffleTransform.value,
      }}
      data-label="card-slot-container"
      data-position={card.position}
    >
      <div
        class={`box-content border border-slate-600 mx-auto bg-[var(--card-bg)]`}
        style={{
          // slightly smaller to give some gap between the rows
          borderRadius: ctx.state.cardLayout.roundedCornersPx + "px",
          width: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: "auto",
          aspectRatio: BOARD.CARD_RATIO,
        }}
        data-label="card-slot-removed"
      >
        <div
          data-id={card.id}
          data-label="card-slot-shaking"
          class={
            `box-content w-full border border-slate-400 bg-[var(--card-bg)] transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ` +
            (isCardFlipped.value
              ? ""
              : (isThisRemoved.value &&
                ctx.state.gameData.flippedCardId !== card.pairId
                  ? " pointer-events-none scale-[110%] opacity-0 "
                  : " cursor-pointer opacity-100 ") +
                (isThisMismatched.value && ctx.state.gameData.isShaking
                  ? " shake-card "
                  : ""))
          }
          style={{
            borderRadius: ctx.state.cardLayout.roundedCornersPx + "px",
            perspective: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "vw",
            height: "auto",
            aspectRatio: BOARD.CARD_RATIO,
          }}
        >
          <CardFlippingWrapper
            card={card}
            isSelected={isSelected}
            isFaceShowing={isFaceShowing}
            flipTransformAnimation={flipTransformAnimation}
            roundedCornersPx={ctx.state.cardLayout.roundedCornersPx}
          />
        </div>
      </div>
    </div>
  );
});

type CardFlippingWrapperProps = {
  card: iCard;
  isSelected: Signal<boolean>;
  isFaceShowing: Signal<boolean>;
  flipTransformAnimation: Signal<string>;
  roundedCornersPx: number;
};

const CardFlippingWrapper: FunctionComponent<CardFlippingWrapperProps> = ({
  card,
  isSelected,
  isFaceShowing,
  flipTransformAnimation,
  roundedCornersPx,
}) => (
  <div
    data-id={card.id}
    data-label="card-flipping"
    class={`w-full card-flip relative`}
    style={{
      transform: flipTransformAnimation.value,
      borderRadius: roundedCornersPx + "px",
      // green selected border and background
      boxShadow: isSelected.value
        ? `0 0 ${roundedCornersPx}px ${roundedCornersPx}px var(--card-glow)`
        : "",
      background: "var(--card-background-color)",
      aspectRatio: BOARD.CARD_RATIO,
    }}
  >
    <CardView card={card} isFaceShowing={isFaceShowing} />
  </div>
);
