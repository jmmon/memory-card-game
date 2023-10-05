import type { PropFunction } from "@builder.io/qwik";
import { component$, useContext } from "@builder.io/qwik";
import Button from "../../atoms/button/button";
import { GameContext } from "~/v3/context/gameContext";
import HeaderSection from "../../atoms/header-section/header-section";
import HeaderSelectedIds from "../../atoms/header-selected-ids/header-selected-ids";
import HeaderGameDimensions from "../../atoms/header-game-dimensions/header-game-dimensions";
import HeaderTimerDisplay from "../../atoms/header-timer-display/header-timer-display";
import HeaderScoresDisplay from "../../atoms/header-scores-display/header-scores-display";

export default component$(
  ({ showSettings$ }: { showSettings$: PropFunction<() => void> }) => {
    const gameContext = useContext(GameContext);

    return (
      <header
        class={`mx-auto text-center text-xs md:text-sm flex justify-around w-full h-min`}
      >
        <HeaderSection classes="justify-around">
          {gameContext.settings.interface.showSelectedIds && (
            <HeaderSelectedIds />
          )}
          {gameContext.settings.interface.showDimensions && (
            <HeaderGameDimensions />
          )}
          <HeaderTimerDisplay />
        </HeaderSection>

        <Button onClick$={showSettings$}>
          <span class="text-slate-100">Settings</span>
        </Button>

        <HeaderSection>
          <HeaderScoresDisplay />
        </HeaderSection>
      </header>
    );
  }
);
