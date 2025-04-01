import {
  Slot,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import { GameContext } from "~/v3/context/gameContext";
import v3CardUtils, { CARD_RATIO_VS_CONTAINER } from "~/v3/utils/cardUtils";
import PlayingCardComponents from "../playing-card-components";
import type { iBoardLayout, Coords, Card } from "~/v3/types/types";
import type { Signal } from "@builder.io/qwik";
import CONSTANTS from "~/v3/utils/constants";

type FlipTransform = {
  translateX: number;
  translateY: number;
  rotateY: string;
  scale: number;
};

export default component$(({ card }: { card: Card }) => {
  const gameContext = useContext(GameContext);

  const isThisRemoved = useComputed$(() =>
    v3CardUtils.isCardInPairs(gameContext.game.successfulPairs, card.id),
  );

  const isThisMismatched = useComputed$(() =>
    gameContext.game.mismatchPair.includes(String(card.id)),
  );

  // is our card the flipped card?
  const isThisCardFlipped = useComputed$(
    () => gameContext.game.flippedCardId === card.id,
  );

  const isThisCardSelected = useComputed$(() =>
    gameContext.game.selectedCardIds.includes(card.id),
  );

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

    const newCoords = v3CardUtils.getXYFromPosition(
      card.position,
      gameContext.boardLayout.columns,
    );

    shuffleTransform.value =
      v3CardUtils.generateShuffleTranslateTransformPercent(
        gameContext.cardLayout,
        newCoords,
      );

    flipTransform.value = v3CardUtils.generateFlipTranslateTransform(
      gameContext.boardLayout,
      gameContext.cardLayout,
      newCoords,
    );
    coords.value = newCoords;
  });

  // if flipTrasnform.value.translateX > 0, we're moving to the right. We should be higher z-index since we are on the left. And vice versa.
  // if tarnslateY > 0, we're moving down. We should be higher z-index since we are on the top. And vice versa.
  // (middle should have the lowest z-index)
  return (
    <div
      class={`card-shuffle-transform absolute top-0 left-0 aspect-[${CONSTANTS.CARD.RATIO}] flex flex-col justify-center`}
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
          (isThisCardFlipped.value
            ? 120 // applies while card is first clicked
            : // : isFaceShowing.value || isFaceShowing_delayedOff.value || !isReturned.value
              isThisCardFlipped.value && gameContext.game.isFaceShowing
              ? 60 // applies when flipping down
              : 0), // applies otherwise (when face down);
        transform: shuffleTransform.value,
      }}
      data-label="card-slot-container"
      data-position={card.position}
    >
      <div
        class={`aspect-[${CONSTANTS.CARD.RATIO}] border border-slate-50/10 mx-auto bg-transparent`}
        style={{
          borderRadius: gameContext.cardLayout.roundedCornersPx + "px",
          width: CARD_RATIO_VS_CONTAINER * 100 + "%",
          // height: CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: "auto",
          aspectRatio: CONSTANTS.CARD.RATIO,
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
            aspectRatio: CONSTANTS.CARD.RATIO,
          }}
        >
          <CardFlippingWrapper
            isThisCardSelected={isThisCardSelected}
            card={card}
            isThisRemoved={isThisRemoved}
            isThisCardFlipped={isThisCardFlipped}
            flipTransform={flipTransform}
            roundedCornersPx={gameContext.cardLayout.roundedCornersPx}
            boardLayout={gameContext.boardLayout}
          />
        </div>
      </div>
    </div>
  );
});

export const CardFlippingWrapper = component$(
  ({
    card,
    isThisCardSelected,
    isThisCardFlipped,
    flipTransform,
    roundedCornersPx,
    boardLayout,
    isThisRemoved,
  }: {
    card: Card;
    isThisCardSelected: Signal<boolean>;
    isThisCardFlipped: Signal<boolean>;
    flipTransform: Signal<FlipTransform>;
    roundedCornersPx: number;
    boardLayout: iBoardLayout;
    isThisRemoved: Signal<boolean>;
  }) => {
    const gameContext = useContext(GameContext);
    return (
      <div
        data-id={card.id}
        class={`flex flex-col items-center justify-center w-full bg-transparent card-flip relative text-center`}
        style={{
          transform:
            isThisCardFlipped.value ||
            (isThisRemoved.value && gameContext.game.isFaceShowing_delayedOff)
              ? `translate(${
                  (flipTransform.value.translateX * boardLayout.colWidth) / 100
                }px, ${
                  (flipTransform.value.translateY * boardLayout.rowHeight) / 100
                }px) 
            rotateY(${flipTransform.value.rotateY}) 
            scale(${flipTransform.value.scale})`
              : "",
          borderRadius: roundedCornersPx + "px",
          boxShadow: isThisCardSelected.value
            ? `0 0 ${roundedCornersPx}px ${roundedCornersPx}px var(--success-color)`
            : "",
          background: "var(--success-color)",

          height: "auto",
          aspectRatio: CONSTANTS.CARD.RATIO,
        }}
      >
        <CardView
          card={card}
          roundedCornersPx={roundedCornersPx}
          isFaceShowing={gameContext.game.isFaceShowing}
        />
      </div>
    );
  },
);

// holds the front and back of card
const CardView = component$(
  ({
    card,
    roundedCornersPx,
    isFaceShowing,
  }: {
    card: Card;
    roundedCornersPx: number;
    isFaceShowing: boolean;
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
          {isFaceShowing && (
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
  },
);

const CardFace = component$(
  ({
    roundedCornersPx,
    classes = "",
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
          width: "100%",
          height: "auto",
          aspectRatio: CONSTANTS.CARD.RATIO,
        }}
      >
        <Slot />
      </div>
    );
  },
);
