import type { Signal } from "@builder.io/qwik";
import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { Card } from "~/old/utils/cardUtils";
import {
  CARD_FLIP_ANIMATION_DURATION,
  CARD_FLIP_ANIMATION_DURATION_HALF,
} from "~/routes/older-versions/v1.5";
import {
  COLUMN_COUNT,
  MIN_MAX_COLUMNS_OFFSET,
  MIN_MAX_ROWS_OFFSET,
  getXYFromPosition,
  isCardRemoved,
} from "~/routes/older-versions/v2";

type FlippableCardProps = {
  card: Card;
  flippedCardId: Signal<number>;
  pairs: Signal<`${number}:${number}`[]>;
  slotDimensions: Signal<{ width: number; height: number }>;
  gap: number;
};

export const FlippableCard = component$(
  ({ card, flippedCardId, pairs, slotDimensions, gap }: FlippableCardProps) => {
    // timer-controlled, so text doesn't show in the DOM when back of card is showing
    const isTextShowing = useSignal<boolean>(false);

    const isThisCardFlipped = useComputed$(() => {
      return String(flippedCardId.value) === card.id;
    });

    const isRemoved = useComputed$(() => {
      return isCardRemoved(pairs.value, Number(card.id));
    });

    /*  this task handles the hiding and showing of text
     *  to be sure that people can't inspect the cards face-down and see the text
     * */
    useTask$((taskCtx) => {
      taskCtx.track(() => isThisCardFlipped.value);
      let timer: ReturnType<typeof setTimeout>;

      // when switched to not showing, need to start timer to hide text after 0.4s (half the transition time)
      // duration is ~half the transition time, but adding/subtracting 100ms for margin to make sure the text doesn't show up after the flip
      if (!isThisCardFlipped.value) {
        timer = setTimeout(() => {
          isTextShowing.value = false;
        }, CARD_FLIP_ANIMATION_DURATION_HALF + 100);
      } else {
        // when switched to showing, should show text immediately
        timer = setTimeout(() => {
          isTextShowing.value = true;
        }, CARD_FLIP_ANIMATION_DURATION_HALF - 100);
      }

      taskCtx.cleanup(() => {
        clearTimeout(timer);
      });
    });

    const coords = useComputed$(() => {
      return getXYFromPosition(card.position, COLUMN_COUNT);
    });

    const flipTransform = useComputed$(() => {
      const colRatio = MIN_MAX_COLUMNS_OFFSET - coords.value.x; // depends on COLUMN_COUNT
      const columnWidthPlusGap = slotDimensions.value.width + gap; // from props
      const translateX = columnWidthPlusGap * colRatio;

      const rowRatio = MIN_MAX_ROWS_OFFSET - coords.value.y; // depends on ROW_COUNT
      const rowHeightPlusGap = slotDimensions.value.height + gap;
      const translateY = rowHeightPlusGap * rowRatio;

      const isOnLeftSide = coords.value.x < COLUMN_COUNT / 2;

      return `translateX(${translateX}px) 
        translateY(${translateY}px) 
        rotateY(${isOnLeftSide ? "" : "-"}180deg) 
        scale(2)`; // maybe should be dynamic depending on screen size??
    });

    const rounded = "rounded-[12px]"; // should be based on size, but can't use percent because the shape is rectangular so corners won't be the same
    /* perspective: for 3D effect, adjust based on width, and card area compared to viewport */
    return (
      <div
        class={`[perspective:1400px] aspect-[2.25/3.5] m-auto w-full max-w-full h-auto max-h-full bg-transparent border ${rounded} border-slate-50/20 flip-card transition-all ${
          isRemoved.value &&
          String(flippedCardId.value) !== card.id &&
          String(flippedCardId.value) !== card.pairId
            ? "opacity-0"
            : "opacity-100 cursor-pointer"
        }`}
        data-id={card.id}
        style={{
          gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
          gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
          zIndex: isThisCardFlipped.value || isTextShowing.value ? 1000 : 0,
        }}
      >
        <div
          class={`w-full h-full relative text-center [transform-style:preserve-3d] [transition-property:transform] ${rounded}`}
          data-id={card.id}
          style={{
            transitionDuration: CARD_FLIP_ANIMATION_DURATION + "ms",
            transform: isThisCardFlipped.value ? flipTransform.value : "",
          }}
        >
          <div
            class={`absolute w-full h-full border-2 border-slate-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden] ${rounded}`}
            data-id={card.id}
          >
            <div
              data-id={card.id}
              class="w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto"
            ></div>
          </div>
          <div
            class={`absolute w-full h-full border-2 border-slate-50 text-black bg-slate-300 [transform:rotateY(180deg)] [backface-visibility:hidden] ${rounded}`}
            data-id={card.id}
          >
            <div
              class={`flex justify-center items-center w-full h-full `}
              data-id={card.id}
            >
              {isTextShowing.value ? card.text : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
