import { component$ } from "@builder.io/qwik";
import { settingsModalConstants } from "~/v3/constants/settings-modal-constants";
import { GAME } from "~/v3/constants/game";

import type { Signal } from "@builder.io/qwik";
import type { iGameSettings, iUserSettings } from "~/v3/types/types";
import InfoTooltip from "../info-tooltip/info-tooltip";

export default component$<{
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  for?: string;
  gameSettings: iGameSettings;
}>((props) => {
  const name = `deck-size-slider${props.for ? "-" + props.for : ""}`;
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
        min={GAME.MIN_CARD_COUNT}
        max={GAME.MAX_CARD_COUNT}
        step="2"
        value={props.userSettings.value.deck.size}
        onInput$={(e: Event) => {
          props.userSettings.value = {
            ...props.userSettings.value,
            deck: {
              ...props.userSettings.value.deck,
              size: Number((e.target as HTMLInputElement).value),
            },
          };
        }}
        disabled={props.isLocked}
      />
      <InfoTooltip>
        {props.userSettings.value.deck.size} - Number of cards in the deck.{" "}
        {settingsModalConstants.REQUIRES_RESTART}
      </InfoTooltip>
    </div>
  );
});
