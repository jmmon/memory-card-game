import { component$, useContextProvider, useStore, useStyles$ } from "@builder.io/qwik";
import styles from "./styles.css?inline";
import Game from "~/v3/components/game/game";
import { routeLoader$ } from "@builder.io/qwik-city";
import crypto from "node:crypto";
import CONSTANTS from "~/v3/utils/constants";
import { useTimer } from "~/v3/utils/useTimer";
import { INITIAL_STATE } from "~/v3/context/initial";
import { GameContext } from "~/v3/context/gameContext";
import type { iGameContext } from "~/v3/types/types";

// for game end modal, provides default hash
export const useDefaultHash = routeLoader$(() =>
  crypto.randomBytes(CONSTANTS.GAME.HASH_LENGTH_BYTES).toString("hex")
);

export default component$(() => {
  const timer = useTimer();
  console.log("game route");
  const gameContext = useStore<iGameContext>(
    {
      ...INITIAL_STATE,
      timer: timer,
    },
    { deep: true }
  );
  useContextProvider(GameContext, gameContext);

  useStyles$(styles);
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600/80 z-[-1]">
        Memory Card Game
      </h1>
      <Game />
    </div>
  );
});
