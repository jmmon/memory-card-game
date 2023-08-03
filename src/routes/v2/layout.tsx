import {
  component$,
  Slot,
  $,
  useContextProvider,
  useOnDocument,
  useStore,
} from "@builder.io/qwik";
import MatchModal from "~/components/match-modal/match-modal";
import { MatchModalContext } from "~/context/match-modal.context";

export default component$(() => {
  const MatchModalStore = useStore<MatchModalContext>({
    modal: {
      isShowing: false,
      text: "",
    },
  });

  useContextProvider(MatchModalContext, MatchModalStore);

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
