import CloseButton from "~/v3/components/atoms/modal-close-button/modal-close-button";
import type { QRL } from "@builder.io/qwik";

export default ({
  hideModal$,
  title,
  buttonOpts = { onLeft: false, text: "x" },
}: {
  hideModal$: QRL<() => void>;
  title: string;
  buttonOpts?: Partial<{ onLeft?: boolean; text?: string }>;
}) => {
  const button = <CloseButton hideModal$={hideModal$} text={buttonOpts.text} />;

  return (
    <header class="grid max-h-full grid-cols-[0.3fr_1fr_0.3fr] items-center justify-center">
      {buttonOpts.onLeft ? button : <div></div>}
      <h3 class="text-lg text-slate-100">{title}</h3>
      {!buttonOpts.onLeft ? button : <div></div>}
    </header>
  );
};
