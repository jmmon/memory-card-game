import type { PropFunction, QRL, QwikChangeEvent } from "@builder.io/qwik";
import {
  component$,
  $,
  useStyles$,
  useContext,
  Slot,
  useTask$,
  useSignal,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Modal from "../modal/modal";
import Button from "../button/button";
import { DEFAULT_CARD_COUNT } from "../v3-game/v3-game";

const COLUMN_GAP = "gap-0.5 md:gap-1";

export function useDebounce<T>(
  action: QRL<(newValue: T) => void>,
  delay: number = 500
) {
  const signal = useSignal<T>();
  const setValue = $((newValue: T) => {
    signal.value = newValue;
  });

  // track value changes to restart the timer
  useTask$((taskCtx) => {
    taskCtx.track(() => signal.value);

    if (signal.value === undefined) return;

    const timer = setTimeout(() => {
      action(signal.value as T);
    }, delay);

    taskCtx.cleanup(() => clearTimeout(timer));
  });

  return setValue;
}

export default component$(() => {
  const appStore = useContext(AppContext);

  const hideModal = $(() => {
    appStore.settings.modal.isShowing = false;
  });

  const debounceUpdateDeckSize = useDebounce<number>(
    $((value) => {
      appStore.settings.deck.size = value;
    }),
    500
  );

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
    <Modal
      isShowing={appStore.settings.modal.isShowing}
      hideModal={hideModal}
      bgClasses=""
      title="Game Settings"
    >
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
            <span class="tooltiptext">Force board size to recalculate.</span>
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
                tooltip="Prevent deck size from changing."
                onChange$={(e) => {
                  appStore.settings.deck.isLocked = (
                    e.target as HTMLInputElement
                  ).checked;
                }}
              />
            </SettingsRow>

            <SettingsRow>
              <div class="flex flex-grow gap-[2%] items-center tooltip w-full">
                <label class="w-4/12" for="deck-card-count text-left">
                  Deck Card Count:
                </label>
                <input
                  name="deck-card-count"
                  id="deck-card-count"
                  class="flex-grow w-8/12"
                  type="range"
                  min={appStore.settings.deck.minimumCards}
                  max={appStore.settings.deck.maximumCards}
                  step="2"
                  value={DEFAULT_CARD_COUNT}
                  onInput$={(e: Event) => {
                    debounceUpdateDeckSize(
                      Number((e.target as HTMLInputElement).value)
                    );
                  }}
                  disabled={appStore.settings.deck.isLocked}
                />
                <span class="tooltiptext">Number of cards in the deck.</span>
              </div>
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
      </div>
    </Modal>
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
            onChange$={(e) => onChange$(e)}
            checked={value}
          />
        </label>
        {tooltip && <span class="tooltiptext">{tooltip}</span>}
      </div>
    );
  }
);
