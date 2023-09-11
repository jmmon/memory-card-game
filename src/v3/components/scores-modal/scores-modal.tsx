import { component$, useContext, useSignal, useTask$ } from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import { Score } from "~/v3/db/schema";
import PixelAvatar, { calculateOnlyColor } from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";

export default component$(() => {
  const gameContext = useContext(GameContext);
  useTask$(async () => {
    gameContext.interface.scoresModal.scores =
      await serverDbService.getAllScores();
  });
  return (
    <Modal
      isShowing={gameContext.interface.scoresModal.isShowing}
      //isShowing={true}
      hideModal$={() => {
        gameContext.interface.scoresModal.isShowing = false;
      }}
      title="Scoreboard"
    >
      <table class="w-full h-full max-h-[90vh] overflow-y-auto">
        <thead>
          <th>Avatar</th>
          <th>Initials</th>
          <th>Deck Size</th>
          <th>Pairs</th>
          <th>Game Time</th>
          <th>Mismatches</th>
          <th>Date</th>
        </thead>
        <tbody>
          {gameContext.interface.scoresModal.scores.map((score) => (
            <ScoreRow score={score} />
          ))}
        </tbody>
      </table>
    </Modal>
  );
});

const formatGameTime = (gameTime: string) => {
  const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  const haveMinutes = minutes !== 0;
  return `${haveHours ? hours + "h" : ""}${
    haveMinutes
      ? (haveHours ? String(minutes).padStart(2, "0") : minutes) + "m"
      : ""
  }${String(seconds).padStart(haveMinutes ? 2 : 1, "0")}s`;
};

const GameTime = component$(({ gameTime }: { gameTime: string }) => {
  const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  const haveMinutes = minutes !== 0;

  const units = ["h", "m", "s"];

  return (
    <>
      {haveHours ? (
        <>
          <span>{hours}</span>
          <span class="text-gray-400">h</span>
        </>
      ) : (
        ""
      )}
      {haveMinutes ? (
        <>
          {haveHours ? (
            <>
              <span class="ml-1">{String(minutes).padStart(2, "0")}</span>
            </>
          ) : (
            <>
              <span>{minutes}</span>
            </>
          )}
          <span class="text-gray-400">m</span>
        </>
      ) : (
        ""
      )}

      <>
        {haveMinutes ? (
          <>
            <span class="ml-1">{String(seconds).padStart(2, "0")}</span>
          </>
        ) : (
          <>
            <span>{seconds}</span>
          </>
        )}
        <span class="text-gray-400">s</span>
      </>
    </>
  );
});

const ScoreRow = component$(({ score }: { score: Score }) => {
  const text = useSignal(score.userId ?? "");
  const color = useSignal("");
  useTask$(async () => {
    color.value = await calculateOnlyColor(score.initials as string);
  });
  return (
    <>
      {color.value === "" ? (
        <div class="w-full h-full border border-gray-800 rounded-lg"></div>
      ) : (
        <tr
          class="w-full h-full border border-gray-800 rounded-lg"
          style={{ backgroundColor: color.value }}
        >
          <td>
            <PixelAvatar
              text={text}
              color={color.value}
              width={40}
              height={40}
              classes="border border-gray-100"
            />
          </td>
          <td>{score.initials}</td>
          <td>{score.deckSize}</td>
          <td>{score.pairs}</td>
          <td>
            <span class="block">
              <GameTime gameTime={score.gameTime as string} />
            </span>
            <span class="block">(percentile)</span>
          </td>
          <td>
            <span class="block">{score.mismatches}</span>
            <span class="block">(percentile)</span>
          </td>
          <td>{score.createdAt?.toDateString() ?? "..."}</td>
        </tr>
      )}
    </>
  );
});
