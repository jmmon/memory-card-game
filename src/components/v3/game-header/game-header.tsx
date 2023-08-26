import { Slot, component$, useContext } from "@builder.io/qwik";
import { AppContext } from "../v3-context/v3.context";
import Button from "../button/button";

const CODE_PADDING = "px-1.5 md:px-3 lg:px-4";

export default component$(() => {
  const appStore = useContext(AppContext);

  return (
    <header
      class={`mx-auto text-center text-xs md:text-sm flex justify-around w-full h-min`}
    >
      <HeaderSection classes="justify-start md:justify-around">
        {appStore.settings.interface.showSelectedIds && (
          <SelectionHeaderComponent />
        )}
        {/* {appStore.boardLayout.isLocked && ( */}
        {/*   <code class="bg-gray-800 text-gray-200">board locked</code> */}
        {/* )} */}
        {/* {appStore.settings.deck.isLocked && ( */}
        {/*   <code class="bg-gray-800 text-gray-200">deck locked</code> */}
        {/* )} */}
      </HeaderSection>
      <Button text="Settings" onClick$={() => appStore.toggleSettingsModal()} />
      <HeaderSection>
        <code class={` bg-gray-800 text-gray-200 flex gap-1 ${CODE_PADDING}`}>
          <div class="flex flex-col">
            <span class="text-right ">pairs:</span>
            <span class="text-right ">mismatches:</span>
            {/* <span class="text-right hidden sm:inline ">pairs:</span> */}
            {/* <span class="text-right inline sm:hidden ">p:</span> */}
            {/* <span class="text-right hidden sm:inline ">mismatches:</span> */}
            {/* <span class="text-right inline sm:hidden ">m:</span> */}
          </div>
          <div class="flex flex-col">
            <span class="">
              {appStore.game.successfulPairs.length}/
              {appStore.settings.deck.size / 2}{" "}
            </span>

            <span class="">
              {appStore.game.mismatchPairs.length}
              {appStore.settings.maxAllowableMismatches === -1
                ? ""
                : `/${appStore.settings.maxAllowableMismatches}`}
            </span>
          </div>
        </code>
      </HeaderSection>
    </header>
  );
});

const SelectionHeaderComponent = component$(() => {
  const appStore = useContext(AppContext);
  return (
    <code
      class={` bg-gray-800 flex flex-col text-center text-gray-200 ${CODE_PADDING}`}
    >
      <span class="w-min mx-auto">cards selected:</span>
      <div class="grid grid-cols-[3.6em_0.6em_3.6em] mx-auto">
        <span>{appStore.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{appStore.game.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});

const HeaderSection = component$(
  ({ classes = "justify-center" }: { classes?: string }) => {
    return (
      <div class={`w-full flex gap-3 ${classes} `}>
        <Slot />
      </div>
    );
  }
);
