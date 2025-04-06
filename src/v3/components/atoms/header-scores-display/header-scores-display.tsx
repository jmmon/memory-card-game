import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();

  // TODO: implement the challenge modes; only some may apply for animations
  //
  // const mismatchAnimation = useComputed$(() => {
  //   if (!ctx.state.interfaceSettings.mismatchAnimation) return false;
  //
  //   const extraMismatchFeatures =
  //     ctx.state.userSettings.maxAllowableMismatches !== -1 ||
  //     // ctx.state.userSettings.shuffleBoardOnSelectCard ||
  //     ctx.state.userSettings.shufflePickedAfterMismatch ||
  //     ctx.state.userSettings.shuffleBoardAfterMismatches > 0;
  //   return (
  //     extraMismatchFeatures
  //   );
  // });

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

  return (
    <code
      class={`bg-slate-800 ${header.CODE_TEXT_LIGHT} grid w-min gap-1 ${header.CODE_PADDING}`}
    >
      <Score
        animate={ctx.state.interfaceSettings.successAnimation}
        score={ctx.state.gameData.successfulPairs.length}
        showMax={true}
        max={ctx.state.userSettings.deck.size / 2}
        label="pairs"
        type="success"
        isDoubleDigit={ctx.state.userSettings.deck.size / 2 >= 10}
      />

      <Score
        animate={ctx.state.interfaceSettings.mismatchAnimation}
        score={ctx.state.gameData.mismatchPairs.length}
        showMax={ctx.state.userSettings.maxAllowableMismatches !== -1}
        max={ctx.state.userSettings.maxAllowableMismatches}
        label="mismatches"
        type="mismatch"
        isDoubleDigit={ctx.state.userSettings.deck.size / 2 >= 10}
      />
    </code>
  );
});

const Score = ({
  animate,
  score,
  showMax = false,
  max = -1,
  label,
  type,
  isDoubleDigit = true,
}: {
  animate: boolean;
  // score: iPair[];
  score: number;
  showMax: boolean;
  max: number;
  label: string;
  type: "success" | "mismatch";
  isDoubleDigit?: boolean;
}) => {
  return (
    <div
      class={`${type} rounded ${
        animate ? header.SCORE_ANIMATION_CLASSES : ""
      } grid gap-1.5 grid-cols-[7em_1fr] items-center ${header.CODE_TEXT_DARK} px-2`}
      style={{
        gridTemplateColumns: isDoubleDigit ? "11ch 5ch" : "11ch 3ch",
      }}
    >
      <span class="text-right">{label}:</span>
      <span class="text-left text-slate-100">
        {score}
        {showMax && <span class="text-slate-400">/{max}</span>}
      </span>
    </div>
  );
};
