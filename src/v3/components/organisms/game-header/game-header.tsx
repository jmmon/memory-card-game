import { component$, useContext } from "@builder.io/qwik";
import Button from "../../atoms/button/button";
import { GameContext } from "~/v3/context/gameContext";
import HeaderSection from "~/v3/components/atoms/header-section/header-section";
import HeaderSelectedIds from "~/v3/components/atoms/header-selected-ids/header-selected-ids";
import HeaderGameDimensions from "~/v3/components/atoms/header-game-dimensions/header-game-dimensions";
import HeaderTimerDisplay from "~/v3/components/atoms/header-timer-display/header-timer-display";
import HeaderScoresDisplay from "~/v3/components/atoms/header-scores-display/header-scores-display";

import type { PropFunction } from "@builder.io/qwik";

export default component$(
  ({ showSettings$ }: { showSettings$: PropFunction<() => void> }) => {
    const gameContext = useContext(GameContext);

    return (
      <header
        class={`mx-auto text-center text-xs md:text-sm flex justify-around w-full h-min`}
      >
        <HeaderSection classes="justify-around">
          {gameContext.userSettings.interface.showSelectedIds && (
            <HeaderSelectedIds />
          )}
          {gameContext.userSettings.interface.showDimensions && (
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
