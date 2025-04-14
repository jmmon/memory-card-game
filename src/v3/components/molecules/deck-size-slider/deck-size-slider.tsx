import { component$ } from "@builder.io/qwik";
import GAME from "~/v3/constants/game";

import type { Signal } from "@builder.io/qwik";
import type { iGameSettings, iUserSettings } from "~/v3/types/types";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";

type DeckSizeSliderProps = {
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  for?: string;
  gameSettings: iGameSettings;
};
export default component$<DeckSizeSliderProps>((props) => {
  const name = `deck-size-slider${props.for ? `-${props.for}` : ""}`;
  return (
    <div class="flex w-full flex-grow items-center gap-[2%] py-1.5">
      <label class="w-4/12 text-left text-slate-100" for={name}>
        Card Count: {props.userSettings.value.deck.size}
      </label>
      <input
        name={name}
        id={name}
        class="w-8/12 flex-grow"
        type="range"
        min={GAME.DECK_SIZE_MIN}
        max={GAME.DECK_SIZE_MAX}
        step="2"
        value={props.userSettings.value.deck.size}
        onInput$={(_: Event, t: HTMLInputElement) => {
          props.userSettings.value = {
            ...props.userSettings.value,
            deck: {
              ...props.userSettings.value.deck,
              size: Number(t.value),
            },
          };
        }}
        disabled={props.isLocked}
      />
      <InfoTooltip>
        {props.userSettings.value.deck.size} - Number of cards in the deck.
      </InfoTooltip>
    </div>
  );
});
