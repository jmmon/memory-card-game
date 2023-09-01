import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import type { V3Card } from "../v3-game/v3-game";
import {
  CARD_SHUFFLE_ACTIVE_DURATION,
  CARD_SHUFFLE_DELAYED_START,
  CARD_FLIP_ANIMATION_DURATION,
} from "../v3-board/v3-board";
import v3CardUtils, {
  CARD_RATIO_VS_CONTAINER,
  DEFAULT_SHUFFLE_TRANSFORM,
  ShuffleTransform,
} from "../utils/v3CardUtils";

// underside shows immediately, but hides after this far during return transition
const HIDE_UNDERSIDE_AFTER_PERCENT = 0.9;

// if matching, delay return animation by this amount
// e.g. time allowed for card to vanish (before it would return to board)
const FLIPPED_DELAYED_OFF_DURATION_MS = 250;

export default component$(({ card }: { card: V3Card }) => {
  const appStore = useContext(AppContext);

  const isRemoved = useComputed$(() =>
    v3CardUtils.isCardInPairs(appStore.game.successfulPairs, card.id)
  );

  const isMismatched = useComputed$(() =>
    appStore.game.mismatchPair.includes(String(card.id))
  );

  // is our card the flipped card?
  const isCardFlipped = useComputed$(
    () => appStore.game.flippedCardId === card.id
  );

  // show and hide the back face, so the backs of cards can't be inspected when face-down
  const isUnderSideShowing = useSignal(false);
  // When pair is matched, instead of unflipping the card, wait this duration and then disappear the two cards
  const isCardFlippedDelayedOff = useSignal(false);

  // when card is flipped, control timers for isUnderSideShowing and isCardFlippedDelayedOff
  // when showing the back side, partway through we reveal the back side.
  // when going back to the board, partway through we hide the back side.
  useTask$((taskCtx) => {
    taskCtx.track(() => isCardFlipped.value);

    let undersideRevealDelayTimer: ReturnType<typeof setTimeout>;
    let flippedDelayTimer: ReturnType<typeof setTimeout>;

    switch (isCardFlipped.value) {
      // when showing card
      case true:
        {
          isUnderSideShowing.value = isCardFlipped.value;
          isCardFlippedDelayedOff.value = isCardFlipped.value;
        }
        break;

      // when hiding card, keep the underside visible for a while
      case false:
        {
          undersideRevealDelayTimer = setTimeout(() => {
            isUnderSideShowing.value = isCardFlipped.value;
          }, CARD_FLIP_ANIMATION_DURATION * HIDE_UNDERSIDE_AFTER_PERCENT);

          flippedDelayTimer = setTimeout(() => {
            isCardFlippedDelayedOff.value = isCardFlipped.value;
          }, FLIPPED_DELAYED_OFF_DURATION_MS);
        }
        break;
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

  const shuffleTransform = useSignal<ShuffleTransform>(
    DEFAULT_SHUFFLE_TRANSFORM
  );

  const flipTransform = useSignal("");

  // shuffling will change the card position, causing this to run
  // calc & save prev/cur grid coords from that card position;
  useTask$((taskCtx) => {
    taskCtx.track(() => [
      card.position,
      appStore.boardLayout.width,
      appStore.boardLayout.height,
      appStore.boardLayout.rows,
      appStore.boardLayout.columns,
    ]);

    const newCoords = v3CardUtils.getXYFromPosition(
      card.position,
      appStore.boardLayout.columns
    );

    // const prevTransform = shuffleTransform.value;

    shuffleTransform.value =
      v3CardUtils.generateShuffleTranslateTransformPercent(
        appStore.cardLayout,
        newCoords
      );

    // console.log({
    //   newCoords,
    //   card,
    //   prevTransform,
    //   shuffleTransform: shuffleTransform.value,
    // });

    flipTransform.value = v3CardUtils.generateFlipTranslateTransform(
      appStore.boardLayout,
      appStore.cardLayout,
      newCoords
    );
  });

  return (
    <div
      class={`absolute top-0 left-0 aspect-[2.25/3.5] flex flex-col justify-center`}
      style={{
        width: appStore.cardLayout.width + "px",
        height: appStore.cardLayout.height + "px",
        borderRadius: appStore.cardLayout.roundedCornersPx + "px",

        zIndex: isCardFlipped.value
          ? 20 // applies while card is being flipped up but not while being flipped down
          : isUnderSideShowing.value
          ? 18 // applies starting halfway in flip up, and ending halfway in flip down
          : 0, // applies otherwise (when face down);

        // do transform immediately when starting shuffling
        transitionProperty: "transform",
        transitionTimingFunction: "cubic-bezier(0.40, 1.3, 0.62, 1.045)",
        // transitionTimingFunction: "ease-in-out",
        transform: `translateX(${shuffleTransform.value.x}%) translateY(${shuffleTransform.value.y}%)`,
        transitionDuration:
          CARD_SHUFFLE_DELAYED_START + CARD_SHUFFLE_ACTIVE_DURATION + "ms",
      }}
      data-label="card-slot-container"
      data-position={card.position}
    >
      <div
        class="border border-slate-50/10 mx-auto bg-transparent"
        style={{
          borderRadius: appStore.cardLayout.roundedCornersPx + "px",
          width: CARD_RATIO_VS_CONTAINER * 100 + "%",
          height: CARD_RATIO_VS_CONTAINER * 100 + "%",
        }}
        data-label="card-outline"
      >
        <div
          data-id={card.id}
          data-label="card"
          class={`w-full h-full border border-slate-50/25 bg-transparent transition-all [transition-duration:200ms] [animation-timing-function:ease-in-out] ${
            isRemoved.value &&
            appStore.game.flippedCardId !== card.id &&
            appStore.game.flippedCardId !== card.pairId
              ? "opacity-0 scale-[110%]"
              : "opacity-100 cursor-pointer"
          } ${
            isMismatched.value && appStore.game.isShaking ? "shake-card" : ""
          }`}
          style={{
            borderRadius: appStore.cardLayout.roundedCornersPx + "px",
            perspective: CARD_RATIO_VS_CONTAINER * 100 + "vw",
          }}
        >
          <CardView
            card={card}
            isCardFlipped={isCardFlipped.value}
            isUnderSideShowing={isUnderSideShowing.value}
            isRemoved={isRemoved.value}
            isCardFlippedDelayedOff={isCardFlippedDelayedOff.value}
            flipTransform={flipTransform.value}
            roundedCornersPx={appStore.cardLayout.roundedCornersPx}
          />
        </div>
      </div>
    </div>
  );
});

export const CardView = ({
  card,
  isCardFlipped,
  isRemoved,
  isCardFlippedDelayedOff,
  flipTransform,
  roundedCornersPx,
  isUnderSideShowing,
}: {
  card: V3Card;
  isCardFlipped: boolean;
  isUnderSideShowing: boolean;
  isRemoved: boolean;
  isCardFlippedDelayedOff: boolean;
  flipTransform: string;
  roundedCornersPx: number;
}) => {
  return (
    <div
      data-id={card.id}
      class={`card w-full h-full relative text-center [transform-style:preserve-3d] [transition-property:all]`}
      style={{
        transform:
          isCardFlipped || (isRemoved && isCardFlippedDelayedOff)
            ? flipTransform
            : "",
        transitionDuration: CARD_FLIP_ANIMATION_DURATION + "ms",
        // understanding cubic bezier: we control the two middle points
        // [ t:0, p:0 ], (t:0.2, p:1.285), (t:0.32, p:1.075), [t:1, p:1]
        // t == time, p == animationProgress
        // e.g.:
        // - so at 20%, our animation will be 128.5% complete,
        // - then at 32% ouranimation will be 107.5% complete,
        // - then finally at 100% our animation will complete
        transitionTimingFunction: "cubic-bezier(0.40, 1.2, 0.62, 1.045)",
        borderRadius: roundedCornersPx + "px",
      }}
    >
      <div
        data-id={card.id}
        data-label="card-back"
        class={`absolute w-full h-full border-2 border-slate-50 text-white bg-slate-100 flex flex-col justify-center [backface-visibility:hidden]`}
        style={{
          borderRadius: roundedCornersPx + "px",
        }}
      >
        <img
          width="25"
          height="35"
          src="/cards/_backWhite.svg"
          class="w-full h-full"
        />
      </div>

      <div
        class={`absolute w-full border border-white h-full flex justify-center items-center text-black bg-slate-300 [transform:rotateY(180deg)] [backface-visibility:hidden] `}
        data-label="card-front"
        style={{
          borderRadius: roundedCornersPx + "px",
        }}
      >
        {isUnderSideShowing && (
          <img
            width="25"
            height="35"
            src={card.localSVG}
            class="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};
