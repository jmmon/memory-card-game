import { component$, Slot, type PropFunction } from "@builder.io/qwik";

export default component$(
  ({
    onClick$,
  }: {
    onClick$: PropFunction<() => void>;
  }) => {
    return (
      <button
        onClick$={onClick$}
        class="p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500"
      >
<Slot />
      </button>
    );
  }
);
