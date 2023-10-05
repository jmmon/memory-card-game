import type { PropFunction } from "@builder.io/qwik";
import CloseButton from "../../atoms/modal-close-button/modal-close-button";

export default ({
  hideModal$,
  title,
  buttonOpts = { onLeft: false, text: "x" },
}: {
  hideModal$: PropFunction<() => void>;
  title: string;
  buttonOpts?: Partial<{ onLeft?: boolean; text?: string }>;
}) => {
  const button = <CloseButton hideModal$={hideModal$} text={buttonOpts.text} />;

  return (
    <header class="grid max-h-full grid-cols-[0.3fr_1fr_0.3fr] justify-center items-center">
      {buttonOpts.onLeft ? button : <div></div>}
      <h3 class="text-lg text-slate-100">{title}</h3>
      {!buttonOpts.onLeft ? button : <div></div>}
    </header>
  );
};
