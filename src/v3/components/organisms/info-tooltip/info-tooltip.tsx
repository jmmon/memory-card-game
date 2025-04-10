import { ClassList, Slot, component$ } from "@builder.io/qwik";
import type { PopoverRootProps } from "@qwik-ui/headless/components/popover/popover-root";
import QuestionMark from "~/media/icons/question-mark.svg?jsx";
import Popover from "../../molecules/popover/popover";

const DEFAULT_SIZE = "1.5em";

type InfoTooltipProps = PopoverRootProps & {
  key?: string | number;
  gutter?: number;
  size?: string | { width: string; height: string };
  triggerClasses?: ClassList;
  rootClasses?: ClassList;
};
export default component$<InfoTooltipProps>(
  ({ key = Math.random(), floating = "top-end", gutter = 4, triggerClasses, rootClasses }) => {
    return (
      <Popover
        rootClasses={rootClasses}
        gutter={gutter}
        key={key}
        floating={floating}
        size={DEFAULT_SIZE}
        triggerClasses={ `flex justify-center items-center ${triggerClasses}` }
      >
        <QuestionMark
          q:slot="trigger"
          style={{
            fill: "#c0c8ff",
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
          }}
        />
        <Slot />
      </Popover>
    );
  },
);
