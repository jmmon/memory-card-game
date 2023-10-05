import { Slot, component$ } from "@builder.io/qwik";

export default component$(
  ({ disabled = false }: { disabled?: boolean }) => {
    return (
      <div class="flex flex-grow justify-center w-full border border-slate-800 rounded-lg py-[2%] px-[4%]">
        <div
          class={`w-full flex flex-grow justify-between gap-1 md:gap-2 ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <Slot />
        </div>
      </div>
    );
  }
);
