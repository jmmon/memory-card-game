import { component$ } from "@builder.io/qwik";
import ModalRow from "../../atoms/modal-row/modal-row";
import ModalStats from "../../atoms/modal-stats/modal-stats";
import FormattedTime from "../formatted-time/formatted-time";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";

export default component$(() => {
  const ctx = useGameContextService();
  return (
    <>
      <ModalRow>
        <ModalStats
          label="Pairs:"
          content={`${ctx.state.gameData.successfulPairs.length}/${
            ctx.state.userSettings.deck.size / 2
          }`}
        />
      </ModalRow>
      <ModalRow>
        <ModalStats
          label="Mismatches:"
          content={`${ctx.state.gameData.mismatchPairs.length}
              ${
                ctx.state.userSettings.maxAllowableMismatches !== -1
                  ? `/${ctx.state.userSettings.deck.size / 2}`
                  : ""
              }`}
        />
      </ModalRow>
      <ModalRow>
        <ModalStats label="Time:">
          <FormattedTime timeMs={ctx.timer.state.time} limit={3} />
        </ModalStats>
      </ModalRow>
    </>
  );
});
