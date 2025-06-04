import { component$ } from "@builder.io/qwik";
import HeaderSection from "~/v3/components/atoms/header-section/header-section";
import HeaderSelectedIds from "~/v3/components/atoms/header-selected-ids/header-selected-ids";
import HeaderGameDimensions from "~/v3/components/atoms/header-game-dimensions/header-game-dimensions";
import HeaderTimerDisplay from "~/v3/components/atoms/header-timer-display/header-timer-display";
import HeaderScoresDisplay from "~/v3/components/atoms/header-scores-display/header-scores-display";

import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import HeaderSettingsButton from "../../atoms/header-settings-button/header-settings-button";
import Button from "../../atoms/button/button";

export default component$(() => {
  const ctx = useGameContextService();

  return (
    <header
      class={`z-[40] mx-auto text-center text-xs md:text-sm flex gap-3 items-stretch justify-around w-full h-min`}
    >
      <HeaderSection classes="justify-around">
        {ctx.state.userSettings.interface.showSelectedIds && (
          <HeaderSelectedIds />
        )}
        {ctx.state.userSettings.interface.showDimensions && (
          <HeaderGameDimensions />
        )}
        <HeaderTimerDisplay />

        {ctx.state.gameData.IS_SCORES_ENABLED && (
          <Button
            classes={`my-auto sm:my-0 sm:px-4`}
            onClick$={() =>
              ctx.state.interfaceSettings.scoresModal.isShowing === true
                ? ctx.handle.hideScoresModal()
                : ctx.handle.showScoresModal()
            }
          >
            Scores
          </Button>
        )}
      </HeaderSection>

      <HeaderSettingsButton />

      <HeaderSection>
        <HeaderScoresDisplay />
      </HeaderSection>
    </header>
  );
});
