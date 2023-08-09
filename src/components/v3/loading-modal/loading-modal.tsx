import { component$, $, useContext, useTask$ } from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Modal from "../modal/modal";




export default component$(() => {
  const appStore = useContext(AppContext);

  const hideModal = $(() => {
    appStore.game.isLoading = false;
  });

  useTask$((taskCtx) => {
    taskCtx.track(() => appStore.game.isLoading);
    console.log({ isLoading: appStore.game.isLoading });
  });

  return (
    <Modal isShowing={appStore.game.isLoading} hideModal={hideModal}>
      <div class="flex gap-8 flex-col">Loading...</div>
    </Modal>
  );
});
