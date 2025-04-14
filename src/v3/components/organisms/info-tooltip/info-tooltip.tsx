import type { ClassList} from "@builder.io/qwik";
import { Slot, component$ } from "@builder.io/qwik";
import type { PopoverRootProps } from "@qwik-ui/headless/components/popover/popover-root";
import QuestionMark from "~/media/icons/question-mark.svg?jsx";
import Popover from "../../molecules/popover/popover";

const DEFAULT_SIZE = "1.5em";

type InfoTooltipProps = PopoverRootProps & {
  key?: string | number;
  gutter?: number;
  size?: string | { width: string; height: string };
};
export default component$<InfoTooltipProps>(
  ({ key = Math.random(), floating = "top-end", gutter = 4 }) => {
    return (
      <Popover
        gutter={gutter}
        key={key}
        floating={floating}
        size={DEFAULT_SIZE}
        triggerClasses="flex justify-center items-center"
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
