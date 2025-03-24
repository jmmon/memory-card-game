import { component$ } from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();
  return (
    <code
      class={` bg-slate-800 flex flex-col text-center text-slate-200 ${header.CODE_PADDING}`}
    >
      <span class="mx-auto w-min">cards selected:</span>
      <div class="mx-auto grid grid-cols-[3.6em_0.6em_3.6em]">
        <span>{ctx.state.gameData.selectedCardIds[0] ?? "-"}</span>
        <span>:</span>
        <span>{ctx.state.gameData.selectedCardIds[1] ?? "-"}</span>
      </div>
    </code>
  );
});
