import { Slot, component$ } from "@builder.io/qwik";

// slot requires "component$", can't do inliner
export default component$(
  ({ classes = "justify-center" }: { classes?: string }) => {
    return (
      <div class={`w-full flex gap-3 ${classes} `}>
        <Slot />
      </div>
    );
  }
);
