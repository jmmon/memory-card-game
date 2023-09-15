import type { PropFunction } from "@builder.io/qwik";
import {
  $,
  Slot,
  component$,
  useComputed$,
  useContext,
  useStylesScoped$,
} from "@builder.io/qwik";
import Button from "../button/button";
import { GameContext } from "~/v3/context/gameContext";
import { useTimeout } from "~/v3/utils/useTimeout";
import { FormattedTime } from "../formatted-time/formatted-time";

const CODE_PADDING = "px-1.5 md:px-3 lg:px-4";
const CODE_TEXT_LIGHT = "text-slate-200";
const CODE_TEXT_DARK = "text-slate-400";

const DECIMALS = 1;

const roundToDecimals = (number: number, decimals: number = DECIMALS) =>
  Math.round(number * 10 ** decimals) / 10 ** decimals;

const COUNTER_ANIMATE_DURATION = 400;

const SCORE_ANIMATION_CLASSES = "animate text-slate-100";

export default component$(
  ({ showSettings$ }: { showSettings$: PropFunction<() => void> }) => {
    const gameContext = useContext(GameContext);

    useTimeout(
      $(() => {
        gameContext.interface.successAnimation = false;
      }),
      useComputed$(() => gameContext.interface.successAnimation),
      COUNTER_ANIMATE_DURATION
    );

    useTimeout(
      $(() => {
        gameContext.interface.mismatchAnimation = false;
      }),
      useComputed$(() => gameContext.interface.mismatchAnimation),
      COUNTER_ANIMATE_DURATION
    );

    useStylesScoped$(`
      .success, .mismatch {
        transition: all ${
          COUNTER_ANIMATE_DURATION * 0.8
        }ms cubic-bezier(0.2,1.29,0.42,1.075);
      /*   transition: all 0.2s ease-in-out; */
      }

      .success.animate {
        transform: translateY(20%) scale(1.3);
        background-color: var(--success-color);
        box-shadow: 0 0 0.2em 0.8em var(--success-color);
      }

      .mismatch.animate {
        transform:  translateY(-20%) scale(1.3);
        background-color: var(--mismatch-color);
        box-shadow: 0 0 0.2em 0.8em var(--mismatch-color);
      }
    `);

    const animateMismatch = useComputed$(() => {
      const extraMismatchFeatures =
        gameContext.settings.maxAllowableMismatches !== -1 ||
        gameContext.settings.reorgnanizeBoardOnMismatch ||
        gameContext.settings.shufflePickedAfterMismatch ||
        gameContext.settings.shuffleBoardAfterMismatches;
      return gameContext.interface.mismatchAnimation && extraMismatchFeatures;
    });
    return (
      <header
        class={`mx-auto text-center text-xs md:text-sm flex justify-around w-full h-min`}
      >
        <HeaderSection classes="justify-around">
          {gameContext.settings.interface.showSelectedIds && (
            <SelectionHeaderComponent />
          )}
          {gameContext.settings.interface.showDimensions && (
            <DimensionsHeaderComponent />
          )}
          <TimerHeaderComponent />
        </HeaderSection>
        <Button onClick$={showSettings$}>Settings</Button>
        <HeaderSection>
          <code
            class={`bg-slate-800 ${CODE_TEXT_LIGHT} flex flex-col w-[11em] gap-1 ${CODE_PADDING}`}
          >
            <div
              class={`rounded success ${
                gameContext.interface.successAnimation
                  ? SCORE_ANIMATION_CLASSES
                  : ""
              } flex gap-2 ${CODE_TEXT_DARK}`}
            >
              <span class={`w-8/12 flex-grow flex-shrink-0 text-right`}>
                pairs:
              </span>
              <span
                class={`text-slate-100 w-4/12 flex-grow flex-shrink-0 text-left`}
              >
                {gameContext.game.successfulPairs.length}
                <span class="text-slate-400">
                  /{gameContext.settings.deck.size / 2}
                </span>
              </span>
            </div>

            <div
              class={`rounded mismatch ${
                animateMismatch.value ? SCORE_ANIMATION_CLASSES : ""
              } flex gap-2 ${CODE_TEXT_DARK}`}
            >
              <span class="w-8/12 flex-grow flex-shrink-0 text-right">
                mismatches:
              </span>
              <span class="text-slate-100 w-4/12 flex-grow flex-shrink-0 text-left">
                {gameContext.game.mismatchPairs.length}
                <span class="text-slate-400">
                  {gameContext.settings.maxAllowableMismatches === -1
                    ? ""
                    : `/${gameContext.settings.maxAllowableMismatches}`}
                </span>
              </span>
            </div>
          </code>
        </HeaderSection>
      </header>
    );
  }
);

const SelectionHeaderComponent = component$(() => {
  const gameContext = useContext(GameContext);
  return (
    <code
      class={` bg-slate-800 flex flex-col text-center text-slate-200 ${CODE_PADDING}`}
    >
      <span class="w-min mx-auto">cards selected:</span>
      <div class="grid grid-cols-[3.6em_0.6em_3.6em] mx-auto">
        <span>{gameContext.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{gameContext.game.selectedCardIds[1] ?? "-"}</span>
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

// const LockedIndicator = ({
//   name,
//   isLocked,
// }: {
//   name: string;
//   isLocked: boolean;
// }) => {
//   return (
//     <>
//       {isLocked && (
//         <code class="bg-slate-800 text-slate-200">{name} locked</code>
//       )}
//     </>
//   );
// };

const DimensionsHeaderComponent = component$(() => {
  const gameContext = useContext(GameContext);
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
          <span>{roundToDecimals(gameContext.boardLayout.width)}</span>
          <span>{roundToDecimals(gameContext.boardLayout.width)}</span>
          <span>{roundToDecimals(window.innerWidth)}</span>
        </div>
        <div class={` flex flex-col ${CODE_TEXT_DARK}`}>
          <span>x</span>
          <span>x</span>
          <span>x</span>
        </div>
        <div class={` text-left flex flex-col `}>
          <span>
            {roundToDecimals(
              window.innerHeight - gameContext.boardLayout.height
            )}
          </span>
          <span>{roundToDecimals(gameContext.boardLayout.height)}</span>
          <span>{roundToDecimals(window.innerHeight)}</span>
        </div>
      </div>
    </code>
  );
});

export const TimerHeaderComponent = component$(() => {
  const gameContext = useContext(GameContext);

  return (
    <code
      class={` bg-slate-800 flex gap-1.5 text-center items-center ${CODE_TEXT_LIGHT} ${CODE_PADDING}`}
    >
      <span
        class={
          gameContext.timer.state.isPaused && gameContext.timer.state.blink
            ? "opacity-0"
            : ""
        }
      >
        <FormattedTime timeMs={gameContext.timer.state.time} limit={2} />
      </span>
    </code>
  );
});
