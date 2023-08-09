import {
  component$,
  $,
  useStyles$,
  useContext,
  PropFunction,
  QwikChangeEvent,
  Slot,
} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Modal from "../modal/modal";
import Button from "../button/button";

export default component$(() => {
  const appStore = useContext(AppContext);

  const hideModal = $(() => {
    appStore.settings.modal.isShowing = false;
  });

  useStyles$(`
  .tooltip {
    position: relative;
    cursor: pointer;
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
    z-index: 1;
    top: 100%;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
  }
`);

  return (
    <Modal isShowing={appStore.settings.modal.isShowing} hideModal={hideModal}>
      <div class="flex gap-8 flex-col">
        <SettingsRow disabled={true}>
          <div class="flex gap-4 items-center tooltip">
            <label>Shuffle Cards After N Mismatches:</label>
            <input
              disabled={true}
              name="deck-shuffle-mismatches"
              id="deck-shuffle-mismatches"
              class="bg-slate-700 border border-slate-800 p-2 rounded text-center"
              type="number"
              min="0"
              max="20"
              step="1"
              value={Number(appStore.settings.shuffleBoardAfterMismatches)}
              onChange$={(e, t: HTMLInputElement) => {
                console.log("input:", t?.value);
                appStore.settings.shuffleBoardAfterMismatches = Number(
                  t?.value
                );
              }}
            />
            <span class="tooltiptext">
              COMING SOON: Count of how many mismatches before shuffling the
              board.
            </span>
          </div>
          <div class="w-6"></div>
          <Lock
            disabled={true}
            text="Shuffle Board After Pair:"
            tooltip="COMING SOON: After each successful match, shuffle the board."
            onChange$={(e) => {
              appStore.settings.shuffleBoardAfterPair = (
                e.target as HTMLInputElement
              ).checked;
            }}
          />
        </SettingsRow>

        <SettingsRow disabled={true}>
          <Lock
            disabled={true}
            text="Shuffle Board After Round:"
            tooltip="COMING SOON: After each round (success or mismatch), shuffle the board."
            onChange$={(e) => {
              appStore.settings.shuffleBoardAfterRound = (
                e.target as HTMLInputElement
              ).checked;
            }}
          />
          <div class="w-6"></div>
          <Lock
            disabled={true}
            text="Shuffle Picked Cards After Mismatch:"
            tooltip="COMING SOON: After mismatching a pair of cards, shuffle them with two other cards."
            onChange$={(e) => {
              appStore.settings.shufflePickedAfterMismatch = (
                e.target as HTMLInputElement
              ).checked;
            }}
          />
        </SettingsRow>

        <SettingsRow disabled={true}>
          <Lock
            disabled={true}
            text="Reorganize Board After Mismatch:"
            tooltip="COMING SOON: After mismatching a pair, reorganize the board to fill in gaps and adjust to window size."
            onChange$={(e) => {
              appStore.settings.reorgnanizeBoardOnMismatch = (
                e.target as HTMLInputElement
              ).checked;
            }}
          />
          <div class="w-6"></div>
          <Lock
            disabled={true}
            text="Reorganize Board After Pair:"
            tooltip="COMING SOON: After a successful pair, reorganize the board to fill in gaps and adjust to window size."
            onChange$={(e) => {
              appStore.settings.reorgnanizeBoardOnPair = (
                e.target as HTMLInputElement
              ).checked;
            }}
          />
        </SettingsRow>

        <div class="flex gap-8 justify-between">
          <div class="flex gap-8 flex-col">
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
              <div class="w-6"></div>
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
              <div class="flex gap-4 items-center tooltip">
                <label class="w-full" for="deck-card-count">
                  Deck Card Count:
                </label>
                <input
                  name="deck-card-count"
                  id="deck-card-count"
                  class="w-full"
                  type="range"
                  min={appStore.settings.deck.minimumCards}
                  max={appStore.settings.deck.maximumCards}
                  step="2"
                  value={appStore.settings.deck.size}
                  onInput$={(e, t: HTMLInputElement) => {
                    console.log("input");
                    appStore.settings.deck.size = Number(t?.value);
                  }}
                  disabled={appStore.settings.deck.isLocked}
                />
                <span class="tooltiptext">Number of cards in the deck.</span>
              </div>
            </SettingsRow>
          </div>

          <div class="flex gap-8 flex-col">
            <SettingsRow>
              <div class="flex gap-4 items-center tooltip">
                <Button
                  text="Shuffle Deck"
                  onClick$={() => appStore.shuffleCardPositions()}
                />
                <span class="tooltiptext">Shuffle the card positions.</span>
              </div>
            </SettingsRow>
          </div>
        </div>
      </div>
    </Modal>
  );
});

const SettingsRow = component$(
  ({ disabled = false }: { disabled?: boolean }) => {
    return (
      <div class="flex justify-center w-full border border-slate-800 rounded-lg p-6">
        <div
          class={` flex justify-between gap-2 ${disabled ? "opacity-50" : ""}`}
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
  }: {
    text: string;
    onChange$: PropFunction<(e: QwikChangeEvent) => void>;
    classes?: string;
    tooltip?: string;
    disabled?: boolean;
  }) => {
    return (
      <div
        class={`${tooltip ? "tooltip" : ""} ${
          classes ? classes : ""
        } flex gap-2 items-center justify-end `}
      >
        <label for={text} class="mr-2 mb-1 cursor-pointer">
          {text}
        </label>
        <input
          disabled={disabled}
          class="cursor-pointer w-6 h-6"
          type="checkbox"
          id={text}
          name={text}
          onChange$={(e) => onChange$(e)}
        />
        {tooltip && <span class="tooltiptext">{tooltip}</span>}
      </div>
    );
  }
);
