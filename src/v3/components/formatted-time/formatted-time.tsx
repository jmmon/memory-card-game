import { formatTime, truncateMs } from "~/v3/utils/formatTime";

export const GrayedAtZero = ({ val, text }: { val: number; text: string }) => (
  <span class={`text-right ${val === 0 ? "text-slate-400" : ""}`}>
    {val}
    <span class={`text-right text-slate-400`}>{text}</span>
  </span>
);

export const FormattedTime = ({
  timeMs,
  limit = 2,
}: {
  timeMs: number;
  limit?: number;
}) => {
  const { minutes, seconds, ms } = formatTime(timeMs);
  const limitedMs = truncateMs(Number(ms), limit);

  return (
    <span class="text-left">
      <GrayedAtZero val={minutes} text="m" /> {seconds}
      <span class="text-xs text-slate-400">{limitedMs}s</span>
    </span>
  );
};
