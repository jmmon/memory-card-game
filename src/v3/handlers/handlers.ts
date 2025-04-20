import { $ } from "@builder.io/qwik";

const selectFieldOnFocus$ = $(
  (_: FocusEvent, t: HTMLInputElement | HTMLTextAreaElement) => t.select(),
);

export { selectFieldOnFocus$ };
