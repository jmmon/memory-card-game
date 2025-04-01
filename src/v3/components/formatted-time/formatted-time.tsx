import {
  formatTime,
  // truncateMs
} from "~/v3/utils/formatTime";

export const GrayedAtZero = ({ val, text }: { val: number; text: string }) => (
  <span class={`text-right ${val === 0 ? "text-slate-400" : "text-slate-100"}`}>
    {val}
    <span class={`text-right text-slate-400`}>{text}</span>
  </span>
);

export const FormattedTime = ({ timeDs }: { timeDs: number }) => {
  const { minutes, seconds, tenths } = formatTime(timeDs);

  return (
    <span class="text-slate-100 text-left">
      <GrayedAtZero val={minutes} text="m" /> {String(seconds).padStart(2, "0")}
      <span class="text-xs text-slate-400">.{tenths}s</span>
    </span>
  );
};
