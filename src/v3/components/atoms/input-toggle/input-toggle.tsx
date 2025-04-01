import { Slot, component$ } from "@builder.io/qwik";
import type { ClassList, PropFunction } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";

type InputToggleProps = {
  text: string;
  name: string;
  onChange$: PropFunction<(e: Event) => void>;
  classes?: ClassList;
  disabled?: boolean;
  settings: iUserSettings;
};
const BG_DARK: ClassList = "bg-slate-600";
export default component$<InputToggleProps>(
  ({ text, name, onChange$, classes, disabled = false, settings }) => {
    const properties = name.split(".");
    return (
      <div
        class={`${classes ?? ""} flex gap-[min(.75rem,1.75vw)] items-center justify-between w-full`}
      >
        <label
          for={text}
          class="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-slate-100"
        >
          {text}
          <input
            disabled={disabled}
            class="h-6 w-6 flex-shrink-0 cursor-pointer hidden"
            type="checkbox"
            id={text}
            name={name || text}
            onChange$={onChange$}
            checked={settings[properties[0]][properties[1]]}
          />

          <div
            data-label="toggle-switch"
            class={`relative w-14 h-8 transition-all duration-200 ease-in-out border border-slate-500 rounded-full ${settings[properties[0]][properties[1]] ? BG_DARK : "bg-slate-400"}`}
          >
            <div
              class={`absolute w-[28px] h-[28px] transition-all duration-200 ease-in-out border border-slate-500 rounded-full top-[1px] ${settings[properties[0]][properties[1]] ? `left-[25px] bg-slate-50` : `left-[1px] ${BG_DARK}`}`}
            ></div>
          </div>
        </label>

        <Slot />
      </div>
    );
  },
);
