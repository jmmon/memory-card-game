import { Slot, component$, useStyles$ } from "@builder.io/qwik";
import { Popover } from "@qwik-ui/headless";
import type { PopoverRootProps } from "@qwik-ui/headless/components/popover/popover-root";
import QuestionMark from "~/media/icons/question-mark.svg?jsx";

type InfoTooltipProps = PopoverRootProps & {
  key?: string | number;
  gutter?: number;
};

const size = "1.5em";

export default component$(({
  key = Math.random(),
  floating = "top-end",
  gutter = 4,
}: InfoTooltipProps) => {
  useStyles$(`
  button.popover-trigger {
    border: none;
    background: transparent;
    width: ${size};
    height: ${size};
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  `);
  return (
    <Popover.Root gutter={gutter} key={key} floating={floating}>
      <Popover.Trigger class="popover-trigger">
        <QuestionMark
          style={{
            fill: "#c0c8ff",
            width: size,
            height: size
          }}
        />
      </Popover.Trigger>
      <Popover.Panel class="max-w-[60vw] popover-panel text-slate-100 border border-slate-200 rounded p-2 bg-slate-800">
        <Slot />
      </Popover.Panel>
    </Popover.Root>
  );
})
