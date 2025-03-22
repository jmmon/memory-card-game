import { ClassList, Slot, component$ } from "@builder.io/qwik";
import { Popover } from "@qwik-ui/headless";
import type { PopoverRootProps } from "@qwik-ui/headless/components/popover/popover-root";

type PopoverProps = PopoverRootProps & {
  key?: string | number;
  gutter?: number;
  size?: { width: string; height: string; } | string;
  triggerClasses?: ClassList;
  rootClasses?: ClassList;
  panelClasses?: ClassList;
};

const DEFAULT_SIZE = "1.5em";

export default component$(({
  key = Math.random(),
  floating = "top-end",
  gutter = 4,
  size,
  triggerClasses,
  rootClasses,
  panelClasses,
}: PopoverProps) => {
  const width = size ? (typeof size === 'string' ? size : size.width) : DEFAULT_SIZE;
  const height = size ? (typeof size === 'string' ? size : size.height) : DEFAULT_SIZE;
  return (
    <Popover.Root class={rootClasses} gutter={gutter} key={key} floating={floating}>
      <Popover.Trigger class={`border-0 bg-transparent p-0 ${triggerClasses}`} style={{ width, height }}>
        <Slot name="trigger" />
      </Popover.Trigger>
      <Popover.Panel class={`max-w-[60vw] text-slate-100 border border-slate-500 rounded p-2 bg-slate-800 ${panelClasses}`}>
        <Slot />
      </Popover.Panel>
    </Popover.Root>
  );
})
