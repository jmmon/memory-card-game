import { Slot, component$ } from "@builder.io/qwik";

export default component$(({ label, content }: { label: string; content?: string }) => (
  <div class="flex flex-grow justify-between text-slate-100" >
    <span>{label}</span>
    <span>
      {content ?? <Slot />}
    </span>
  </div>
));
