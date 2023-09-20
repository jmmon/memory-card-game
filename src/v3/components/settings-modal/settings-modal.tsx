import type { Signal, PropFunction, QwikChangeEvent } from "@builder.io/qwik";
import { component$, useContext, Slot, useSignal } from "@builder.io/qwik";
import Modal from "../modal/modal";
import GameSettings from "./game-settings";
import { GameContext } from "~/v3/context/gameContext";
import type { iGameSettings } from "~/v3/types/types";

export const COLUMN_GAP = "gap-0.5 md:gap-1";
export const REQUIRES_RESTART = "Requires restart to take effect.";

export default component$(() => {
  const gameContext = useContext(GameContext);

  const newSettings = useSignal<iGameSettings>({
    ...gameContext.settings,
  });
  return (
    <Modal
      isShowing={gameContext.interface.settingsModal.isShowing}
      hideModal$={() => {
        newSettings.value = gameContext.settings;
        gameContext.hideSettings();
      }}
      title="Game Settings"
    >
      <GameSettings settings={newSettings} />
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

export const Lock = component$(
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
          class="text-slate-100 flex gap-2 items-center justify-between w-full mr-2 mb-1 cursor-pointer text-left"
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
  settings: Signal<iGameSettings>;
  isLocked?: boolean;
  for?: string;
}>((props) => {
  const name = `deck-size-slider${props.for ? "-" + props.for : ""}`;
  return (
    <div class="flex flex-grow gap-[2%] items-center tooltip w-full py-1.5">
      <label class="text-slate-100 w-4/12 text-left" for={name}>
        Card Count:
      </label>
      <input
        name={name}
        id={name}
        class="flex-grow w-8/12"
        type="range"
        min={props.settings.value.deck.MINIMUM_CARDS}
        max={props.settings.value.deck.MAXIMUM_CARDS}
        step="2"
        value={props.settings.value.deck.size}
        onInput$={(e: Event) => {
          props.settings.value = {
            ...props.settings.value,
            deck: {
              ...props.settings.value.deck,
              size: Number((e.target as HTMLInputElement).value),
            },
          };
        }}
        disabled={props.isLocked}
      />
      <span class="tooltiptext">
        {props.settings.value.deck.size} - Number of cards in the deck.{" "}
        {REQUIRES_RESTART}
      </span>
    </div>
  );
});
