import { $, Slot, component$ } from "@builder.io/qwik";

import Button from "~/v3/components/atoms/button/button";
import ModalRow from "~/v3/components/atoms/modal-row/modal-row";
import InputLock from "~/v3/components/atoms/input-lock/input-lock";
import Dropdown from "~/v3/components/molecules/dropdown/dropdown";

import { settingsModalConstants } from "~/v3/constants/settings-modal-constants";
import type { iUserSettings } from "~/v3/types/types";
import type { ClassList, PropFunction, Signal } from "@builder.io/qwik";
import InfoTooltip from "../info-tooltip/info-tooltip";
import DeckSizeChanger from "../../molecules/deck-size-changer/deck-size-changer";
import InputToggle from "../../atoms/input-toggle/input-toggle";

type GameSettingsProps = {
  unsavedUserSettings: Signal<iUserSettings>;
  startShuffling$?: PropFunction<() => void>;
  classes?: ClassList;
};
export default component$<GameSettingsProps>(
  ({ unsavedUserSettings, startShuffling$, classes = "" }) => {
    const handleChange$ = $((e: Event) => {
      const properties = (e.target as HTMLInputElement).name.split(".");
      unsavedUserSettings.value = {
        ...unsavedUserSettings.value,
        [properties[0]]: {
          ...unsavedUserSettings.value[properties[0]],
          [properties[1]]: (e.target as HTMLInputElement).checked,
        },
      };
    });
    return (
      <div class={`flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%] ${classes}`}>
        {startShuffling$ !== undefined && (
          <div class="mb-4 flex flex-grow items-center justify-evenly">
            <div class="w-full grid grid-cols-[1fr_8em_1fr] items-center justify-center gap-[2%]">
              <span></span>
              <Button onClick$={() => startShuffling$()}>
                <span class="text-slate-100">Shuffle Deck</span>
              </Button>
              <InfoTooltip>Shuffle the card positions.</InfoTooltip>
            </div>
          </div>
        )}

        <div
          class={` flex flex-col md:flex-row justify-center ${settingsModalConstants.COLUMN_GAP} `}
        >
          <div
            class={`flex-grow flex flex-col ${settingsModalConstants.COLUMN_GAP}  items-center`}
          >
            <Slot name="game-stats" />

            <ModalRow>
              <DeckSizeChanger
                userSettings={unsavedUserSettings}
                isLocked={unsavedUserSettings.value.deck.isLocked}
                for="game-settings"
              />
            </ModalRow>
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

        <Help />

        <Dropdown
          buttonClasses="underline text-slate-400 hover:text-slate-50 focus:text-slate-50 bg-transparent hover:bg-transparent focus:bg-transparent"
          buttonClassesWhileOpen="text-slate-50"
          buttonText="Interface Settings"
          clearFocusOnClose={true}
          /* startAsOpen={true} */
        >
          <div class="grid gap-1 p-[min(12px,2.5vw)]">
            <ModalRow>
              <InputToggle
                text="Dark Mode (Inverted Cards)"
                onChange$={handleChange$}
                settings={unsavedUserSettings.value}
                propertyPath="interface.invertCardColors"
              >
                <InfoTooltip>
                  Inverts the cards for dark mode.
                  <br />
                  Takes effect immediately.
                </InfoTooltip>
              </InputToggle>
            </ModalRow>
          </div>
        </Dropdown>

        <Dropdown
          buttonClasses="underline text-slate-400 hover:text-slate-50 focus:text-slate-50 bg-transparent hover:bg-transparent focus:bg-transparent"
          buttonClassesWhileOpen="text-slate-50"
          buttonText="Show Developer Settings"
          clearFocusOnClose={true}
        >
          <div class="grid gap-1 p-[min(12px,2.5vw)]">
            <ModalRow>
              <InputLock
                text="Lock Board:"
                onChange$={handleChange$}
                settings={unsavedUserSettings.value}
                propertyPath="board.isLocked"
              >
                <InfoTooltip>Prevent board layout from changing.</InfoTooltip>
              </InputLock>
            </ModalRow>
            <ModalRow>
              <InputLock
                text="Lock Deck:"
                onChange$={handleChange$}
                settings={unsavedUserSettings.value}
                propertyPath="deck.isLocked"
              >
                <InfoTooltip>Prevent deck size from changing.</InfoTooltip>
              </InputLock>
            </ModalRow>

            <ModalRow>
              <InputLock
                text="Show Selected Card Ids"
                onChange$={handleChange$}
                settings={unsavedUserSettings.value}
                propertyPath="interface.showSelectedIds"
              >
                <InfoTooltip>
                  Show unique card IDs for{" "}
                  <div class="mt-1">currently selected cards</div>
                </InfoTooltip>
              </InputLock>
            </ModalRow>
            <ModalRow>
              <InputLock
                text="Show Dimensions"
                onChange$={handleChange$}
                settings={unsavedUserSettings.value}
                propertyPath="interface.showDimensions"
              >
                <InfoTooltip>
                  Show board layout and{" "}
                  <div class="mt-1">window dimensions.</div>
                </InfoTooltip>
              </InputLock>
            </ModalRow>
          </div>
        </Dropdown>

        <Slot name="footer" />
      </div>
    );
  },
);

const Help = () => (
  <Dropdown buttonText="Help" buttonClasses="w-full">
    <div class="w-full p-3">
      <ul class="grid w-full leading-5 list-disc gap-2 text-left text-slate-100">
        <li>Select cards by clicking on them.</li>
        <li>
          Cards are matched when the two selected cards have the same number and
          the color matches (i.e. red with red, black with black).
        </li>
        <li>
          Game time starts when you select your first card, and stops when the
          last pair of cards disappears.
        </li>
      </ul>
    </div>
  </Dropdown>
);
