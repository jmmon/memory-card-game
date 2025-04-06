import { component$ } from "@builder.io/qwik";
import FormattedTime from "~/v3/components/molecules/formatted-time/formatted-time";
import { header } from "~/v3/constants/header-constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();

  return (
    <code
      class={`bg-slate-800 flex items-center ${header.CODE_TEXT_LIGHT} ${header.CODE_PADDING}`}
    >
      <FormattedTime
        classes={`w-[6.25em] min-w-min ${ctx.timer.shouldBlink.value ? "opacity-0" : ""}`}
        timeMs={ctx.timer.state.time}
        limit={1}
      />
    </code>
  );
});
