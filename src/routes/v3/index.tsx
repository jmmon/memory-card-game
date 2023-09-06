import { component$, useStyles$ } from "@builder.io/qwik";
import styles from "./styles.css?inline";
import Game from "~/v3/components/game/game";

export default component$(() => {
  useStyles$(styles);
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600 z-[-1]">
        v3 Route
      </h1>
      <Game />
    </div>
  );
});
