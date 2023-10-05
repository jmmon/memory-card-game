import { Signal, component$, useContext } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";

import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import PlayingCardComponents from "../../../playing-card-components";
import CardFace from "../../atoms/card-face/card-face";

import type{ Card } from "~/v3/types/types";
import { BOARD } from "~/v3/constants/board";

// holds the front and back of card
export default component$(
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
          width={gameContext.cardLayout.width * BOARD.CARD_RATIO_VS_CONTAINER}
          height={gameContext.cardLayout.height * BOARD.CARD_RATIO_VS_CONTAINER}
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
          width={gameContext.cardLayout.width * BOARD.CARD_RATIO_VS_CONTAINER}
          height={gameContext.cardLayout.height * BOARD.CARD_RATIO_VS_CONTAINER}
        >
          <ImageBackFace loading="eager" decoding="sync" />
        </CardFace>
      </>
    );
  }
);
