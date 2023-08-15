import { createContextId } from "@builder.io/qwik";
import type { AppStore } from "../v3-game/v3-game";

export const AppContext = createContextId<AppStore>('AppContext');
