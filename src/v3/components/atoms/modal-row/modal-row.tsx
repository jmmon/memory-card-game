import { Slot, component$ } from "@builder.io/qwik";

type ModalRowProps = { disabled?: boolean };
export default component$<ModalRowProps>(({ disabled = false }) => {
  return (
    <div class="flex w-full flex-grow justify-center rounded-lg border border-slate-800 px-[4%] py-[2%]">
      <div
        class={`w-full flex flex-grow justify-between gap-1 md:gap-2 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <Slot />
      </div>
    </div>
  );
});
