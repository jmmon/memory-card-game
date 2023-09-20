import { createContextId } from "@builder.io/qwik";
import type { iGameContext } from "../types/types";

export const GameContext = createContextId<iGameContext>('GameContext');
