import { PropFunction } from "@builder.io/qwik";

export default ({
  text = "X",
  hideModal$,
}: {
  text?: string;
  hideModal$: PropFunction<() => void>;
}) => (
  <button
    class="text-slate-600 hover:text-slate-400 ml-auto border-slate-400 border rounded-lg py-1.5 px-2 transition-all bg-slate-800/90 hover:bg-slate-600"
    onClick$={hideModal$}
  >
    {text}
  </button>
);

