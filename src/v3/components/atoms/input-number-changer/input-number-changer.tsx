import { $, Slot, component$ } from "@builder.io/qwik";

import type { ClassList, Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";

const BUTTON_STYLES: ClassList =
  "p-0 w-6 h-6 bg-slate-700 border-slate-500 text-2xl rounded border flex justify-center items-center disabled:bg-slate-800 disabled:border-slate-500 disabled:text-slate-300";

type InputNumberChanger = {
  unsavedUserSettings: Signal<iUserSettings>;
  isLocked?: boolean;
  htmlFor?: string;
  name: string;
  propertyPath: string; // e.g. interface.brightness, deck.size
  min: number;
  max: number;
  label: string;
  step: number;
};
export default component$<InputNumberChanger>(
  ({
    unsavedUserSettings,
    isLocked,
    htmlFor,
    name,
    propertyPath,
    min,
    max,
    label,
    step,
  }) => {
    const name2 = `${name}-changer${htmlFor ? `-${htmlFor}` : ""}`;
    const pathParts = propertyPath.split(".");
    console.log({ pathParts });

    const handleChangeSize$ = $((_: Event, t: HTMLButtonElement) => {
      const oldValue = unsavedUserSettings.value[pathParts[0]][pathParts[1]];
      console.log({ oldValue });
      let newValue =
        oldValue + (t.name === `${name2}-increment` ? step : -step);
      if (newValue > max || newValue < min) {
        newValue = oldValue;
      }

      unsavedUserSettings.value = {
        ...unsavedUserSettings.value,
        [pathParts[0]]: {
          ...unsavedUserSettings.value[pathParts[0]],
          [pathParts[1]]: newValue,
        },
      };
      console.log(unsavedUserSettings.value.interface.brightness);
    });

    return (
      <div class="flex w-full flex-grow items-center justify-center gap-[2%] py-1.5">
        <label class="w-6/12 text-left text-slate-100" for={name2}>
          {label}:
        </label>
        <div class="grid grid-cols-3 items-center justify-center text-center">
          <button
            name={name2 + "-decrement"}
            id={name2 + "-decrement"}
            class={BUTTON_STYLES}
            onClick$={handleChangeSize$}
            disabled={
              isLocked ||
              unsavedUserSettings.value[pathParts[0]][pathParts[1]] <= min
            }
          >
            -
          </button>
          {unsavedUserSettings.value[pathParts[0]][pathParts[1]]}
          <button
            name={name + "-increment"}
            id={name + "-increment"}
            class={BUTTON_STYLES}
            onClick$={handleChangeSize$}
            disabled={
              isLocked ||
              unsavedUserSettings.value[pathParts[0]][pathParts[1]] >= max
            }
          >
            +
          </button>
        </div>
        <Slot />
      </div>
    );
  },
);
