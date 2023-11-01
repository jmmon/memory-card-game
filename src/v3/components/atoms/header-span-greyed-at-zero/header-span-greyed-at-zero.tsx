export default ({ val, text }: { val: number; text: string }) => (
  <span class={`text-right ${val === 0 ? "text-slate-400" : "text-slate-100"}`}>
    {val}
    <span class={`text-right text-slate-400`}>{text}</span>
  </span>
);
