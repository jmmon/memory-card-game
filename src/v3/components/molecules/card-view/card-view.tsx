import { component$ } from "@builder.io/qwik";

import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import PlayingCardComponents from "~/v3/components/playing-card-components";
import CardFace from "~/v3/components/atoms/card-face/card-face";

import BOARD from "~/v3/constants/board";
import type { Signal } from "@builder.io/qwik";
import type { iCard } from "~/v3/types/types";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

// holds the front and back of card
type CardViewProps = {
  card: iCard;
  roundedCornersPx: number;
  isFaceShowing: Signal<boolean>;
};
export default component$<CardViewProps>(
  ({ card, roundedCornersPx, isFaceShowing }) => {
    const ctx = useGameContextService();

    return (
      <>
        <CardFace
          roundedCornersPx={roundedCornersPx}
          label="card-front"
          classes={`text-black [transform:rotateY(180deg)] ${isFaceShowing.value ? "z-[1]" : "z-0"}`}
          //classes="text-black [transform:rotateY(180deg)] "
          width={ctx.state.cardLayout.width * BOARD.CARD_RATIO_VS_CONTAINER}
          height={ctx.state.cardLayout.height * BOARD.CARD_RATIO_VS_CONTAINER}
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
          label="card-back"
          classes="text-white"
          width={ctx.state.cardLayout.width * BOARD.CARD_RATIO_VS_CONTAINER}
          height={ctx.state.cardLayout.height * BOARD.CARD_RATIO_VS_CONTAINER}
        >
          <ImageBackFace
            loading="eager"
            decoding="sync"
            // fetchPriority="high"
          />
        </CardFace>
      </>
    );
  },
);
