import { component$, $, useContext} from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Modal from "../modal/modal";

export default component$(() => {
  const appStore = useContext(AppContext);

  const hideModal = $(() => {
    appStore.game.isLoading = false;
  });

  return (
    <Modal title="Loading..." bgClasses="bg-opacity-0" isShowing={appStore.game.isLoading} hideModal={hideModal}>
      <div class="text-4xl text-center">Loading...</div>
    </Modal>
  );
});
