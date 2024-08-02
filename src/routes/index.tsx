import { component$, $, useSignal, useComputed$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import DropdownGrid from "~/v3/components/molecules/dropdown-grid/dropdown-grid";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";
import {
  INITIAL_GAME_SETTINGS,
  INITIAL_USER_SETTINGS,
} from "~/v3/context/initialState";
import { flattenObjectToEntries } from "~/v3/utils/utils";

import type { Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import type { DocumentHead } from "@builder.io/qwik-city";

const LI_CLASSES = "pl-2 md:pl-4";

export default component$(() => {
  return (
    <div class="flex h-screen flex-col items-center justify-between ">
      <div class="grid w-full max-w-[600px] items-center justify-center gap-8 text-slate-200">
        <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>
        <Instructions />

        <GameStarter />
      </div>

      <Link
        href="/older-versions"
        class="p-2 text-center text-slate-500 underline hover:text-slate-300"
      >
        Prototype versions...
      </Link>
    </div>
  );
});

const pruneDefaultsFromQueryParams = (
  newSettings: iUserSettings,
  initialSettings: iUserSettings,
) => {
  const newFlatSettings = flattenObjectToEntries(newSettings);
  const initialFlatSettings = flattenObjectToEntries(initialSettings);

  const result: string[] = [];

  for (let i = 0; i < newFlatSettings.length; i++) {
    const newEntry = newFlatSettings[i];
    const initialEntry = initialFlatSettings[i];

    if (newEntry[0] === initialEntry[0] && newEntry[1] !== initialEntry[1]) {
      result.push(`${newEntry[0]}=${newEntry[1]}`);
    }
  }

  return result.join("&");
};

// function is_touch_enabled() {
//   return isBrowser && (
//     "ontouchstart" in window ||
//     navigator.maxTouchPoints > 0 ||
//       //ts-ignore-next-line
//     navigator?.msMaxTouchPoints > 0
//   );
// }
//
// const useActionString = () => {
//   const actionString = useSignal<"Tap/Click" | "Tap" | "Click">("Tap/Click");
//   useVisibleTask$(() => {
//     if (is_touch_enabled()) {
//       actionString.value = "Tap";
//     } else {
//       actionString.value = "Click";
//     }
//   });
//   return actionString;
// }

const Instructions = () => {
  const actionString = "Tap/Click";
  return (
  <>
    <h3 class="text-center">Goal:</h3>
    <p class="text-center text-3xl">Clear the board to win!</p>

    <ul class="mx-auto border-box text-md grid w-full max-w-[60ch] list-disc gap-4 px-6 marker:text-slate-400 md:text-lg">
      <li class={LI_CLASSES}>
        <strong>{actionString}</strong> a card to view it.
        <br />
        <strong>{actionString} again</strong> to return the card to the board.
      </li>
      <li class={LI_CLASSES}>
        After <strong>two</strong> cards have been flipped, if the{" "}
        <strong>numbers</strong> and <strong>colors</strong> match...
        <br />
        <code>
          (e.g. <strong>Queen</strong> of <strong>Spades</strong> with{" "}
          <strong>Queen</strong> of <strong>Clubs</strong>; or{" "}
          <strong>2</strong> of <strong>Hearts</strong> with <strong>2</strong>{" "}
          of <strong>Diamonds</strong>,)
        </code>{" "}
        <br />
        ...you found a <strong>pair</strong> and they're removed from the board!
      </li>
      <li class={LI_CLASSES}>
        <strong>Clear</strong> the <strong>board</strong> to{" "}
        <strong>win!</strong>
      </li>
      <li class={LI_CLASSES}>
        At the end, view your <strong>game time</strong>,{" "}
        <strong>pairs found</strong>, and <strong>mismatches found</strong>.
      </li>
      <li class={`text-slate-500 ${LI_CLASSES}`}>
        (COMING SOON:) Save your score, and see how you compare to other
        players!
      </li>
    </ul>
  </>
) };

export const GameStarter = component$(() => {
  const unsavedSettings = useSignal<iUserSettings>({
    ...INITIAL_USER_SETTINGS,
  });

  // all settings which were changed from initial values
  const compQParamsString = useComputed$<string>(() => {
    const result = pruneDefaultsFromQueryParams(
      unsavedSettings.value,
      INITIAL_USER_SETTINGS,
    );
    return result;
  });

  // reset the UI to the new/initial settings when finished
  const saveSettings$ = $((newSettings?: Signal<iUserSettings>) => {
    unsavedSettings.value = newSettings
      ? newSettings.value
      : INITIAL_USER_SETTINGS;
  });

  return (
    <>
      <Link
        href={`/game${
          compQParamsString.value !== "" ? "/?" + compQParamsString.value : ""
        }`}
        class="mx-auto rounded-lg border-slate-200 bg-slate-800 px-8 py-4 text-4xl text-slate-200 hover:bg-slate-700 hover:text-white"
      >
        Play
      </Link>

      <DropdownGrid buttonText="Change Settings">
        <GameSettings
          saveSettings$={saveSettings$}
          gameTime={0}
          unsavedUserSettings={unsavedSettings}
          gameSettings={INITIAL_GAME_SETTINGS}
        />
      </DropdownGrid>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
