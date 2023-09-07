import { component$, useStyles$ } from "@builder.io/qwik";
import styles from "./styles.css?inline";
import Game from "~/v3/components/game/game";
// import SubmitScoreModal from "~/v3/components/submit-score-modal/submit-score-modal";

export default component$(() => {
  useStyles$(styles);
  return (
    <div class="flex flex-col w-full h-full items-center">
      <h1 class="absolute top-0 left-0 text-sm md:text-lg lg:text-2xl text-slate-600 z-[-1]">
        v3 Route
      </h1>
{/* <SubmitScoreModal /> */}
      <Game />
    </div>
  );
});
