import type { QRL } from "@builder.io/qwik";

export default ({
  text = "X",
  hideModal$,
}: {
  text?: string;
  hideModal$: QRL<() => void>;
}) => (
  <button
    class="ml-auto rounded-lg text-xl border-none text-slate-400 bg-transparent px-2 py-0 transition-all hover:text-slate-200 focus:text-slate-200"
    onClick$={hideModal$}
  >
    {text}
  </button>
);

