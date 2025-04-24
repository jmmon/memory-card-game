import { formatTimeFromMs, truncateMs } from "~/v3/utils/formatTime";
import HeaderSpanGreyedAtZero from "~/v3/components/atoms/header-span-greyed-at-zero/header-span-greyed-at-zero";
import type { FunctionComponent } from "@builder.io/qwik/jsx-runtime";
import type { ClassList } from "@builder.io/qwik";

type FormattedTimeProps = {
  timeMs: number;
  limit?: number;
  classes?: ClassList;
};
const FormattedTime: FunctionComponent<FormattedTimeProps> = ({
  timeMs,
  limit = 2,
  classes = "",
}) => {
  const { minutes, seconds, ms } = formatTimeFromMs(timeMs);
  const limitedMs = truncateMs(Number(ms), limit);

  return (
    <div class={`text-center text-slate-100 ${classes}`}>
      <HeaderSpanGreyedAtZero val={minutes} text="m" /> {seconds}
      <span class="text-xs text-slate-400">{limitedMs}s</span>
    </div>
  );
};
export default FormattedTime;
