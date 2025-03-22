import { component$, useContext } from "@builder.io/qwik"
import ModalRow from "../../atoms/modal-row/modal-row";
import ModalStats from "../../atoms/modal-stats/modal-stats";
import FormattedTime from "../formatted-time/formatted-time";
import { GameContext } from "~/v3/context/gameContext";

export default component$(() => {
  const gameContext = useContext(GameContext);
  return (
    <>
      <ModalRow>
        <ModalStats
          label="Pairs:"
          content={
            `${gameContext.gameData.successfulPairs.length
            }/${gameContext.userSettings.deck.size / 2
            }`
          }
        />
      </ModalRow>
      <ModalRow>
        <ModalStats
          label="Mismatches:"
          content={
            `${gameContext.gameData.mismatchPairs.length}
              ${gameContext.userSettings.maxAllowableMismatches !== -1
              ? `/${gameContext.userSettings.deck.size / 2}`
              : ""}`
          }
        />
      </ModalRow>
      <ModalRow>
        <ModalStats
          label="Time:"
        >
          <FormattedTime timeMs={gameContext.timer.state.time} limit={3} />
        </ModalStats>
      </ModalRow>
    </>
  );

});
