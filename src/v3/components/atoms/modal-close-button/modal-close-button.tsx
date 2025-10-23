import type { FunctionComponent, QRL } from "@builder.io/qwik";

type ModalCloseButtonProps = {
  text?: string;
  hideModal$: QRL<() => void>;
  autofocus?: boolean;
};
const ModalCloseButton: FunctionComponent<ModalCloseButtonProps> = ({
  text = "X",
  hideModal$,
  autofocus = false,
}) => (
  <button
    class="ml-auto rounded-lg text-xl border-none text-slate-400 bg-transparent px-2 py-0 transition-all hover:text-slate-200 focus:text-slate-200"
    onClick$={hideModal$}
    autofocus={autofocus}
  >
    {text}
  </button>
);
export default ModalCloseButton;
