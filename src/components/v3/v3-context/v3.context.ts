import { createContextId } from "@builder.io/qwik";
import { AppStore } from "../v3-game/v3-game";

export const AppContext = createContextId<AppStore>('AppContext');
