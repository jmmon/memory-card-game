import type {QRL} from "@builder.io/qwik";

export type UseVisibilityChangeProps = {
  onHidden$?: QRL<() => void>;
  onShown$?: QRL<() => void>;
  onChange$?: QRL<() => void>;
};
