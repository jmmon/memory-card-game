import { component$ } from "@builder.io/qwik";
import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import GameStats from "../../molecules/game-stats/game-stats";
import GameSettings from "../../organisms/game-settings/game-settings";
import { GameStateEnum } from "~/v3/types/types";
import useSyncedSettings from "~/v3/hooks/useSyncedSettings";

export default component$(() => {
  const { unsavedUserSettings, saveOrResetSettings$, ctx } =
    useSyncedSettings("settingsModal");

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.settingsModal.isShowing}
      hideModal$={ctx.handle.hideSettingsModal}
      title="Game Settings"
    >
      <GameSettings
        startShuffling$={() => ctx.handle.startShuffling({
          shouldHideSettings: false,
        })}
        unsavedUserSettings={unsavedUserSettings}
        isShufflingDisabled={
          ctx.state.gameData.gameState !== GameStateEnum.IDLE ||
          ctx.state.gameData.isDealing ||
          ctx.state.gameData.isShuffling
        }
      >
        {ctx.timer.state.time > 0 && <GameStats q:slot="game-stats" />}

        <div
          q:slot="footer"
          class="mt-5 flex flex-grow items-center justify-around"
        >
          <Button onClick$={saveOrResetSettings$}>
            <span class="text-slate-100">Reset Game</span>
          </Button>
          <Button
            onClick$={() => {
              saveOrResetSettings$(unsavedUserSettings);
            }}
          >
            <span class="text-slate-100">Save &amp; Reset</span>
          </Button>
        </div>
      </GameSettings>
    </Modal>
  );
});
