import { component$, $, useSignal, useComputed$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import Dropdown from "~/v3/components/molecules/dropdown/dropdown";
import GameSettings from "~/v3/components/organisms/game-settings/game-settings";
import { flattenObjectToEntries } from "~/v3/utils/utils";

import type { ClassList, Signal } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";
import Button from "~/v3/components/atoms/button/button";
import Popover from "~/v3/components/molecules/popover/popover";
import { USER_SETTINGS } from "~/v3/services/gameContext.service/initialState";

const LI_CLASSES = "pl-2 md:pl-4";

const pruneDefaultsFromQueryParams = (
  newSettings: iUserSettings,
  initialSettings: iUserSettings,
) => {
  const newFlatSettings = flattenObjectToEntries(newSettings);
  const initialFlatSettings = flattenObjectToEntries(initialSettings);

  const result: string[] = [];

  for (let i = 0; i < newFlatSettings.length; i++) {
    const [newEntryKey, newEntryValue] = newFlatSettings[i];
    const [initialEntryKey, initialEntryValue] = initialFlatSettings[i];

    if (
      newEntryKey === initialEntryKey &&
      newEntryValue !== initialEntryValue
    ) {
      result.push(`${newEntryKey}=${newEntryValue}`);
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

const SoonTm = ({ classes }: { classes?: ClassList }) => (
  <span class={`mx-[1px] ${classes}`}>
    Soon<sup class="align-[0.4em] text-[0.5em]">TM</sup>
  </span>
);
const SoonTmPopover = component$(() => {
  return (
    <Popover
      panelClasses="max-w-[80vw]"
      rootClasses="inline mx-[-.3em]"
      size="1.5em"
    >
      <sup class="text-[.5em] align-super text-slate-500" q:slot="trigger">
        TM
      </sup>
      <>
        <p class="text-sm">
          "<SoonTm />" does not imply any particular date, time, decade,
          century, or millenia in the past, present, and certainly not the
          future. "Soon" shall make no contract or warranty between NomadCoder
          and the end user. "Soon" will arrive some day. NomadCoder{" "}
          <em>does</em> guarantee that "soon" will be here before the end of
          time. Maybe. Do not make plans based on "soon" as NomadCoder will not
          be liable for any misuse, use, or even casual glancing at "soon."
        </p>
        <br />
        <p class="text-sm text-slate-400">
          Borrowed with love from Blizzard Entertainment.
        </p>
        <p class="mt-1 text-xs text-slate-400">
          "<SoonTm />: Copyright pending 2004-2005 Blizzard Entertainment, Inc.
          All rights reserved."
        </p>
      </>
    </Popover>
  );
});

const Instructions = () => {
  const actionString = "Tap/Click";
  return (
    <>
      <h3 class="text-center text-2xl text-slate-300">Goal:</h3>
      <p class="text-center text-3xl mt-[-2rem]">Clear the board to win!</p>

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
            <strong>2</strong> of <strong>Hearts</strong> with{" "}
            <strong>2</strong> of <strong>Diamonds</strong>,)
          </code>{" "}
          <br />
          ...you found a <strong>pair</strong> and they're removed from the
          board!
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
          COMING SOON
          <SoonTmPopover />: Save your score, and see how you compare to other
          players!
        </li>
      </ul>
    </>
  );
};

export const GameStarter = component$(() => {
  const unsavedSettings = useSignal<iUserSettings>(USER_SETTINGS);

  // all settings which were changed from initial values
  const compQParamsString = useComputed$<string>(() => {
    const params = pruneDefaultsFromQueryParams(
      unsavedSettings.value,
      USER_SETTINGS,
    );
    return params;
  });

  // reset the UI to the new/initial settings when finished
  const saveSettings$ = $((newSettings?: Signal<iUserSettings>) => {
    unsavedSettings.value = newSettings?.value
      ? newSettings.value
      : USER_SETTINGS;
  });

  const playHref = useComputed$(
    () =>
      `/game${
        compQParamsString.value !== "" ? "/?" + compQParamsString.value : ""
      }`,
  );

  return (
    <>
      <Link
        href={playHref.value}
        class="mx-auto rounded-lg border border-slate-600 bg-slate-800 px-8 py-4 text-4xl text-slate-200 focus:bg-slate-700 focus:text-white hover:bg-slate-700 hover:text-white"
      >
        Play
      </Link>

      <Dropdown buttonText="Change Settings">
        <GameSettings unsavedUserSettings={unsavedSettings}>
          <div
            q:slot="footer"
            class="mt-5 flex flex-grow items-center justify-around"
          >
            <Button onClick$={saveSettings$} classes="min-w-[5em]">
              <span class="text-slate-100">Reset</span>
            </Button>
            <Link
              class="button p-2 min-w-[5em] border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 "
              href={playHref.value}
            >
              <span class="text-slate-100">Play!</span>
            </Link>
          </div>
        </GameSettings>
      </Dropdown>
    </>
  );
});

export default component$(() => {
  return (
    <div class="flex h-screen flex-col items-center justify-between ">
      <div class="grid w-full max-w-[600px] items-center justify-center gap-8 text-slate-200">
        <h1 class="text-center text-4xl text-slate-500">Memory Card Game</h1>
        <Instructions />

        <GameStarter />
      </div>

      <div class="mt-6 flex flex-col items-center">
        <Link
          href="/older-versions"
          class="p-2 text-center text-slate-500 underline hover:text-slate-300"
        >
          Prototype versions...
        </Link>
        <Link href="/cards" class="p-2 text-center text-slate-500 underline">
          Cards...
        </Link>
      </div>
    </div>
  );
});
