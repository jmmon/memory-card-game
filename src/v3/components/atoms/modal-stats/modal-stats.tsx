import { Slot, component$ } from "@builder.io/qwik";

type ModalStats = { label: string; content?: string };
export default component$<ModalStats>(({ label, content }) => (
  <div class="flex flex-grow justify-between text-slate-100">
    <span>{label}</span>
    <span>{content ?? <Slot />}</span>
  </div>
));
