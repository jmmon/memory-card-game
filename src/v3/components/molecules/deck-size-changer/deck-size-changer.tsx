import { $, component$, useSignal, useStylesScoped$ } from "@builder.io/qwik";
import GAME from "~/v3/constants/game";

import type { ClassList, Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";
import { useDebouncer$ } from "~/v3/hooks/useDebouncer";

const BUTTON_STYLES: ClassList =
  "p-0 w-6 h-6 bg-slate-700 border-slate-500 text-2xl rounded border flex justify-center items-center text-center align-middle disabled:opacity-30 disabled:scale-[0.85]";

type DeckSizeChangerProps = {
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  for?: string;
};
export default component$<DeckSizeChangerProps>((props) => {
  const name = `deck-size-changer${props.for ? `-${props.for}` : ""}`;
  const inputRef = useSignal<HTMLInputElement>();

  const handleChangeSize$ = $((_: Event, t: HTMLButtonElement) => {
    const oldValue = props.userSettings.value.deck.size;
    let newValue = oldValue + (t.name === `${name}-increment` ? 2 : -2);

    newValue = Math.min(
      Math.max(GAME.DECK_SIZE_MIN, newValue),
      GAME.DECK_SIZE_MAX,
    );

    props.userSettings.value = {
      ...props.userSettings.value,
      deck: {
        ...props.userSettings.value.deck,
        size: newValue,
      },
    };
  });

  const debouncedSetSize$ = useDebouncer$((_: Event, t: HTMLInputElement) => {
    if (t.value === "") return;
    let newValue = Number(t.value);
    if (newValue % 2 !== 0) {
      newValue++;
    }
    newValue = Math.min(
      Math.max(GAME.DECK_SIZE_MIN, newValue),
      GAME.DECK_SIZE_MAX,
    );
    props.userSettings.value = {
      ...props.userSettings.value,
      deck: {
        ...props.userSettings.value.deck,
        size: newValue,
      },
    };
    // assert the ref has a value to the ts compiler (similar to "as HTMLInputElement")
    inputRef.value!.value = String(newValue);
    inputRef.value!.blur();
  }, 500);

  useStylesScoped$(`
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type=number]{
        -moz-appearance: textfield;
    }
  `);

  return (
    <div class="flex w-full flex-grow items-center justify-center gap-[2%] py-1.5">
      <label class="w-6/12 text-left text-slate-100" for={name}>
        Card Count:
      </label>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-center justify-center text-center">
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
        <input
          onInput$={debouncedSetSize$}
          ref={inputRef}
          type="number"
          max={GAME.DECK_SIZE_MAX}
          min={GAME.DECK_SIZE_MIN}
          step="2"
          class="w-8 bg-slate-700 text-center text-slate-100 h-6"
          value={props.userSettings.value.deck.size}
        />
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
