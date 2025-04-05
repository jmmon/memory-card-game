import { $, component$ } from "@builder.io/qwik";
import GAME from "~/v3/constants/game";

import type { ClassList, Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";

const BUTTON_STYLES: ClassList =
  "p-0 w-6 h-6 bg-slate-700 border-slate-500 text-2xl rounded border flex justify-center items-center disabled:bg-slate-800 disabled:border-slate-500 disabled:text-slate-300";

type DeckSizeChangerProps = {
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  for?: string;
};
export default component$<DeckSizeChangerProps>((props) => {
  const name = `deck-size-changer${props.for ? `-${props.for}` : ""}`;

  const handleChangeSize$ = $((_: Event, t: HTMLButtonElement) => {
    const oldValue = props.userSettings.value.deck.size;
    let newValue = oldValue + (t.name === `${name}-increment` ? 2 : -2);
    if (newValue > GAME.DECK_SIZE_MAX || newValue < GAME.DECK_SIZE_MIN) {
      newValue = oldValue;
    }
    props.userSettings.value = {
      ...props.userSettings.value,
      deck: {
        ...props.userSettings.value.deck,
        size: newValue,
      },
    };
  });
  return (
    <div class="flex w-full flex-grow items-center justify-center gap-[2%] py-1.5">
      <label class="w-6/12 text-left text-slate-100" for={name}>
        Card Count:
      </label>
      <div class="grid grid-cols-3 items-center justify-center text-center">
        <button
          name={name + "-decrement"}
          id={name + "-decrement"}
          class={BUTTON_STYLES}
          onClick$={handleChangeSize$}
          disabled={
            props.isLocked ||
            props.userSettings.value.deck.size <= GAME.DECK_SIZE_MIN
          }
        >
          -
        </button>
        {props.userSettings.value.deck.size}
        <button
          name={name + "-increment"}
          id={name + "-increment"}
          class={BUTTON_STYLES}
          onClick$={handleChangeSize$}
          disabled={
            props.isLocked ||
            props.userSettings.value.deck.size >= GAME.DECK_SIZE_MAX
          }
        >
          +
        </button>
      </div>
      <InfoTooltip>
        Number of cards in the deck.
        <br />
        <div class="mt-1 text-slate-300">
          (Range: <strong>{GAME.DECK_SIZE_MIN}</strong> to{" "}
          <strong>{GAME.DECK_SIZE_MAX}</strong>)
        </div>
      </InfoTooltip>
    </div>
  );
});
