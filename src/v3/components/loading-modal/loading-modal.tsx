import { component$, $, useContext} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";

export default component$(() => {
  const appStore = useContext(GameContext);

  const hideModal = $(() => {
    appStore.game.isLoading = false;
  });

  return (
    <Modal title="Loading..." bgClasses="bg-opacity-0" isShowing={appStore.game.isLoading} hideModal$={hideModal}>
      <div class="text-4xl text-center">Loading...</div>
    </Modal>
  );
});
