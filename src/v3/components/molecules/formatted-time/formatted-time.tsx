import { formatTime, truncateMs } from "~/v3/utils/formatTime";
import HeaderSpanGreyedAtZero from "../../atoms/header-span-greyed-at-zero/header-span-greyed-at-zero";

export default ({
  timeMs,
  limit = 2,
}: {
  timeMs: number;
  limit?: number;
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
