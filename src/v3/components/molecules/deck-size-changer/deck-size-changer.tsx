import { $, component$, useSignal, useStylesScoped$ } from "@builder.io/qwik";
import GAME from "~/v3/constants/game";

import type { ClassList, Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";
import { useDebouncerQrl } from "~/v3/hooks/useDebouncer";
import MinusIcon from "~/media/icons/minus.svg?jsx";
import PlusIcon from "~/media/icons/plus.svg?jsx";
import { selectFieldOnFocus$ } from "~/v3/handlers/handlers";

const BUTTON_STYLES: ClassList =
  "p-0 w-6 h-6 bg-slate-700 border-slate-500 text-slate-100 text-2xl rounded border flex justify-center items-center text-center align-middle disabled:opacity-30 disabled:scale-[0.85]";

type DeckSizeChangerProps = {
  userSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  name?: string;
};
export default component$<DeckSizeChangerProps>(({ userSettings, isLocked, name = "" }) => {
  // hide the up/down arrows on the input
  useStylesScoped$(`
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type=number] {
        -moz-appearance: textfield;
    }
  `);

  const _name = `deck-size-changer${name ? `-${name}` : ""}`;
  const inputRef = useSignal<HTMLInputElement>();
  
  const setValue$ = $((newValue: number) => {
    // modify the signal directly. This is the actual value being used!
    userSettings.value = {
      ...userSettings.value,
      deck: {
        ...userSettings.value.deck,
        size: newValue,
      },
    };
    
    // for input display:
    inputRef.value!.value = String(newValue);
  });

  const handleChangeSize$ = $((_: Event, t: HTMLButtonElement | HTMLInputElement) => {
    let newValue = userSettings.value.deck.size;
    if (t.tagName === 'BUTTON') {
      newValue += (t.name === `${_name}-increment` ? 2 : -2);
    } else {
      // is input change
      if (t.value === "") return;
      newValue = Number(t.value);
      if (newValue % 2 !== 0) {
        newValue++;
      }
    }

    newValue = Math.min(
      Math.max(GAME.DECK_SIZE_MIN, newValue),
      GAME.DECK_SIZE_MAX,
    );

    setValue$(newValue);
  });

  const debouncedSetSize$ = useDebouncerQrl(handleChangeSize$, 500);

  return (
    <div class="flex w-full flex-grow items-center justify-center gap-[2%] py-1.5">
      <label class="w-6/12 text-left text-slate-100" for={_name}>
        Card Count:
      </label>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-center justify-center text-slate-100">
        <button
          type="button"
          name={_name + "-decrement"}
          class={BUTTON_STYLES}
          onClick$={handleChangeSize$}
          disabled={
            isLocked ||
            userSettings.value.deck.size <= GAME.DECK_SIZE_MIN
          }
        >
          <MinusIcon style="width: 16px; height: 16px"/>
        </button>
        <input
          onInput$={(e, t) => {
            const newValue = Number(t.value);
            if (newValue <= GAME.DECK_SIZE_MAX && newValue >= GAME.DECK_SIZE_MIN) {
              console.log('setting value instantly');
              return setValue$(newValue);
            }

            console.log('value outside of range, debouncing');
            debouncedSetSize$(e, t);
          }}
          ref={inputRef}
          type="number"
          name={_name}
          id={_name}
          max={GAME.DECK_SIZE_MAX}
          min={GAME.DECK_SIZE_MIN}
          step="2"
          class="w-8 bg-slate-700 text-center text-slate-100 h-6"
          value={userSettings.value.deck.size}
          onFocus$={selectFieldOnFocus$}
        />
        <button
          type="button"
          name={_name + "-increment"}
          class={BUTTON_STYLES}
          onClick$={handleChangeSize$}
          disabled={
            isLocked ||
            userSettings.value.deck.size >= GAME.DECK_SIZE_MAX
          }
        >
          <PlusIcon style="width: 16px; height: 16px"/>
        </button>
      </div>
      <InfoTooltip>
        Number of cards in the deck.
        <br />
        <div class="mt-1 text-slate-300">
          (Range: <strong>{GAME.DECK_SIZE_MIN}</strong> to{" "}
          <strong>{GAME.DECK_SIZE_MAX}</strong>)
        </div>
        <div class="mt-1 text-slate-300">
          (Hint: Type a number in the box!)
        </div>
      </InfoTooltip>
    </div>
  );
});
