import type { ClassList } from "@builder.io/qwik";
import { Slot, component$ } from "@builder.io/qwik";

type CardFaceProps = {
  label: string;
  classes?: ClassList;
};
export default component$<CardFaceProps>(
  ({ label = "card-front", classes = "" }) => {
    return (
      <div
        // absolute positioning so the faces are stacked back to back
        class={`card-face w-full absolute [backface-visibility:hidden] ${classes}`}
        data-label={label}
      >
        <Slot />
      </div>
    );
  },
);
