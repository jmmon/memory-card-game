import {
  component$,
  type ClassList,
  type QRL,
  type Signal,
} from "@builder.io/qwik";

type ModalCloseButtonProps = {
  hideModal$: QRL<() => void>;
  ref: Signal<HTMLButtonElement | undefined>;
  text?: string;
  class?: ClassList;
  onLeft?: boolean;
};
const ModalCloseButton = component$<ModalCloseButtonProps>((props) => {
  props = {
    text: "X",
    onLeft: false,
    ...props,
  };
  return (
    <button
      type="button"
      ref={props.ref}
      class={`${props.onLeft ? "mr-auto" : "ml-auto"} rounded-lg text-xl border-none text-slate-400 bg-transparent px-2 py-0 transition-all hover:text-slate-200 focus:text-slate-200 ${props.class}`}
      onClick$={props.hideModal$}
    >
      {props.text}
    </button>
  );
});
export default ModalCloseButton;
