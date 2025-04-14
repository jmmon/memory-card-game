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
import GAME, { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import logger from "~/v3/services/logger";

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

  // remove helper functions that were unnecessary
  const isThisRemoved = useComputed$(() =>
    ctx.state.gameData.successfulPairs.join(",").includes(String(card.id)),
  );

  // pull from last pair in array instead:
  const isThisMismatched = useComputed$(() =>
    ctx.state.gameData.mismatchPairs[
      ctx.state.gameData.mismatchPairs.length - 1
    ]?.includes(String(card.id)),
  );

  // is our card the flipped card?
  const isThisCardFlipped = useComputed$(
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
    track(() => isThisCardFlipped.value);

    let faceHideDelayTimer: ReturnType<typeof setTimeout>;
    let matchHideDelayTimer: ReturnType<typeof setTimeout>;

    if (isThisCardFlipped.value) {
      // when showing card
      isFaceShowing.value = true;
      matchHideDelay.value = true;
    } else {
      // when hiding card, keep the underside visible for a while
      faceHideDelayTimer = setTimeout(() => {
        isFaceShowing.value = isThisCardFlipped.value;
      }, BOARD.CARD_FLIP_ANIMATION_DURATION * 0.1);

      matchHideDelayTimer = setTimeout(() => {
        matchHideDelay.value = isThisCardFlipped.value;
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

    // for -1 case, can tweak constants to change percent positions for deck initialization
    //    startingPosition is calculated inside handle.initializeDeck
    const newCoords =
      card.position === -1
        ? ctx.state.gameData.startingPosition
        : cardUtils.getXYFromPosition(
            card.position,
            ctx.state.boardLayout.columns,
          );

    shuffleTransform.value = cardUtils.generateShuffleTranslateTransformPercent(
      ctx.state.cardLayout,
      newCoords,
    );
    // dealing the deck: scale
    if (card.position === -1) {
      // append the transform with a scale
      const boardBasedScale = cardUtils.generateDeckDealScale(
        ctx.state.boardLayout,
        ctx.state.cardLayout,
      );
      const scale = Math.max(
        (boardBasedScale + GAME.DECK_DEAL_SCALE) / 2,
        GAME.DECK_DEAL_SCALE,
      );
      shuffleTransform.value += ` scale(${scale});`;
    }

    flipTransform.value = cardUtils.generateFlipTranslateTransform(
      ctx.state.boardLayout,
      ctx.state.cardLayout,
      newCoords,
    );
    coords.value = newCoords;
  });

  const flipTransformAnimation = useComputed$(() =>
    isThisCardFlipped.value ||
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

  // for current fan-out card, make it higher z-index
  const zIndex = useComputed$(() =>
    ctx.state.gameData.isLoading
      ? ctx.state.userSettings.deck.size - ctx.state.gameData.dealCardIndex ===
        index
        ? 10
        : 0
      : Math.floor(
          // use coords to create gradient of z-index, lowest in center and highest on edges/corners
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
        // first number applies while card is first clicked (max necessary is > 52/2)
        // second number applies when flipping down (slightly less and still above 52/2)
        (isThisCardFlipped.value
          ? 30
          : isFaceShowing.value || matchHideDelay.value
            ? 28
            : 0),
  );

  logger(DebugTypeEnum.RENDER, LogLevel.THREE, "RENDER card.tsx", {index});

  return (
    <div
      data-label="card-slot-container"
      data-position={card.position}
      class={`card-shuffle-transform absolute top-0 left-0 flex flex-col justify-center`}
      style={{
        // has the correct ratios
        width: ctx.state.cardLayout.width + "px",
        height: ctx.state.cardLayout.height + "px",
        borderRadius: ctx.state.cardLayout.roundedCornersPx + "px",
        aspectRatio: BOARD.CARD_RATIO,
        // applies otherwise (when face down);
        zIndex: zIndex.value,
        transform: shuffleTransform.value,
      }}
    >
      <div
        data-label="card-slot"
        class={`box-content border border-slate-400 mx-auto bg-slate-700 transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ${
          isThisRemoved.value
            ? `bg-opacity-[calc(var(--card-bg-opacity-empty)*var(--card-bg-opacity-filled))] border-opacity-[calc(var(--card-bg-opacity-empty)*var(--card-bg-opacity-filled))]`
            : `bg-opacity-[var(--card-bg-opacity-filled)] border-opacity-[var(--card-bg-opacity-filled)]`
        }`}
        style={{
          // slightly smaller to give some gap between the rows
          borderRadius: ctx.state.cardLayout.roundedCornersPx + "px",
          width: BOARD.CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: "auto",
          aspectRatio: BOARD.CARD_RATIO,
        }}
      >
        <div
          data-label="card-slot-shaking"
          data-id={card.id}
          class={
            `box-content w-full transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ` +
            (isThisCardFlipped.value
              ? "cursor-pointer"
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
          {ctx.state.userSettings.interface.showSelectedIds && (
            <div class="bg-emerald-700 flex pointer-events-none w-[4em] h-[2em] justify-center items-center shadow absolute text-sm sm:text-lg lg:text-3xl z-50">
              <span class="text-slate-400">i:</span>
              {index}
              <span class="text-slate-400">, z:</span>
              {zIndex.value}
            </div>
          )}
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
