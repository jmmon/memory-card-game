import { component$, Slot } from "@builder.io/qwik";
import type { ClassList, PropFunction, Signal } from "@builder.io/qwik";

type ButtonProps = {
  onClick$: PropFunction<() => void>;
  classes?: ClassList;
  disabled?: boolean;
  buttonRef?: Signal<HTMLButtonElement | undefined>;
};
export default component$<ButtonProps>(
  ({ onClick$, classes = "", disabled = false, buttonRef }) => (
    <button
      ref={buttonRef}
      onClick$={onClick$}
      class={`transition p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 ${
        disabled ? "opacity-50" : ""
      } ${classes}`}
      disabled={disabled}
    >
      <Slot />
    </button>
  ),
);
