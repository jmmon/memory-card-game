import type { Signal } from "@builder.io/qwik";
import { component$, $, useSignal } from "@builder.io/qwik";
import Modal from "~/v3/components/templates/modal/modal";
import Button from "~/v3/components/atoms/button/button";
import type { iUserSettings } from "~/v3/types/types";
import GameStats from "../../molecules/game-stats/game-stats";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import useGetSavedTheme from "~/v3/hooks/useGetSavedTheme";
import GameSettings from "../../organisms/game-settings/game-settings";

export default component$(() => {
  const ctx = useGameContextService();
  // for adjusting deck size before restarting
  const unsavedUserSettings = useSignal<iUserSettings>(ctx.state.userSettings);

  useGetSavedTheme({ ctx, unsavedUserSettings });

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

  return (
    <Modal
      isShowing={ctx.state.interfaceSettings.endOfGameModal.isShowing}
      // isShowing={true}
      hideModal$={hideModal$}
      title={
        ctx.state.interfaceSettings.endOfGameModal.isWin
          ? "You Win!"
          : "Game Over"
      }
      containerClasses="bg-opacity-[98%] shadow-2xl"
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
            // onClick$={() => {
            //   ctx.handle.resetGame({
            //     deck: {
            //       ...ctx.state.userSettings.deck,
            //       size: Number(unsavedUserSettings.value.deck.size),
            //     },
            //   });
            //
            //   ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
            // }}
            onClick$={() => {
              saveOrResetSettings$(unsavedUserSettings);
            }}
          >
            Play Again
          </Button>
        </div>
      </GameSettings>

      {/* <div class="flex flex-col gap-0.5 px-[4%] py-[2%] md:gap-1">

        <GameStats q:slot="game-stats" />

        <ModalRow>
          <DeckSizeChanger
            userSettings={unsavedUserSettings}
            isLocked={unsavedUserSettings.value.deck.isLocked}
            for="end-game"
          />
        </ModalRow>

        <Button
          onClick$={() => {
            ctx.handle.resetGame({
              deck: {
                ...ctx.state.userSettings.deck,
                size: Number(unsavedUserSettings.value.deck.size),
              },
            });

            ctx.state.interfaceSettings.endOfGameModal.isShowing = false;
          }}
        >
          Play Again
        </Button>

        <Button onClick$={hideModal$} >
          Close
        </Button>
      </div> */}
    </Modal>
  );
});
