import {
  component$,
  Slot,
  $,
  useContextProvider,
  useOnDocument,
  useStore,
} from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import MatchModal from "~/old/v2/components/match-modal/match-modal";
import { MatchModalContext } from "~/old/v2/context/match-modal.context";
import HEAD_CONSTANTS from "~/v3/constants/head";

export default component$(() => {
  const MatchModalStore = useStore<MatchModalContext>({
    modal: {
      isShowing: false,
      text: "",
    },
  });

  useContextProvider(MatchModalContext, MatchModalStore);

  // set up esc hotkey to close modal
  useOnDocument(
    "keydown",
    $((e: Event) => {
      console.log("(outer) escape pressed");
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") {
          console.log("escape pressed");
          MatchModalStore.modal.isShowing = false;
        }
      }
    })
  );

  return (
    <>
      <Slot />
      <MatchModal />
    </>
  );
});

export const head: DocumentHead = {
  title: `v2 - ${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "Prototype game v2 - Game with flippable cards animations",
    },
  ],
};
