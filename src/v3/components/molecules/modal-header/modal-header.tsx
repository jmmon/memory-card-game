import ModalCloseButton from "~/v3/components/atoms/modal-close-button/modal-close-button";
import {
  component$,
  useSignal,
  useTask$,
  type QRL,
} from "@builder.io/qwik";

type ModalHeaderProps = {
  hideModal$: QRL<() => void>;
  title: string;
  buttonOpts?: Partial<{ onLeft?: boolean; text?: string }>;
  autofocus?: boolean;
  isShowing?: boolean;
};
const ModalHeader = component$<ModalHeaderProps>(
  ({
    hideModal$,
    title,
    buttonOpts = { onLeft: false, text: "x" },
    autofocus = false,
    isShowing,
  }) => {
    const ref = useSignal<HTMLButtonElement>();

    useTask$(({ track }) => {
      track(() => isShowing);
      if (isShowing && autofocus) {
        ref.value?.focus();
      }
    });

    return (
      <header class="grid max-h-full grid-cols-[1.625rem_1fr_1.625rem] items-center justify-center">
        <ModalCloseButton
          ref={ref}
          hideModal$={hideModal$}
          text={buttonOpts.text}
          class={`${buttonOpts.onLeft ? "order-1" : "order-3"}`}
          onLeft={buttonOpts.onLeft}
        />
        <h3 class="text-lg text-slate-100 order-2">{title}</h3>
        <span class={`${buttonOpts.onLeft ? "order-3" : "order-1"}`}></span>
      </header>
    );
  },
);
export default ModalHeader;
