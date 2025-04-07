import type { ClassList } from "@builder.io/qwik";
import { Slot, component$ } from "@builder.io/qwik";

type CardFaceProps = {
  label: "card-front" | "card-back";
  classes?: ClassList;
};
export default component$<CardFaceProps>(({ label, classes = "" }) => (
  <div
    data-label={label}
    // absolute positioning so the faces are stacked back to back
    class={`card-face w-full absolute [backface-visibility:hidden] ${classes}`}
  >
    <Slot />
  </div>
));
