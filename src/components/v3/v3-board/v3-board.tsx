import { $, component$, useContext, useOnWindow } from "@builder.io/qwik";
import V3Card from "../v3-card/v3-card";
import { AppContext } from "../v3-context/v3.context";

export default component$(() => {
  const appStore = useContext(AppContext);

  // to handle calculating the grid columns
  useOnWindow(
    "resize",
    $((e) => {
      console.log("resize", e);

      // take the height/width of board (if possible)
      // rows = Math.ceil(total / columns)
      //
      // I know the aspect ratio of the cards
      // I can get the aspect ratio of the board

      // can get board area
      // can divide by cards to get area allowed per card
//
// get board area in px^2
// divide by cards to get MAXIMUM px^2 per card
// 
// MAX px^2 per card / 3.5 = MAX px width per card
// MAX px^2 per card / 2.5 = MAX px height per card
//
//boardH / MAX px card height = ~rows
//boardW / MAX px card width = ~cols
//
    })
  );

  return (
    <div class="flex flex-wrap gap-2 h-full w-full p-4">
      {appStore.cards.map((card) => (
        <V3Card card={card} />
      ))}
    </div>
  );
});

// alternate way to handle positioning:
// flex container
// cards dynamic sizing
// when card is removed, need to leave a "ghost" slot to take up the space (or else the cards will slide up to fill in slots)
