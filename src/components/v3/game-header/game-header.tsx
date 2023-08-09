import { Slot, component$, useContext } from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Button from "../button/button";

export default component$(() => {
  const appStore = useContext(AppContext);

  return (
    <header
      class={`mx-auto text-center grid text-xs md:text-sm grid-cols-[1fr_5em_1fr] items-center w-full px-[5%]`}
    >
      <HeaderSection justify="left">
        <SelectionHeaderComponent />
        {appStore.boardLayout.isLocked && (
          <code class="bg-gray-800 text-gray-200">board locked</code>
        )}
        {appStore.settings.deck.isLocked && (
          <code class="bg-gray-800 text-gray-200">deck locked</code>
        )}
      </HeaderSection>
      <Button text="Settings" onClick$={() => appStore.toggleSettingsModal()} />
      <HeaderSection>
        <code class="bg-gray-800 text-gray-200">
          pairs: {appStore.game.successfulPairs.length}/
          {appStore.settings.deck.size / 2}{" "}
        </code>

        <code class="bg-gray-800 text-gray-200">
          mismatches: {appStore.game.mismatchPairs.length}
          {appStore.settings.maxAllowableMismatches === -1
            ? ""
            : `/${appStore.settings.maxAllowableMismatches}`}
        </code>
      </HeaderSection>
    </header>
  );
});

const SelectionHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <code class="bg-gray-800 flex flex-wrap text-center gap-x-4 text-gray-200">
      <div class="w-min inline-block mx-auto">selected:</div>
      <div class="grid grid-cols-[3.6em_0.6em_3.6em] mx-auto">
        <span>{appStore.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{appStore.game.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});

const HeaderSection = component$(
  ({ justify = "center" }: { justify?: "left" | "right" | "center" }) => {
    return (
      <div
        class={`w-full flex gap-3 ${
          justify === "right"
            ? "justify-end"
            : justify === "left"
            ? "justify-start"
            : "justify-center"
        } `}
      >
        <Slot />
      </div>
    );
  }
);
