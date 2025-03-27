import { formatTime, truncateMs } from "~/v3/utils/formatTime";
import HeaderSpanGreyedAtZero from "~/v3/components/atoms/header-span-greyed-at-zero/header-span-greyed-at-zero";
import type { FunctionComponent } from "@builder.io/qwik/jsx-runtime";

type FormattedTimeProps = {
  timeMs: number;
  limit?: number;
};
const FormattedTime: FunctionComponent<FormattedTimeProps> = ({
  timeMs,
  limit = 2,
}) => {
  const { minutes, seconds, ms } = formatTime(timeMs);
  const limitedMs = truncateMs(Number(ms), limit);

  return (
    <span class="text-left text-slate-100">
      <HeaderSpanGreyedAtZero val={minutes} text="m" /> {seconds}
      <span class="text-xs text-slate-400">{limitedMs}s</span>
    </span>
  );
};
export default FormattedTime;
