import { component$, useContext } from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { GameContext } from "~/v3/context/gameContext";

export default component$(() => {
  const gameContext = useContext(GameContext);
  return (
    <code
      class={` bg-slate-800 flex flex-col text-center text-slate-200 ${header.CODE_PADDING}`}
    >
      <span class="mx-auto w-min">cards selected:</span>
      <div class="mx-auto grid grid-cols-[3.6em_0.6em_3.6em]">
        <span>{gameContext.game.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{gameContext.game.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});
