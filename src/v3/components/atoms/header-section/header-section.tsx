import type { ClassList} from "@builder.io/qwik";
import { Slot, component$ } from "@builder.io/qwik";

// slot requires "component$", can't do inliner
type HeaderSectionProps = { classes?: ClassList };
export default component$<HeaderSectionProps>(
  ({ classes = "justify-center" }) => {
    return (
      <div class={`w-full flex gap-3 ${classes} `}>
        <Slot />
      </div>
    );
  },
);
