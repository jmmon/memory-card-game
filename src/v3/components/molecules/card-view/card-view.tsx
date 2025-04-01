import ImageBackFace from "~/media/cards/_backWhite.png?jsx";
import PlayingCardComponents from "~/v3/components/playing-card-components";
import CardFace from "~/v3/components/atoms/card-face/card-face";

import type { FunctionComponent, Signal } from "@builder.io/qwik";
import type { iCard } from "~/v3/types/types";

// holds the front and back of card
type CardViewProps = {
  card: iCard;
  isFaceShowing: Signal<boolean>;
};
const CardView: FunctionComponent<CardViewProps> = ({
  card,
  isFaceShowing,
}) => (
  <>
    <CardFace label="card-front" classes="[transform:rotateY(180deg)]">
      {isFaceShowing.value && (
        <div
          style={{
            width: "100%",
          }}
          dangerouslySetInnerHTML={PlayingCardComponents[card.text]}
        />
      )}
    </CardFace>

    <CardFace label="card-back">
      <ImageBackFace loading="eager" decoding="sync" fetchPriority="high" />
    </CardFace>
  </>
);
export default CardView;
