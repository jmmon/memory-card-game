import {
  $,
  component$,
  useComputed$,
  useContext,
  useStylesScoped$,
} from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { GameContext } from "~/v3/context/gameContext";
import { useTimeoutObj } from "~/v3/hooks/useTimeout";

export default component$(() => {
  const gameContext = useContext(GameContext);

  useTimeoutObj({
    action: $(() => {
      gameContext.interface.successAnimation = false;
    }),
    triggerCondition: useComputed$(
      () => gameContext.interface.successAnimation
    ),
    initialDelay: header.COUNTER_ANIMATE_DURATION,
  });

  useTimeoutObj({
    action: $(() => {
      gameContext.interface.mismatchAnimation = false;
    }),
    triggerCondition: useComputed$(
      () => gameContext.interface.mismatchAnimation
    ),
    initialDelay: header.COUNTER_ANIMATE_DURATION,
  });

  const mismatchAnimation = useComputed$(() => {
    const extraMismatchFeatures =
      gameContext.userSettings.maxAllowableMismatches !== -1 ||
      gameContext.userSettings.reorgnanizeBoardOnMismatch ||
      gameContext.userSettings.shufflePickedAfterMismatch ||
      gameContext.userSettings.shuffleBoardAfterMismatches > 0;
    return gameContext.interface.mismatchAnimation && extraMismatchFeatures;
  });

  useStylesScoped$(`
    .success, .mismatch {
      transition: all ${header.COUNTER_ANIMATE_DURATION * 0.8
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

  return (
    <code
      class={`bg-slate-800 ${header.CODE_TEXT_LIGHT} grid w-[12em] gap-1 ${header.CODE_PADDING}`}
    >
      <Score
        animate={gameContext.interface.successAnimation}
        score={gameContext.game.successfulPairs.length}
        showMax={true}
        max={gameContext.userSettings.deck.size / 2}
        label="pairs"
      />

      <Score
        animate={mismatchAnimation.value}
        score={gameContext.game.mismatchPairs.length}
        showMax={gameContext.userSettings.maxAllowableMismatches !== -1}
        max={gameContext.userSettings.maxAllowableMismatches}
        label="mismatches"
      />
    </code>
  );
});

const Score = component$(
  ({
    animate,
    score,
    showMax = false,
    max = -1,
    label,
  }: {
    animate: boolean;
    score: number;
    showMax: boolean;
    max: number;
    label: string;
  }) => {
    return (
      <div
        class={`rounded mismatch ${animate ? header.SCORE_ANIMATION_CLASSES : ""
          } grid gap-1.5 grid-cols-[2fr_1fr] ${header.CODE_TEXT_DARK}`}
      >
        <span class="text-right">{label}:</span>
        <span class="text-left text-slate-100">
          {score}
          {showMax && <span class="text-slate-400">/{max}</span>}
        </span>
      </div>
    );
  }
);
