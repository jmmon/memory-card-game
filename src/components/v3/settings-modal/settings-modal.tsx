import type { Signal, PropFunction, QwikChangeEvent } from "@builder.io/qwik";
import {
  component$,
  useStyles$,
  useContext,
  Slot,
  useSignal,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Modal from "../modal/modal";
import Button from "../button/button";
import { AppSettings } from "../v3-game/v3-game";
import { FormattedTime } from "../game-end-modal/game-end-modal";

const COLUMN_GAP = "gap-0.5 md:gap-1";
const REQUIRES_RESTART = "Requires restart to take effect.";

export default component$(() => {
  const appStore = useContext(AppContext);

  // TODO:
  // pause timer when settings is open
  // - store total game time
  // when starting game, or when resuming from settings, save the time.start
  // when ending game, or when opening settings, note the time
  // - then calculate that session's game time, and add it on to time.total
  // (then resume again, resets time.start to Date.now() for next session)

  // useTask$((taskCtx) => {
  // taskCtx.track(() => appStore.settings.modal.isShowing);
  //   const prevTime = appStore.game.time.pausedCount;
  // });
  return (
    <Modal
      isShowing={appStore.interface.settingsModal.isShowing}
      hideModal$={() => {
        appStore.interface.settingsModal.isShowing = false;
        appStore.createTimestamp({paused: false});
        console.log("hideModal fn runs");
      }}
      title="Game Settings"
    >
      <SettingsContent />
    </Modal>
  );
});

export const SettingsContent = component$(() => {
  const appStore = useContext(AppContext);

  const newSettings = useSignal<AppSettings>({
    ...appStore.settings,
  });

  useStyles$(`
    .tooltip {
      position: relative;
      cursor: pointer;
      font-size: clamp(0.7rem, 1vw, 1rem);
    }

    .tooltip label,
    .tooltip input {
      cursor: pointer;
    }

    .tooltip .tooltiptext {
      visibility: hidden;
      width: 100%;
      background-color: #222;
      border: 1px solid #111;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px 5px;

      /* position the tooltip */
      position: absolute;
      z-index: 10;
      top: 100%;
    }

    .tooltip:hover .tooltiptext {
      visibility: visible;
    }
  `);
  return (
    <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
      <div class="flex-grow flex justify-evenly items-center">
        <div class="justify-center flex gap-[2%] items-center tooltip">
          <Button
            text="Shuffle Deck"
            onClick$={() => appStore.shuffleCardPositions()}
          />
          <span class="tooltiptext">Shuffle the card positions.</span>
        </div>
        <div class="justify-center flex  gap-[2%] items-center tooltip">
          <Button
            text="Refresh Board"
            onClick$={() => {
              appStore.settings.resizeBoard = !appStore.settings.resizeBoard;
              console.log(appStore.settings.resizeBoard);
            }}
          />
          <span class="tooltiptext">
            Force board dimensions to recalculate.
          </span>
        </div>
      </div>

      <div class={` flex flex-col md:flex-row justify-center ${COLUMN_GAP} `}>
        <div class={`flex-grow flex flex-col ${COLUMN_GAP}  items-center`}>
          {/* left column */}
          <SettingsRow>
            <Lock
              text="Lock Board:"
              tooltip="Prevent board layout from changing."
              onChange$={(e) => {
                appStore.boardLayout.isLocked = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
          </SettingsRow>
          <SettingsRow>
            <Lock
              text="Lock Deck:"
              tooltip={`Prevent deck size from changing. ${REQUIRES_RESTART}`}
              onChange$={(e) => {
                newSettings.value = {
                  ...newSettings.value,
                  deck: {
                    ...newSettings.value.deck,
                    isLocked: (e.target as HTMLInputElement).checked,
                  },
                };
              }}
            />
          </SettingsRow>

          <SettingsRow>
            <DeckSizeSlider
              newSettings={newSettings}
              isLocked={appStore.settings.deck.isLocked}
            />
          </SettingsRow>

          <SettingsRow>
            <Lock
              text="Show Selected Card Ids"
              tooltip="Show unique card ids for currently selected cards"
              onChange$={(e) => {
                appStore.settings.interface.showSelectedIds = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
          </SettingsRow>
          <SettingsRow>
            <Lock
              text="Show Dimensions"
              tooltip="Show board layout and window dimensions."
              onChange$={(e) => {
                appStore.settings.interface.showDimensions = (
                  e.target as HTMLInputElement
                ).checked;
              }}
              value={appStore.settings.interface.showDimensions}
            />
          </SettingsRow>
          <SettingsRow>
            <div class="w-full flex justify-between tooltip">
              <label>Played Time:</label>
              <FormattedTime timeMs={appStore.game.time.total} />
              <span class="tooltiptext">
                Total un-paused play time for this round.
              </span>
            </div>
          </SettingsRow>
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
        {/*         value={Number(appStore.settings.shuffleBoardAfterMismatches)} */}
        {/*         onChange$={(e, t: HTMLInputElement) => { */}
        {/*           console.log("input:", t.value); */}
        {/*           appStore.settings.shuffleBoardAfterMismatches = Number( */}
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
        {/*         appStore.settings.shuffleBoardAfterPair = ( */}
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
        {/*         appStore.settings.shuffleBoardAfterRound = ( */}
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
        {/*         appStore.settings.shufflePickedAfterMismatch = ( */}
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
        {/*         appStore.settings.reorgnanizeBoardOnMismatch = ( */}
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
        {/*         appStore.settings.reorgnanizeBoardOnPair = ( */}
        {/*           e.target as HTMLInputElement */}
        {/*         ).checked; */}
        {/*       }} */}
        {/*     /> */}
        {/*   </SettingsRow> */}
        {/* </div> */}
      </div>

      <div class="flex-grow flex justify-evenly items-center">
        <div class="justify-center flex  gap-[2%] items-center tooltip">
          <Button
            text="Reset Game"
            onClick$={() => {
              appStore.resetGame();
            }}
          />
          <span class="tooltiptext">Force board size to recalculate.</span>
        </div>
      </div>
      <div class="flex-grow flex justify-evenly items-center">
        <div class="justify-center flex  gap-[2%] items-center tooltip">
          <Button
            text="Save And Restart"
            onClick$={() => {
              appStore.resetGame(newSettings.value);
            }}
          />
          <span class="tooltiptext">Force board size to recalculate.</span>
        </div>
      </div>
      <details class="w-full mt-2 flex flex-col gap-2 items-center">
        <summary class="p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 cursor-pointer w-max mx-auto">
          Help
        </summary>
        <ul class="text-left list-disc grid gap-2 w-full">
          <li>Select cards by clicking on them.</li>
          <li>
            Cards are matched when the two selected cards have the same number
            and the color matches (i.e. red with red, black with black).
          </li>
          <li>
            Game time starts when you select your first card, and stops when the
            last pair of cards disappears.
          </li>
        </ul>
      </details>
    </div>
  );
});

export const SettingsRow = component$(
  ({ disabled = false }: { disabled?: boolean }) => {
    return (
      <div class="flex flex-grow justify-center w-full border border-slate-800 rounded-lg py-[2%] px-[4%]">
        <div
          class={`w-full flex flex-grow justify-between gap-1 md:gap-2 ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <Slot />
        </div>
      </div>
    );
  }
);

const Lock = component$(
  ({
    text,
    onChange$,
    classes,
    tooltip,
    disabled = false,
    value = false,
  }: {
    text: string;
    onChange$: PropFunction<(e: QwikChangeEvent) => void>;
    classes?: string;
    tooltip?: string;
    disabled?: boolean;
    value?: boolean;
  }) => {
    return (
      <div
        class={`${tooltip ? "tooltip" : ""} ${
          classes ? classes : ""
        } flex gap-2 items-center justify-between w-full `}
      >
        <label
          for={text}
          class="flex gap-2 items-center justify-between w-full mr-2 mb-1 cursor-pointer text-left"
        >
          {text}
          <input
            disabled={disabled}
            class="cursor-pointer w-6 h-6"
            type="checkbox"
            id={text}
            name={text}
            onChange$={onChange$}
            checked={value}
          />
        </label>
        {tooltip && <span class="tooltiptext">{tooltip}</span>}
      </div>
    );
  }
);

export const DeckSizeSlider = component$<{
  newSettings: Signal<AppSettings>;
  isLocked?: boolean;
}>((props) => {
  return (
    <div class="flex flex-grow gap-[2%] items-center tooltip w-full py-1.5">
      <label class="w-4/12 text-left" for="deck-card-count-settings">
        Deck Card Count:
      </label>
      <input
        name="deck-card-count-settings"
        id="deck-card-count-settings"
        class="flex-grow w-8/12"
        type="range"
        min={props.newSettings.value.deck.MINIMUM_CARDS}
        max={props.newSettings.value.deck.MAXIMUM_CARDS}
        step="2"
        value={props.newSettings.value.deck.size}
        onInput$={(e: Event) => {
          props.newSettings.value = {
            ...props.newSettings.value,
            deck: {
              ...props.newSettings.value.deck,
              size: Number((e.target as HTMLInputElement).value),
            },
          };
        }}
        disabled={props.isLocked}
      />
      <span class="tooltiptext">
        {props.newSettings.value.deck.size} - Number of cards in the deck.{" "}
        {REQUIRES_RESTART}
      </span>
    </div>
  );
});
