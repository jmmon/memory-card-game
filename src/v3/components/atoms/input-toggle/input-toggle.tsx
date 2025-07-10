import { Slot, component$, useStyles$ } from "@builder.io/qwik";
import type { ClassList, QRL } from "@builder.io/qwik";

type InputToggleProps = {
  onChange$: QRL<(e: Event, t: HTMLInputElement) => void>;
  checked: boolean;
  /** set for the `name` property if change handler needs it */
  propertyPath?: string;
  name?: string;
  classes?: ClassList;
  disabled?: boolean;
};
export default component$<InputToggleProps>(
  ({
    onChange$,
    propertyPath,
    name,
    checked,
    classes = "",
    disabled = false,
  }) => {
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
        top: 1px;
      }
      input:checked ~ [data-label="toggle-slot"] {
        background-color: #475569; /* bg-slate-600 */
      }
      input:checked ~ [data-label="toggle-slot"] > [data-label="toggle-switch"] {
        background-color: #f8fafc; /* bg-slate-50 */
        left: calc(1px + 1.5em);
        /* border-color: #10b981; */ /* emerald-500 */
        border-color: #34d399; /* emerald-400 */ 
      }
      input:focus ~ [data-label="toggle-slot"],
      input:focus ~ [data-label="toggle-slot"]>[data-label="toggle-switch"] {
        outline: 1px solid #fff;
      }
/*
* old sizes: 56px w-14 3.5rem
* 32px w-8 2rem
* 28px w-7 1.75rem
* 24px w-6 1.625rem
*
* */

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
        class={`${classes} flex gap-[min(0.75em,1.75vw)] items-center justify-between w-full`}
      >
        <label
          class="flex w-full cursor-pointer items-center justify-between gap-[0.30em] sm:gap-[0.75em] text-left text-slate-100"
          // gap is halved because input is also gapped
        >
          <Slot name="label" />

          <input
            disabled={disabled}
            class="h-0 w-0 cursor-pointer opacity-0"
            type="checkbox"
            name={propertyPath ?? name ?? ""} // could be used in onChange
            onChange$={onChange$}
            checked={checked}
          />

          <div
            data-label="toggle-slot"
            class={`relative w-[calc(4px+3.5em)] h-[calc(4px+2em)] flex-shrink-0 transition-all duration-200 ease-in-out border border-slate-500 rounded-full`}
          >
            <div
              data-label="toggle-switch"
              class={`absolute w-[2em] h-[2em] transition-all duration-200 ease-in-out border-2 rounded-full`}
            />
          </div>
        </label>

        <Slot name="tooltip" />
      </div>
    );
  },
);
