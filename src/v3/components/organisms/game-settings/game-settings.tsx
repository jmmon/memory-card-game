import { component$ } from "@builder.io/qwik";

import Button from "~/v3/components/atoms/button/button";
import FormattedTime from "~/v3/components/molecules/formatted-time/formatted-time";
import ModalRow from "~/v3/components/atoms/modal-row/modal-row";
import InputLock from "~/v3/components/atoms/input-lock/input-lock";
import DeckSizeSlider from "~/v3/components/molecules/deck-size-slider/deck-size-slider";
import Dropdown from "~/v3/components/atoms/dropdown/dropdown";
import DropdownGrid from "~/v3/components/molecules/dropdown-grid/dropdown-grid";

import { settingsModalConstants } from "~/v3/constants/settings-modal-constants";
import type { PropFunction, Signal } from "@builder.io/qwik";
import type { iGameSettings, iUserSettings } from "~/v3/types/types";

type GameSettingsProps = {
  unsavedUserSettings: Signal<iUserSettings>;
  saveSettings$: PropFunction<(newSettings?: Signal<iUserSettings>) => void>;
  startShuffling$?: PropFunction<() => void>;
  gameTime: number;
  gameSettings: iGameSettings;
  classes?: string;
};

export default component$(
  ({
    unsavedUserSettings,
    saveSettings$,
    startShuffling$,
    gameTime,
    gameSettings,
    classes = "",
  }: GameSettingsProps) => {
    return (
      <div class={`flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%] ${classes}`}>
        {startShuffling$ !== undefined && (
          <div class="flex flex-grow items-center justify-evenly">
            <div class="tooltip flex items-center justify-center gap-[2%]">
              <Button onClick$={startShuffling$}>
                <span class="text-slate-100">Shuffle Deck</span>
              </Button>
              <span class="tooltiptext">Shuffle the card positions.</span>
            </div>
          </div>
        )}

        <div
          class={` flex flex-col md:flex-row justify-center ${settingsModalConstants.COLUMN_GAP} `}
        >
          <div
            class={`flex-grow flex flex-col ${settingsModalConstants.COLUMN_GAP}  items-center`}
          >
            {/* left column */}
            <ModalRow>
              <DeckSizeSlider
                userSettings={unsavedUserSettings}
                gameSettings={gameSettings}
                isLocked={unsavedUserSettings.value.deck.isLocked}
                for="game-settings"
              />
            </ModalRow>

            <DropdownGrid buttonText="Show Developer Settings">
              <ModalRow>
                <InputLock
                  text="Lock Board:"
                  tooltip="Prevent board layout from changing."
                  onChange$={(e) => {
                    unsavedUserSettings.value = {
                      ...unsavedUserSettings.value,
                      board: {
                        ...unsavedUserSettings.value.board,
                        isLocked: (e.target as HTMLInputElement).checked,
                      },
                    };
                  }}
                />
              </ModalRow>
              <ModalRow>
                <InputLock
                  text="Lock Deck:"
                  tooltip={`Prevent deck size from changing. ${settingsModalConstants.REQUIRES_RESTART}`}
                  onChange$={(e) => {
                    unsavedUserSettings.value = {
                      ...unsavedUserSettings.value,
                      deck: {
                        ...unsavedUserSettings.value.deck,
                        isLocked: (e.target as HTMLInputElement).checked,
                      },
                    };
                  }}
                />
              </ModalRow>

              <ModalRow>
                <InputLock
                  text="Show Selected Card Ids"
                  tooltip="Show unique card ids for currently selected cards"
                  onChange$={(e) => {
                    unsavedUserSettings.value = {
                      ...unsavedUserSettings.value,
                      interface: {
                        ...unsavedUserSettings.value.interface,
                        showSelectedIds: (e.target as HTMLInputElement).checked,
                      },
                    };
                  }}
                />
              </ModalRow>
              <ModalRow>
                <InputLock
                  text="Show Dimensions"
                  tooltip="Show board layout and window dimensions."
                  onChange$={(e) => {
                    unsavedUserSettings.value = {
                      ...unsavedUserSettings.value,
                      interface: {
                        ...unsavedUserSettings.value.interface,
                        showDimensions: (e.target as HTMLInputElement).checked,
                      },
                    };
                  }}
                  value={unsavedUserSettings.value.interface.showDimensions}
                />
              </ModalRow>
            </DropdownGrid>

            {gameTime !== 0 && (
              <ModalRow>
                <div class="tooltip flex w-full justify-between">
                  <label class="text-slate-100">Played Time:</label>
                  <FormattedTime timeMs={gameTime} />
                  <span class="tooltiptext">
                    Total un-paused play time for this round.
                  </span>
                </div>
              </ModalRow>
            )}
          </div>

          {/* right column */}
          {/* <div class={`flex-grow flex flex-col ${COLUMN_GAP} items-center`}> */}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <div class="flex gap-2 lg:gap-4 gap-[2%]items-center tooltip"> */}
          {/*       <label class="text-left"> */}
          {/*         Shuffle Cards After N Mismatches: */}
          {/*       </label> */}
          {/*       <input */}
          {/*         disabled={true} */}
          {/*         name="deck-shuffle-mismatches" */}
          {/*         id="deck-shuffle-mismatches" */}
          {/*         class="bg-slate-700 border border-slate-800 p-2 rounded text-center" */}
          {/*         type="number" */}
          {/*         min="0" */}
          {/*         max="20" */}
          {/*         step="1" */}
          {/*         value={Number(gameContext.settings.shuffleBoardAfterMismatches)} */}
          {/*         onChange$={(e, t: HTMLInputElement) => { */}
          {/*           console.log("input:", t.value); */}
          {/*           gameContext.settings.shuffleBoardAfterMismatches = Number( */}
          {/*             t.value */}
          {/*           ); */}
          {/*         }} */}
          {/*       /> */}
          {/*       <span class="tooltiptext"> */}
          {/*         COMING SOON: Count of how many mismatches before shuffling the */}
          {/*         board. */}
          {/*       </span> */}
          {/*     </div> */}
          {/*   </SettingsRow> */}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <Lock */}
          {/*       disabled={true} */}
          {/*       text="Shuffle Board After Pair:" */}
          {/*       tooltip="COMING SOON: After each successful match, shuffle the board." */}
          {/*       onChange$={(e) => { */}
          {/*         gameContext.settings.shuffleBoardAfterPair = ( */}
          {/*           e.target as HTMLInputElement */}
          {/*         ).checked; */}
          {/*       }} */}
          {/*     /> */}
          {/*   </SettingsRow> */}
          {/**/}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <Lock */}
          {/*       disabled={true} */}
          {/*       text="Shuffle Board After Round:" */}
          {/*       tooltip="COMING SOON: After each round (success or mismatch), shuffle the board." */}
          {/*       onChange$={(e) => { */}
          {/*         gameContext.settings.shuffleBoardAfterRound = ( */}
          {/*           e.target as HTMLInputElement */}
          {/*         ).checked; */}
          {/*       }} */}
          {/*     /> */}
          {/*   </SettingsRow> */}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <Lock */}
          {/*       disabled={true} */}
          {/*       text="Shuffle Picked Cards After Mismatch:" */}
          {/*       tooltip="COMING SOON: After mismatching a pair of cards, shuffle them with two other cards." */}
          {/*       onChange$={(e) => { */}
          {/*         gameContext.settings.shufflePickedAfterMismatch = ( */}
          {/*           e.target as HTMLInputElement */}
          {/*         ).checked; */}
          {/*       }} */}
          {/*     /> */}
          {/*   </SettingsRow> */}
          {/**/}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <Lock */}
          {/*       disabled={true} */}
          {/*       text="Reorganize Board After Mismatch:" */}
          {/*       tooltip="COMING SOON: After mismatching a pair, reorganize the board to fill in gaps and adjust to window size." */}
          {/*       onChange$={(e) => { */}
          {/*         gameContext.settings.reorgnanizeBoardOnMismatch = ( */}
          {/*           e.target as HTMLInputElement */}
          {/*         ).checked; */}
          {/*       }} */}
          {/*     /> */}
          {/*   </SettingsRow> */}
          {/*   <SettingsRow disabled={true}> */}
          {/*     <Lock */}
          {/*       disabled={true} */}
          {/*       text="Reorganize Board After Pair:" */}
          {/*       tooltip="COMING SOON: After a successful pair, reorganize the board to fill in gaps and adjust to window size." */}
          {/*       onChange$={(e) => { */}
          {/*         gameContext.settings.reorgnanizeBoardOnPair = ( */}
          {/*           e.target as HTMLInputElement */}
          {/*         ).checked; */}
          {/*       }} */}
          {/*     /> */}
          {/*   </SettingsRow> */}
          {/* </div> */}
        </div>

        <div class="flex flex-grow items-center justify-evenly">
          <div class="tooltip flex  items-center justify-center gap-[2%]">
            <Button onClick$={saveSettings$}>
              <span class="text-slate-100">Reset Without Saving</span>
            </Button>
            <span class="tooltiptext">
              Reset the game, keeping current settings.
            </span>
          </div>
        </div>

        <div class="flex flex-grow items-center justify-evenly">
          <div class="tooltip flex  items-center justify-center gap-[2%]">
            <Button
              onClick$={() => {
                saveSettings$(unsavedUserSettings);
              }}
            >
              <span class="text-slate-100">Save & Restart</span>
            </Button>
            <span class="tooltiptext">Save current settings and restart.</span>
          </div>
        </div>
        <details class="mt-2 flex w-full flex-col items-center gap-2">
          <summary class="mx-auto w-max cursor-pointer rounded border border-slate-200 bg-slate-700 p-2 text-slate-100 hover:bg-slate-500">
            Help
          </summary>
          <ul class="grid w-full list-disc gap-2 text-left text-slate-100">
            <li>Select cards by clicking on them.</li>
            <li>
              Cards are matched when the two selected cards have the same number
              and the color matches (i.e. red with red, black with black).
            </li>
            <li>
              Game time starts when you select your first card, and stops when
              the last pair of cards disappears.
            </li>
          </ul>
        </details>
      </div>
    );
  }
);
