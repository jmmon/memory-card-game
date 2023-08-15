import type { PropFunction} from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";

export default component$(
  ({
    onClick$,
    text,
  }: {
    onClick$: PropFunction<() => void>;
    text: string;
  }) => {
    return (
      <button
        onClick$={onClick$}
        class="p-2 border border-gray-200 bg-slate-700 rounded hover:bg-slate-500"
      >
        {text}
      </button>
    );
  }
);
