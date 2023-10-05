import { $, component$, useComputed$, useContext, useStylesScoped$ } from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { GameContext } from "~/v3/context/gameContext";
import { useTimeout } from "~/v3/utils/useTimeout";

export default component$(() => {
  const gameContext = useContext(GameContext);

    useTimeout(
      $(() => {
        gameContext.interface.successAnimation = false;
      }),
      useComputed$(() => gameContext.interface.successAnimation),
      header.COUNTER_ANIMATE_DURATION
    );

    useTimeout(
      $(() => {
        gameContext.interface.mismatchAnimation = false;
      }),
      useComputed$(() => gameContext.interface.mismatchAnimation),
      header.COUNTER_ANIMATE_DURATION
    );

    useStylesScoped$(`
      .success, .mismatch {
        transition: all ${
          header.COUNTER_ANIMATE_DURATION * 0.8
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
    <code
      class={`bg-slate-800 ${header.CODE_TEXT_LIGHT} flex flex-col w-[11em] gap-1 ${header.CODE_PADDING}`}
    >
      <div
        class={`rounded success ${
          gameContext.interface.successAnimation
            ? header.SCORE_ANIMATION_CLASSES
            : ""
        } flex gap-2 ${header.CODE_TEXT_DARK}`}
      >
        <span class={`w-8/12 flex-grow flex-shrink-0 text-right`}>pairs:</span>
        <span class={`text-slate-100 w-4/12 flex-grow flex-shrink-0 text-left`}>
          {gameContext.game.successfulPairs.length}
          <span class="text-slate-400">
            /{gameContext.settings.deck.size / 2}
          </span>
        </span>
      </div>

      <div
        class={`rounded mismatch ${
          animateMismatch.value ? header.SCORE_ANIMATION_CLASSES : ""
        } flex gap-2 ${header.CODE_TEXT_DARK}`}
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
  );
});
