import { component$, Slot } from "@builder.io/qwik";
import type {
  ClassList,
  QRL,
  PropsOf,
  Signal,
  CSSProperties,
} from "@builder.io/qwik";

type ButtonProps = {
  onClick$?: QRL<() => void>;
  class?: ClassList;
  styles?: CSSProperties;
  disabled?: boolean;
  buttonRef?: Signal<HTMLButtonElement | undefined>;
} & PropsOf<"button">;
export default component$<ButtonProps>((props) => (
  <button
    ref={props.buttonRef}
    style={props.styles}
    onClick$={props.onClick$}
    class={`transition p-2 border border-slate-200 bg-slate-700 rounded focus:bg-slate-500 lg:hover:bg-slate-500 ${
      props.disabled ? "opacity-50" : ""
    } ${props.class}`}
    disabled={props.disabled}
  >
    <Slot />
  </button>
));
