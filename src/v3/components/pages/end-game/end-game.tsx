import { component$ } from "@builder.io/qwik";
import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import GameStats from "../../molecules/game-stats/game-stats";
import GameSettings from "../../organisms/game-settings/game-settings";
import { GameStateEnum } from "~/v3/types/types";
import useSyncedSettings from "~/v3/hooks/useSyncedSettings";

export default component$(() => {
  // syncs and provides settings
  const { unsavedUserSettings, saveOrResetSettings$, ctx } =
    useSyncedSettings("endOfGameModal");

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      hideModal$={ctx.handle.hideEndOfGameModal}
      title={
        ctx.state.gameData.gameState === GameStateEnum.ENDED_WIN
          ? "You Win!"
          : "Game Over"
      }
      options={{
        detectClickOutside: false,
      }}
    >
      <GameSettings unsavedUserSettings={unsavedUserSettings}>
        <GameStats q:slot="game-stats" />

        <div
          q:slot="footer"
          class="mt-5 flex flex-grow items-center justify-around w-full"
        >
          <Button
            classes="w-full"
            onClick$={() => {
              saveOrResetSettings$(unsavedUserSettings);
            }}
          >
            Play Again
          </Button>
        </div>
      </GameSettings>
    </Modal>
  );
});
