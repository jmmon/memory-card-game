import { component$ } from "@builder.io/qwik";
import { header } from "~/v3/constants/header-constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import { roundToDecimals } from "~/v3/utils/formatTime";

export default component$(() => {
  const ctx = useGameContextService();
  return (
    <code
      class={` bg-slate-800 flex gap-1.5 text-center ${header.CODE_TEXT_LIGHT} ${header.CODE_PADDING}`}
    >
      <div class={` flex flex-col ${header.CODE_TEXT_DARK} items-end `}>
        <span>header~</span>
        <span>board:</span>
        <span>window:</span>
      </div>
      <div class="flex gap-0.5">
        <div class="flex flex-col text-right">
          <span>{roundToDecimals(ctx.state.boardLayout.width)}</span>
          <span>{roundToDecimals(ctx.state.boardLayout.width)}</span>
          <span>{roundToDecimals(window.innerWidth)}</span>
        </div>
        <div class={` flex flex-col ${header.CODE_TEXT_DARK}`}>
          <span>x</span>
          <span>x</span>
          <span>x</span>
        </div>
        <div class={` text-left flex flex-col `}>
          <span>
            {roundToDecimals(window.innerHeight - ctx.state.boardLayout.height)}
          </span>
          <span>{roundToDecimals(ctx.state.boardLayout.height)}</span>
          <span>{roundToDecimals(window.innerHeight)}</span>
        </div>
      </div>
    </code>
  );
});
