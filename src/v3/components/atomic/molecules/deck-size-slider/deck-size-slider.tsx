import { Signal, component$ } from "@builder.io/qwik";
import { settingsModalConstants } from "~/v3/constants/settings-modal-constants";
import type { iGameSettings } from "~/v3/types/types";

export default component$<{
  settings: Signal<iGameSettings>;
  isLocked?: boolean;
  for?: string;
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
        min={props.settings.value.deck.MINIMUM_CARDS}
        max={props.settings.value.deck.MAXIMUM_CARDS}
        step="2"
        value={props.settings.value.deck.size}
        onInput$={(e: Event) => {
          props.settings.value = {
            ...props.settings.value,
            deck: {
              ...props.settings.value.deck,
              size: Number((e.target as HTMLInputElement).value),
            },
          };
        }}
        disabled={props.isLocked}
      />
      <span class="tooltiptext">
        {props.settings.value.deck.size} - Number of cards in the deck.{" "}
        {settingsModalConstants.REQUIRES_RESTART}
      </span>
    </div>
  );
});
