import {
  component$,
  $,
  useSignal,
  Signal,
  useComputed$,
} from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import GameSettings from "~/v3/components/atomic/organisms/game-settings/game-settings";
import {
  INITIAL_GAME_SETTINGS,
  INITIAL_USER_SETTINGS,
} from "~/v3/context/initialState";
import type {  iUserSettings } from "~/v3/types/types";
import { flattenObjectToEntries } from "~/v3/utils/utils";

const LI_CLASSES = "pl-2 md:pl-4";
export default component$(() => {
  return (
    <div class="grid w-full justify-center items-center gap-8 text-slate-200">
      <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>

      <h3 class="text-center ">Goal:</h3>
      <p class="text-center text-2xl ">Eliminate all cards from the board.</p>

      <ol class=" border-box px-6 list-decimal marker:text-slate-400 text-md md:text-lg grid gap-4 w-full max-w-[50ch]">
        <li class={LI_CLASSES}>Pick two cards.</li>
        <li class={LI_CLASSES}>
          If the numbers and colors match, they're removed from the game.
        </li>
        <li class={LI_CLASSES}>Match all the cards to win!</li>
        <li class={`text-slate-500 ${LI_CLASSES}`}>
          (COMING SOON:) Save your score, and see how you compare to other
          players!
        </li>
      </ol>

      <div class="flex flex-col items-center">
        <ChangeGameSettings />

        <br />
        <br />

        <Link
          href="/older-versions"
          class=" text-slate-500 text-center underline hover:text-slate-300"
        >
          Prototype versions...
        </Link>
      </div>
    </div>
  );
});



export const getNonDefaultQueryParams2 = (
  newSettings: iUserSettings,
  initialSettings: iUserSettings
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

export const ChangeGameSettings = component$(() => {
  const showSettings = useSignal(false);
  const unsavedSettings = useSignal<iUserSettings>({
    ...INITIAL_USER_SETTINGS,
  });

  const compQParamsString = useComputed$<string>(() => {
    const result = getNonDefaultQueryParams2(
      unsavedSettings.value,
      INITIAL_USER_SETTINGS
    );
    console.log('computed', { result });
    return result;
  });

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
          // computedQueryParamsString.value !== ""
          //   ? "/?" + computedQueryParamsString.value
          //   : ""
        }`}
        class="text-slate-200 hover:text-white text-4xl py-4 px-8 border-slate-200 rounded-lg bg-slate-800 hover:bg-slate-700"
      >
        Play
      </Link>

      <div class={`flex flex-col items-center`}>
        <button
          class="border-none"
          onClick$={() => {
            showSettings.value = !showSettings.value;
          }}
        >
          Change Settings
        </button>
        <div
          class={`change-settings transition-all ${
            showSettings.value
              ? "pointer-events-auto h-[20rem] z-[1000] overflow-auto"
              : "pointer-events-none h-0 z-[-1] overflow-hidden"
          }`}
        >
          <GameSettings
            saveSettings$={saveSettings$}
            gameTime={0}
            unsavedUserSettings={unsavedSettings}
            gameSettings={INITIAL_GAME_SETTINGS}
          />
        </div>
      </div>
    </>
  );
});

export const LinkLi = ({
  href,
  pretext,
  text,
}: {
  href: string;
  pretext: string;
  text: string;
}) => (
  <li class="hover:underline">
    <Link href={href}>
      <div class="w-8 text-slate-500 inline-block text-right mr-2">
        {pretext}:
      </div>
      <span>{text}</span>
    </Link>
  </li>
);

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
