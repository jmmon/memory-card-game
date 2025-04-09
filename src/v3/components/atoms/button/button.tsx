import { component$, Slot } from "@builder.io/qwik";
import type {
  ClassList,
  PropFunction,
  PropsOf,
  Signal,
} from "@builder.io/qwik";

type ButtonProps = {
  onClick$: PropFunction<() => void>;
  classes?: ClassList;
  disabled?: boolean;
  buttonRef?: Signal<HTMLButtonElement | undefined>;
} & PropsOf<"button">;
export default component$<ButtonProps>((props) => (
  <button
    {...props}
    ref={props.buttonRef}
    onClick$={props.onClick$}
    class={`transition p-2 border border-slate-200 bg-slate-700 rounded hover:bg-slate-500 ${
      props.disabled ? "opacity-50" : ""
    } ${props.classes}`}
    disabled={props.disabled}
  >
    <Slot />
  </button>
));
