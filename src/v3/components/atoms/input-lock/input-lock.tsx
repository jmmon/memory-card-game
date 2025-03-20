import { component$ } from "@builder.io/qwik";
import type { PropFunction } from "@builder.io/qwik";
import InfoTooltip from "../../molecules/info-tooltip/info-tooltip";

export default component$(
  ({
    text,
    onChange$,
    classes,
    tooltip,
    disabled = false,
    value,
  }: {
    text: string;
    onChange$: PropFunction<(e: Event) => void>;
    classes?: string;
    tooltip?: string;
    disabled?: boolean;
    value?: boolean;
  }) => {
    return (
      <div
        class={`${classes ?? ""} flex gap-2 items-center justify-between w-full `}
      >
        <label
          for={text}
          class="mr-2 flex w-full cursor-pointer items-center justify-between gap-2 text-left text-slate-100"
        >
          {text}
          <input
            disabled={disabled}
            class="h-6 w-6 cursor-pointer"
            type="checkbox"
            id={text}
            name={text}
            onChange$={onChange$}
            checked={value}
          />
        </label>

        {tooltip &&
          <InfoTooltip>
            {tooltip}
          </InfoTooltip>
        }
      </div>
    );
  }
);
