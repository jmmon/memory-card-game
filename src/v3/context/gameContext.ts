import { createContextId } from "@builder.io/qwik";
import type { GameContext as TGameContext } from "../types/types";

export const GameContext = createContextId<TGameContext>('GameContext');
