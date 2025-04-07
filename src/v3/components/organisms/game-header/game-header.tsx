import { component$ } from "@builder.io/qwik";
import HeaderSection from "~/v3/components/atoms/header-section/header-section";
import HeaderSelectedIds from "~/v3/components/atoms/header-selected-ids/header-selected-ids";
import HeaderGameDimensions from "~/v3/components/atoms/header-game-dimensions/header-game-dimensions";
import HeaderTimerDisplay from "~/v3/components/atoms/header-timer-display/header-timer-display";
import HeaderScoresDisplay from "~/v3/components/atoms/header-scores-display/header-scores-display";

import type { QRL } from "@builder.io/qwik";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import HeaderSettingsButton from "../../atoms/header-settings-button/header-settings-button";

type GameHeaderProps = { showSettings$: QRL<() => void> };
export default component$<GameHeaderProps>(() => {
  const ctx = useGameContextService();

  return (
    <header
      class={`z-50 mx-auto text-center text-xs md:text-sm flex gap-3 items-stretch justify-around w-full h-min`}
    >
      <HeaderSection classes="justify-around pointer-events-none">
        {ctx.state.userSettings.interface.showSelectedIds && (
          <HeaderSelectedIds />
        )}
        {ctx.state.userSettings.interface.showDimensions && (
          <HeaderGameDimensions />
        )}
        <HeaderTimerDisplay />
      </HeaderSection>

      <HeaderSettingsButton />

      <HeaderSection>
        <HeaderScoresDisplay />
      </HeaderSection>
    </header>
  );
});
