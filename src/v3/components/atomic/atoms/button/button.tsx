import { component$, Slot } from "@builder.io/qwik";
import type { PropFunction, Signal } from "@builder.io/qwik";

export default component$(
  ({
    onClick$,
    classes = "",
    disabled = false,
  }: {
    onClick$: PropFunction<() => void>;
    classes?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick$={onClick$}
      class={`p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 ${
        disabled ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : ""
      } ${classes}`}
      disabled={
disabled
      }

    >
      <Slot />
    </button>
  )
);
