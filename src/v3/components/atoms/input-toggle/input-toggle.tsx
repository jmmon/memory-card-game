import { Slot, component$, useStyles$ } from "@builder.io/qwik";
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
export default component$<InputToggleProps>(
  ({ text, name, onChange$, classes, disabled = false, settings }) => {
    const properties = name.split(".");
    // css to display the toggle view depending on checkbox state
    useStyles$(`
      [data-label="toggle-switch"] {
        background-color: #94a3b8; /* bg-slate-400 */
      }
      [data-label="toggle-handle"] {
        background-color: #475569; /* bg-slate-600 */
        left: 1px;
      }
      input:checked ~ [data-label="toggle-switch"] {
        background-color: #475569; /* bg-slate-600 */
      }
      input:checked ~ [data-label="toggle-switch"] > [data-label="toggle-handle"] {
        background-color: #f8fafc; /* bg-slate-50 */
        left: 25px;
      }
    `);
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
            class={`relative w-14 h-8 transition-all duration-200 ease-in-out border border-slate-500 rounded-full`}
          >
            <div
              data-label="toggle-handle"
              class={`absolute w-[28px] h-[28px] transition-all duration-200 ease-in-out border border-slate-500 rounded-full top-[1px]`}
            />
          </div>
        </label>

        <Slot />
      </div>
    );
  },
);
