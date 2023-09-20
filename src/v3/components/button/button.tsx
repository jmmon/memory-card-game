import { component$, Slot } from "@builder.io/qwik";
import type { PropFunction } from "@builder.io/qwik";

export default component$(
  ({
    onClick$,
    classes = "",
    disabled,
  }: {
    onClick$: PropFunction<() => void>;
    classes?: string;
    disabled?: boolean;
  }) => (
    <button
      disabled={disabled ?? false}
      onClick$={onClick$}
      class={`p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 disabled:bg-slate-400 ${classes}`}
    >
      <Slot />
    </button>
  )
);
