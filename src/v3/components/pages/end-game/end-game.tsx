import type { Signal } from "@builder.io/qwik";
import { component$, $, useSignal, useTask$ } from "@builder.io/qwik";
import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import { GameStateEnum, type iUserSettings } from "~/v3/types/types";
import GameStats from "../../molecules/game-stats/game-stats";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";
import GameSettings from "../../organisms/game-settings/game-settings";

export default component$(() => {
  const ctx = useGameContextService();
  // for adjusting deck size before restarting
  const unsavedUserSettings = useSignal<iUserSettings>(ctx.state.userSettings);

  useGetSavedTheme(
    { ctx, unsavedUserSettings },
    {
      onLoad: false,
    },
  );

  const hideModal$ = $(() => {
    ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
  });

  const saveOrResetSettings$ = $((newSettings?: Signal<iUserSettings>) => {
    ctx.handle
      .resetGame(newSettings ? newSettings.value : undefined)
      .then(() => {
        // resync and hide modal after new settings are saved
        // console.log("game reset", ctx);
        ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
      });
  });

  // resync when showing or hiding modal e.g. if home changed settings but didn't save
  useTask$(({ track }) => {
    const isShowing = track(() => ctx.state.interfaceSettings.settingsModal.isShowing);

    if (isShowing) {
      // ensure settings are resyncd from ctx when showing
      unsavedUserSettings.value = ctx.state.userSettings;

    } else {
      // first save INTERFACE changes without requiring save to be clicked
      // then update signal to match all state settings
      ctx.state.userSettings.interface = unsavedUserSettings.value.interface;
      unsavedUserSettings.value = ctx.state.userSettings;
    }
  });

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      hideModal$={hideModal$}
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
