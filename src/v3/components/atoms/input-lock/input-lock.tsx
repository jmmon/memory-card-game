import { Slot, component$ } from "@builder.io/qwik";
import type { PropFunction } from "@builder.io/qwik";
import { iUserSettings } from "~/v3/types/types";

export default component$(
  ({
    text,
    name,
    onChange$,
    classes,
    disabled = false,
    settings,
  }: {
    text: string;
    name: string;
    onChange$: PropFunction<(e: Event) => void>;
    classes?: string;
    disabled?: boolean;
    settings: iUserSettings;
  }) => {
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
            class="h-6 w-6 flex-shrink-0 cursor-pointer"
            type="checkbox"
            id={text}
            name={name || text}
            onChange$={onChange$}
            checked={settings[properties[0]][properties[1]]}
          />
        </label>

        <Slot />
      </div>
    );
  },
);
