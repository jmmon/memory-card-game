import { component$, useContext } from "@builder.io/qwik";
import { GameContext } from "~/v3/context/gameContext";
import FormattedTime from "../../molecules/formatted-time/formatted-time";
import { header } from "~/v3/constants/header-constants";

export default component$(() => {
  const gameContext = useContext(GameContext);

  return (
    <code
      class={` bg-slate-800 flex gap-1.5 text-center items-center ${header.CODE_TEXT_LIGHT} ${header.CODE_PADDING}`}
    >
      <span
        class={
          gameContext.timer.state.isPaused && gameContext.timer.state.blink
            ? "opacity-0"
            : ""
        }
      >
        <FormattedTime timeMs={gameContext.timer.state.time} limit={2} />
      </span>
    </code>
  );
});
