import { createContextId } from "@builder.io/qwik";

export type MatchModalContext = {
  modal: {
    isShowing: boolean;
    text: string;
  }
};

export const MatchModalContext =
  createContextId<MatchModalContext>("MatchModalContext");
