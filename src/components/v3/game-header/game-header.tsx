import type { PropFunction } from "@builder.io/qwik";
import { Slot, component$, useContext } from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Button from "../button/button";
import { FormattedTime } from "../game-end-modal/game-end-modal";

const CODE_PADDING = "px-1.5 md:px-3 lg:px-4";
const CODE_TEXT_LIGHT = "text-slate-200";
const CODE_TEXT_DARK = "text-slate-400";

const DECIMALS = 1;

const roundToDecimals = (number: number, decimals: number = DECIMALS) =>
  Math.round(number * 10 ** decimals) / 10 ** decimals;

export default component$(
  ({ showSettings$ }: { showSettings$: PropFunction<() => void> }) => {
    const appStore = useContext(AppContext);

    return (
      <header
        class={`mx-auto text-center text-xs md:text-sm flex justify-around w-full h-min`}
      >
        <HeaderSection classes="justify-start md:justify-around">
          {appStore.settings.interface.showSelectedIds && (
            <SelectionHeaderComponent />
          )}
          {/* <LockedIndicator name="deck" isLocked={appStore.settings.deck.isLocked} /> */}
          {appStore.settings.interface.showDimensions && (
            <DimensionsHeaderComponent />
          )}
          <TimerHeaderComponent />
        </HeaderSection>
        <Button text="Settings" onClick$={showSettings$} />
        <HeaderSection>
          <code
            class={` bg-slate-800 ${CODE_TEXT_LIGHT} flex gap-1 ${CODE_PADDING}`}
          >
            <div
              class={` flex flex-col flex-grow justify-evenly text-right ${CODE_TEXT_DARK}`}
            >
              <span>pairs:</span>
              <span>mismatches:</span>
            </div>
            <div class="flex flex-col flex-grow justify-evenly">
              <span>
                {appStore.game.successfulPairs.length}/
                {appStore.settings.deck.size / 2}{" "}
              </span>

              <span>
                {appStore.game.mismatchPairs.length}
                {appStore.settings.maxAllowableMismatches === -1
                  ? ""
                  : `/${appStore.settings.maxAllowableMismatches}`}
              </span>
            </div>
          </code>
        </HeaderSection>
      </header>
    );
  }
);

const SelectionHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <code
      class={` bg-slate-800 flex flex-col text-center text-slate-200 ${CODE_PADDING}`}
    >
      <span class="w-min mx-auto">cards selected:</span>
      <div class="grid grid-cols-[3.6em_0.6em_3.6em] mx-auto">
        <span>{appStore.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{appStore.game.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});

// slot requires "component$", can't do inliner
const HeaderSection = component$(
  ({ classes = "justify-center" }: { classes?: string }) => {
    return (
      <div class={`w-full flex gap-3 ${classes} `}>
        <Slot />
      </div>
    );
  }
);

const LockedIndicator = ({
  name,
  isLocked,
}: {
  name: string;
  isLocked: boolean;
}) => {
  return (
    <>
      {isLocked && (
        <code class="bg-slate-800 text-slate-200">{name} locked</code>
      )}
    </>
  );
};

const DimensionsHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <code
      class={` bg-slate-800 flex gap-1.5 text-center ${CODE_TEXT_LIGHT} ${CODE_PADDING}`}
    >
      <div class={` flex flex-col ${CODE_TEXT_DARK} items-end `}>
        <span>header~</span>
        <span>board:</span>
        <span>window:</span>
      </div>
      <div class="flex gap-0.5">
        <div class="flex flex-col text-right">
          <span>{roundToDecimals(appStore.boardLayout.width)}</span>
          <span>{roundToDecimals(appStore.boardLayout.width)}</span>
          <span>{roundToDecimals(window.innerWidth)}</span>
        </div>
        <div class={` flex flex-col ${CODE_TEXT_DARK}`}>
          <span>x</span>
          <span>x</span>
          <span>x</span>
        </div>
        <div class={` text-left flex flex-col `}>
          <span>
            {roundToDecimals(window.innerHeight - appStore.boardLayout.height)}
          </span>
          <span>{roundToDecimals(appStore.boardLayout.height)}</span>
          <span>{roundToDecimals(window.innerHeight)}</span>
        </div>
      </div>
    </code>
  );
});

export const TimerHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);

  return (
    <code
      class={` bg-slate-800 flex gap-1.5 text-center ${CODE_TEXT_LIGHT} ${CODE_PADDING}`}
    >
      <FormattedTime timeMs={appStore.game.time.total} />
    </code>
  );
});
