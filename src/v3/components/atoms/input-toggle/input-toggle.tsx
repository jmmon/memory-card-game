import { Slot, component$, useStyles$ } from "@builder.io/qwik";
import type { ClassList, PropFunction } from "@builder.io/qwik";
import type { iUserSettings } from "~/v3/types/types";

type InputToggleProps = {
  onChange$: PropFunction<(e: Event, t: HTMLInputElement) => void>;
  settings: iUserSettings;
  /** set for the `name` property so the change handler can adjust the appropriate setting */
  propertyPath: string;
  classes?: ClassList;
  disabled?: boolean;
  id?: string;
};
export default component$<InputToggleProps>(
  ({
    onChange$,
    propertyPath,
    settings,
    classes = "",
    disabled = false,
    id = "toggle",
  }) => {
    const properties = propertyPath.split(".");
    // css to display the toggle view depending on checkbox state
    useStyles$(`
      [data-label="toggle-slot"] {
        /* background-color: #94a3b8; */ /* bg-slate-400 */
        /* background-color: #e2e8f0; */ /* bg-slate-200 */

        background-color: #cbd5e1; /* bg-slate-300 */
      }
      [data-label="toggle-switch"] {
        /* matching colors */
        background-color: #475569; /* bg-slate-600 */
        border-color: #475569; /* bg-slate-600 */
        left: 1px;
      }
      input:checked ~ [data-label="toggle-slot"] {
        background-color: #475569; /* bg-slate-600 */
      }
      input:checked ~ [data-label="toggle-slot"] > [data-label="toggle-switch"] {
        background-color: #f8fafc; /* bg-slate-50 */
        left: 25px;
        /* border-color: #10b981; */ /* emerald-500 */
        border-color: #34d399; /* emerald-400 */ 
      }
      input:focus ~ [data-label="toggle-slot"],
      input:focus ~ [data-label="toggle-slot"]>[data-label="toggle-switch"] {
        outline: 1px solid #fff;
        
      }

      input:focus ~ [data-label="toggle-slot"]:after {
        content: "";
        position: absolute;
        border-radius: 9999px;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: 1px solid black;
      }
      input:focus ~ [data-label="toggle-slot"]>[data-label="toggle-switch"]:after {
        content: "";
        position: absolute;
        border-radius: 9999px;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: 1px solid black;
      }
    `);

    return (
      <div
        class={`${classes} flex gap-[min(.75rem,1.75vw)] items-center justify-between w-full`}
      >
        <label
          class="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-slate-100"
          // gap is halved because input is also gapped
        >
          <Slot name="label" />
          <input
            disabled={disabled}
            class="h-0 w-0 flex-shrink-0 cursor-pointer opacity-0"
            type="checkbox"
            name={propertyPath} // do not modify! used in onChange$
            id={id + "-" + propertyPath}
            onChange$={onChange$}
            checked={settings[properties[0]][properties[1]]}
          />

          <div
            data-label="toggle-slot"
            class={`relative w-14 h-8 flex-shrink-0 transition-all duration-200 ease-in-out border border-slate-500 rounded-full`}
          >
            <div
              data-label="toggle-switch"
              class={`absolute w-[28px] h-[28px] transition-all duration-200 ease-in-out border-2  rounded-full top-[1px]`}
            />
          </div>
        </label>

        <Slot name="tooltip" />
      </div>
    );
  },
);
