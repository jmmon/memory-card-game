import { component$ } from "@builder.io/qwik";
import type { PropFunction, QwikChangeEvent } from "@builder.io/qwik";

export default component$(
  ({
    text,
    onChange$,
    classes,
    tooltip,
    disabled = false,
    value = false,
  }: {
    text: string;
    onChange$: PropFunction<(e: QwikChangeEvent) => void>;
    classes?: string;
    tooltip?: string;
    disabled?: boolean;
    value?: boolean;
  }) => {
    return (
      <div
        class={`${tooltip ? "tooltip" : ""} ${
          classes ? classes : ""
        } flex gap-2 items-center justify-between w-full `}
      >
        <label
          for={text}
          class="text-slate-100 flex gap-2 items-center justify-between w-full mr-2 mb-1 cursor-pointer text-left"
        >
          {text}
          <input
            disabled={disabled}
            class="cursor-pointer w-6 h-6"
            type="checkbox"
            id={text}
            name={text}
            onChange$={onChange$}
            checked={value}
          />
        </label>
        {tooltip && <span class="tooltiptext">{tooltip}</span>}
      </div>
    );
  }
);
