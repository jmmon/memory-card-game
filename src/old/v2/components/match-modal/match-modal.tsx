import { component$, useContext } from "@builder.io/qwik";
import { MatchModalContext } from "../../context/match-modal.context";

export default component$(() => {
  const MatchModalStore = useContext(MatchModalContext);

  return (
    <>
      {MatchModalStore.modal.isShowing && (
        <div
          class="backdrop-blur-sm bg-black bg-opacity-10 w-screen h-screen absolute top-0 left-0 flex flex-col justify-center items-center z-[1000]"
          onClick$={() => {
            if (MatchModalStore.modal.isShowing)
              MatchModalStore.modal.isShowing = false;
          }}
        >
          <div class="bg-amber-100 p-4 gap-4 w-4/12 h-1/3 border-2 rounded-2xl border-zinc-500 flex flex-col justify-center items-center">
            <h2 class="text-blue-900">match modal</h2>
            <p class="text-blue-900">
              <code>{MatchModalStore.modal.text}</code>
            </p>
            <p>click outside, or press esc to close modal</p>
          </div>
        </div>
      )}
    </>
  );
});
