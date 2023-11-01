import type { PropFunction } from "@builder.io/qwik";

export default ({
  text = "X",
  hideModal$,
}: {
  text?: string;
  hideModal$: PropFunction<() => void>;
}) => (
  <button
    class="ml-auto rounded-lg border border-slate-400 bg-slate-800/90 px-2 py-1.5 text-slate-600 transition-all hover:bg-slate-600 hover:text-slate-400"
    onClick$={hideModal$}
  >
    {text}
  </button>
);

