import {
  component$,
  useComputed$,
  useContext,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import { Score } from "~/v3/db/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";
import { truncateMs } from "~/v3/utils/formatTime";

const DEFAULT_DATE = new Date(Date.parse(`0000-00-00T00:00:00.000Z`));

export default component$(() => {
  const gameContext = useContext(GameContext);

  useTask$(async () => {
    gameContext.interface.scoresModal.scores =
      await serverDbService.getAllScores();
  });

  const scoresByDeckSize = useComputed$(() => {
    const dictionary: { [key: string]: Score[] } = {};
    const deckSizes = new Set(
      gameContext.interface.scoresModal.scores.map((s) => s.deckSize)
    );
    // console.log(Array.from(deckSizes));

    for (let i = 6; i <= 52; i += 2) {
      if (!deckSizes.has(i)) continue;
      const matchingScores = gameContext.interface.scoresModal.scores.filter(
        (s) => s.deckSize === 6
      );
      dictionary[String(i)] = matchingScores;
    }

    return dictionary;
  });

  useStyles$(`
  table {
    overflow: hidden;
  }
  table.scoreboard thead {
    overflow: hidden;
    border: 1px solid #222;
    background-color: #00000010;
    z-index: -1;
  }
  table.scoreboard th.rotate {
    height: 5.1em;
    white-space: nowrap;
  }
  /* Magic Numbers.. might need tweaking */
   table.scoreboard th.rotate > div {
    width: 2em;
    transform-origin: left top;
    transform:
      translate(-0.1em, 3.45em)
      rotate(-45deg);
  }
  table.scoreboard th.rotate > div > div {
    border-top: 1px solid #222;
    text-align: left;
    width: 10rem;
/* x padding does not mess with the border, yay! */
    padding: 2px 2em;
  }

  table.scoreboard td + td {
    border-left: 1px solid #444;
  }
  `);
  return (
    <Modal
      isShowing={gameContext.interface.scoresModal.isShowing}
      //isShowing={true}
      hideModal$={() => {
        gameContext.interface.scoresModal.isShowing = false;
      }}
      title="Scoreboard"
    >
      <table class="scoreboard w-full h-full max-h-[90vh] ">
        <thead class="text-slate-100 text-xs sm:text-sm md:text-md">
          <th class="rotate w-[2.5rem]">
            <div>
              <div>Avatar</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Initials</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Deck Size</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Pairs</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Game Time</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Mismatches</div>
            </div>
          </th>
          <th class="rotate">
            <div>
              <div>Date</div>
            </div>
          </th>
        </thead>
        <tbody>
          {gameContext.interface.scoresModal.scores.map((score) => {
            const matchingScores =
              scoresByDeckSize.value[String(score.deckSize)];
            return (
              <ScoreRow
                key={score.id}
                score={score}
                allScoresMatchingDeckSize={matchingScores}
              />
            );
          })}
        </tbody>
      </table>
    </Modal>
  );
});

const GameTime = component$(({ gameTime }: { gameTime: string }) => {
  const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  const haveMinutes = minutes !== 0;
  const [truncSeconds, ms] = String(seconds).split(".");
  const limitedMs = truncateMs(Number(ms ?? 0), 3);

  return (
    <>
      {haveHours ? (
        <>
          <span>{hours}</span>
          <span class="text-slate-400">h</span>
        </>
      ) : (
        ""
      )}

      {haveMinutes ? (
        <>
          {haveHours ? (
            <span class="ml-1">{String(minutes).padStart(2, "0")}</span>
          ) : (
            <span>{minutes}</span>
          )}
          <span class="text-slate-400">m</span>
        </>
      ) : (
        ""
      )}

      <>
        {haveMinutes ? (
          <span class="ml-1">{truncSeconds.padStart(2, "0")}</span>
        ) : (
          <span>{Number(truncSeconds)}</span>
        )}
        <span class="text-xs text-slate-400">{limitedMs}s</span>
      </>
    </>
  );
});

const timestampToMs = (time: string) => {
  const [hours, minutes, seconds] = time.split(":").map((n) => Number(n));
  return (
    Number(hours) * 60 * 60 * 1000 +
    Number(minutes) * 60 * 1000 +
    Number(seconds) * 1000
  );
};

const BG_COLOR_ALPHA = 0.9;
const ScoreRow = component$(
  ({
    score,
    allScoresMatchingDeckSize,
  }: {
    score: Score;
    allScoresMatchingDeckSize: Score[];
  }) => {
    console.log({ score });

    const bgColor = useComputed$(() => {
      return (score.color as String).slice(0, -2) + `${BG_COLOR_ALPHA})`;
    });

    const timePercentile = useComputed$(() => {
      const sorted = allScoresMatchingDeckSize.sort(
        (a, b) =>
          timestampToMs(a.gameTime as string) -
          timestampToMs(b.gameTime as string)
      );
      const indexOfThisScore = sorted.findIndex((s) => s.id === score.id);
      // console.log({
      //   sorted,
      //   indexOfThisScore,
      //   thisScore: sorted[indexOfThisScore],
      // });
      //
      const countBelowThisScore = indexOfThisScore;
      const percentile = (countBelowThisScore / sorted.length) * 100;

      return Math.round(percentile * 10) / 10;
    });

    /*
     * calculating percentile when we have multiple matching scores:
     * e.g. 0, 1, 2, 2, 2, 2, 3
     * (length of 7)
     * Find percentile of 3 =>
     *   count < 3 => 6
     *   6 / 7 * 100 => 85.714%
     *   This score is better than 85.7% of all scores
     *
     * Find percentile  of 2 =>
     *   count < 2 => 2??
     *   2 / 7 * 100 => 28.571%
     *   This score is better than 28.571% of all scores
     *
     * I guess that's accurate!
     * */
    const mismatchesPercentile = useComputed$(() => {
      const sorted = allScoresMatchingDeckSize.sort(
        (a, b) => (a.mismatches ?? 0) - (b.mismatches ?? 0)
      );
      const indexOfThisScore = sorted.findIndex((s) => s.id === score.id);
      // console.log({
      //   sorted,
      //   indexOfThisScore,
      //   thisScore: sorted[indexOfThisScore],
      // });

      const countBelowThisScore = indexOfThisScore;
      const percentile = (countBelowThisScore / sorted.length) * 100;

      // inverse the mismatches percentile, so 0 is the best score
      return Math.round((100 - percentile) * 10) / 10;
    });

    // useTask$(async () => {
    //   calcColor();
    // });

    return (
      <>
        {/* {score.color === "" ? ( */}
        {/*   <div class="w-full h-full border border-slate-900 rounded-lg"></div> */}
        {/* ) : ( */}
        <tr
          class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md"
          style={{ backgroundColor: bgColor.value as string }}
        >
          <td class="flex justify-center">
            <PixelAvatar
              color={score.color as string}
              pixels={score.pixels as string}
              width={40}
              height={40}
              classes="border border-gray-100"
            />
          </td>
          <td>{score.initials}</td>
          <td>{score.deckSize}</td>
          <td>{score.pairs}</td>
          <td>
            <span class="block">{timePercentile.value}%</span>
            <span class="block">
              <GameTime gameTime={score.gameTime as string} />
            </span>
          </td>
          <td>
            <span class="block">{mismatchesPercentile.value}%</span>
            <span class="block">{score.mismatches}</span>
          </td>
          <td>
            <CreatedAt createdAt={score.createdAt ?? DEFAULT_DATE} />
          </td>
        </tr>
        {/* )} */}
      </>
    );
  }
);

const CreatedAt = ({ createdAt }: { createdAt: Date }) => {
  const [date, time] = createdAt.toLocaleString().split(", ");
  return (
    <>
      <span class="block">{date}</span>
      <span class="block whitespace-nowrap">{time}</span>
    </>
  );
};
