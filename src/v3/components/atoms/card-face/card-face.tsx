import { Slot, component$ } from "@builder.io/qwik";
import { BOARD } from "~/v3/constants/board";

export default component$(
  ({
    roundedCornersPx,
    classes = "",
    label = 'card-front',
  }: {
    roundedCornersPx: number;
    classes: string;
    width: number;
    height: number;
    label: string;
  }) => {
    return (
      <div
        class={`card-face absolute flex items-center justify-center [backface-visibility:hidden] ${classes}`}
        data-label={label}
        style={{
          borderRadius: roundedCornersPx + "px",
          // width: width + "px",
          // height: height + "px",
          width: "100%",
          height: "auto",
          aspectRatio: BOARD.CARD_RATIO,
        }}
      >
        <Slot />
      </div>
    );
  }
);
