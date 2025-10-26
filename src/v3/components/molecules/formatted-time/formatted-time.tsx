import { formatTimeFromMs, msToDs } from "~/v3/utils/formatTime";
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
  classes = "",
}) => {
  const { minutes, seconds, ms } = formatTimeFromMs(timeMs);
  const limitedMs = msToDs(Number(ms));

  return (
    <div class={`text-center text-slate-100 ${classes}`}>
      <HeaderSpanGreyedAtZero val={minutes} text="m" /> {seconds}
      <span class={`text-[0.875em] text-slate-400`}>{limitedMs}s</span>
    </div>
  );
};
export default FormattedTime;
