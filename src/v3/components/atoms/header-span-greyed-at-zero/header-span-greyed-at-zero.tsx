import type { FunctionComponent } from "@builder.io/qwik/jsx-runtime";

type HeaderSpanGreyedAtZeroProps = { val: number; text: string };
const HeaderSpanGreyedAtZero: FunctionComponent<
  HeaderSpanGreyedAtZeroProps
> = ({ val, text }) => (
  <span class={`text-right ${val === 0 ? "text-slate-400" : "text-slate-100"}`}>
    {val}
    <span class={`text-right text-slate-400`}>{text}</span>
  </span>
);
export default HeaderSpanGreyedAtZero;
