import { $, component$, useContext } from "@builder.io/qwik";
import Modal from "../modal/modal";
import { AppContext } from "../v3-context/v3.context";
import { SettingsRow } from "../settings-modal/settings-modal";
import Button from "../button/button";

export default component$(
  (props: { headline: string; type: "win" | "lose" }) => {
    const appStore = useContext(AppContext);
    const hideModal = $(() => {
      appStore.interface.endOfGameModal.isShowing = false;
    });
    return (
      <Modal
        isShowing={appStore.interface.endOfGameModal.isShowing}
        hideModal={hideModal}
        bgClasses=""
        title="Game Settings"
      >
        <div class="flex gap-0.5 md:gap-1 flex-col py-[2%] px-[4%]">
          <SettingsRow>
            <div class="flex flex-grow justify-between">
              <span>Pairs:</span>
              <span>
                {appStore.game.successfulPairs}/
                {appStore.settings.deck.size / 2}
              </span>
            </div>
          </SettingsRow>
          <SettingsRow>
            <div class="flex flex-grow justify-between">
              <span>Mismatches:</span>
              <span>
                {appStore.game.mismatchPairs}
                {appStore.settings.maxAllowableMismatches !== -1
                  ? `/
${appStore.settings.deck.size / 2} `
                  : ""}
              </span>
            </div>
          </SettingsRow>
<Button onClick$={() => appStore.resetGame()} text="Play Again"/>
        </div>
      </Modal>
    );
  }
);
