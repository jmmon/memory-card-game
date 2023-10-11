import { component$ } from "@builder.io/qwik";
import { settingsModalConstants } from "~/v3/constants/settings-modal-constants";
import type { Signal } from "@builder.io/qwik";
import type { iGameSettings, iUserSettings } from "~/v3/types/types";
import { GAME } from "~/v3/constants/game";

export default component$<{
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  for?: string;
  gameSettings: iGameSettings;
}>((props) => {
  const name = `deck-size-slider${props.for ? "-" + props.for : ""}`;
  return (
    <div class="flex flex-grow gap-[2%] items-center tooltip w-full py-1.5">
      <label class="text-slate-100 w-4/12 text-left" for={name}>
        Card Count:
      </label>
      <input
        name={name}
        id={name}
        class="flex-grow w-8/12"
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
      <span class="tooltiptext">
        {props.userSettings.value.deck.size} - Number of cards in the deck.{" "}
        {settingsModalConstants.REQUIRES_RESTART}
      </span>
    </div>
  );
});
