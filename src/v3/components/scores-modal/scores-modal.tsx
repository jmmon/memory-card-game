import {
  $,
  PropFunction,
  QwikMouseEvent,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import { Score } from "~/v3/db/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";
import { truncateMs } from "~/v3/utils/formatTime";
import { ScoreWithPercentiles } from "~/v3/types/types";

const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z";
const DATE_JAN_1_1970 = new Date(JAN_1_1970_STRING);

const PIXEL_AVATAR_SIZE = 44;
const PIXEL_AVATAR_WIDTH_CLASS = `w-[${PIXEL_AVATAR_SIZE}px]`;

const mapColTitleToObjKey: { [key: string]: string } = {
  initials: "initials",
  "deck-size": "deckSize",
  pairs: "pairs",
  "game-time": "timePercentile",
  mismatches: "mismatchPercentile",
  date: "createdAt",
};

const sortFunctions: {
  [key: string]: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => number;
} = {
  initials: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.initials as string) ?? "").localeCompare(
      (a.initials as string) ?? ""
    );
    return value;
  },
  deckSize: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.deckSize as number) ?? 0) - ((a.deckSize as number) ?? 0);
    return value;
  },
  pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.pairs as number) ?? 0) - ((a.pairs as number) ?? 0);
    return value;
  },
  timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    // default sort direction is flipped ( smaller is better)
    const value =
      ((a.timePercentile as number) ?? 0) - ((b.timePercentile as number) ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    // default sort direction is flipped (smaller is better)
    const value =
      ((a.mismatchPercentile as number) ?? 0) -
      ((b.mismatchPercentile as number) ?? 0);
    return value;
  },
  createdAt: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.createdAt ?? DATE_JAN_1_1970).getTime() -
      (a.createdAt ?? DATE_JAN_1_1970).getTime();
    return value;
  },
};

export default component$(() => {
  const gameContext = useContext(GameContext);
  const isLoading = useSignal(true);

  const sortDirection = useSignal<"asc" | "desc">("desc");
  const sortColumnHistory = useSignal<string[]>([
    "deckSize",
    "timePercentile",
    "mismatchPercentile",
  ]);

  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);

  const sortScores = $((scores: ScoreWithPercentiles[]) => {
    let result = [...scores] as Array<
      ScoreWithPercentiles & { [key: string]: number | string }
    >;

    console.log("SORTING...", {
      scores,
      sortColumnHistory: sortColumnHistory.value,
      sortDirection: sortDirection.value,
    });

    result.sort((a, b) => {
      let value = 0;
      let nextKeyIndex = 0;
      // console.log({ sortColumnHistory: sortColumnHistory.value });
      while (value === 0 && nextKeyIndex < sortColumnHistory.value.length) {
        const key = sortColumnHistory.value[nextKeyIndex];
        const fn = sortFunctions[key];
        value = fn(a, b);
        // console.log({ value, key, fn });
        nextKeyIndex++;
      }
      // console.log({ value });
      return sortDirection.value === "desc" ? value : 0 - value;
    });

    console.log({ sortedResult: result });
    return result;
  });

  const handleClickColumnHeader = $(async (e: QwikMouseEvent) => {
    isLoading.value = true;
    console.log({ e });
    const clickedDataAttr = (e.target as HTMLButtonElement).dataset[
      "sortColumn"
    ] as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = mapColTitleToObjKey[clickedDataAttr];

    console.log({
      clickedDataAttr,
      clickedColumnTitle,
      mapColTitleToObjKey,
    });

    if (sortColumnHistory.value[0] === clickedColumnTitle) {
      console.log("clicked the same column, switching direction");
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      console.log("clicked different column, changing column");
      sortColumnHistory.value = [
        clickedColumnTitle,
        ...sortColumnHistory.value,
      ].slice(0, 3);
      console.log({ sortColumnHistory: sortColumnHistory.value });
      sortDirection.value = "desc";
    }

    // resort:
    sortedScores.value = await sortScores(
      gameContext.interface.scoresModal.scores
    );
    isLoading.value = false;
  });

  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    gameContext.interface.scoresModal.scores = calculatePercentiles(
      await serverDbService.getAllScores()
    );

    console.log({ scores: gameContext.interface.scoresModal.scores });

    sortedScores.value = await sortScores(
      gameContext.interface.scoresModal.scores
    );
    console.log({ sortedScores: sortedScores.value });

    isLoading.value = false;
    console.log("done loading");
  });

  useStyles$(`
  table {
    overflow: hidden;
  }

  table.scoreboard thead {
    overflow: hidden;
    border: 1px solid #222;
    background-color: #ffffff30;
    z-index: -1;
  }
  table.scoreboard tbody {
    z-index: 1;
  }

  table.scoreboard th.rotate {
    height: 6em;
    white-space: nowrap;
  }

  /* Magic Numbers.. might need tweaking */
   table.scoreboard th.rotate > div {
    width: 2em;
    transform-origin: left top;
    transform:
      translate(-0.1em, calc(4.5em - 10px))
      rotate(-45deg);
  }

  table.scoreboard th.rotate > div > button {
    /* clear regular button border */
    border: none;
    border-radius: 0;
    background: none;

    transition: all 0.1s ease-in-out;
  }
  table.scoreboard th.rotate > div > div > * {
overflow: hidden;
  }

  table.scoreboard th.rotate > div > div,
  table.scoreboard th.rotate > div > button {
    border-top: 1px solid #222;
    text-align: left;
    /* width needed to make the border stretch to the top */
    width: 9.5em;
    /* x padding does not mess with the border, yay! */
    padding: 0em 2em;

  }
  table.scoreboard th.rotate > div > * > span {
    /* for when text is not gradiant */
    color: #999;
    font-weight: extra-bold;
    pointer-events: none;
  }

  table.scoreboard {
    --gradiant-dark: #666;
    --gradiant-light: #fff;
  }

  table.scoreboard > thead.asc  {
    --gradiant-start: var(--gradiant-dark);
    --gradiant-end: var(--gradiant-light);
  }
  table.scoreboard > thead.desc  {
    --gradiant-start: var(--gradiant-light);
    --gradiant-end: var(--gradiant-dark);
  }
  table.scoreboard th.rotate > div > button:hover > span {
     background: linear-gradient(to right, var(--gradiant-start), var(--gradiant-end));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
  }

  table.scoreboard td + td {
    border-left: 1px solid #444;
  }
  table.scoreboard > tbody > tr > td > div {
    margin: auto;
    width: 90%;
    height: 90%;
    background-color: #ffffff20;
    display: flex;
    justify-content: center;
    gap: 0.1em;
    flex-direction: column;
    align-items: center;
padding: 0 0.5em;
  }

  table.scoreboard > tbody > tr:first-child() {
    width: ${PIXEL_AVATAR_SIZE}px;
    min-width: ${PIXEL_AVATAR_SIZE}px;
    max-width: ${PIXEL_AVATAR_SIZE}px;
  }

  table.scoreboard {
/*     width: 100%; */
    min-width: max-content;
  }
  `);

  const headersList = [
    "Avatar",
    "Initials",
    "Deck Size",
    "Pairs",
    "Game Time",
    "Mismatches",
    "Date",
  ];

  return (
    <Modal
      isShowing={gameContext.interface.scoresModal.isShowing}
      hideModal$={() => {
        gameContext.interface.scoresModal.isShowing = false;
      }}
      title="Scoreboard"
    >
      <table class="scoreboard w-full max-w-[25rem] max-h-[90vh]">
        <thead class={`${sortDirection.value} text-xs sm:text-sm md:text-md`}>
          <tr>
            {headersList.map((header) => {
              const hyphenated = header.toLowerCase().replace(" ", "-");
              return (
                <ScoreTableHeader
                  key={hyphenated}
                  title={header}
                  hyphenated={hyphenated}
                  onClick$={
                    header === "Avatar" ? undefined : handleClickColumnHeader
                  }
//classes={ header === "Avatar" ? `w-[${PIXEL_AVATAR_SIZE}px]` : ""}
                  width={PIXEL_AVATAR_SIZE}
                ></ScoreTableHeader>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedScores.value.map((score) => (
            <ScoreRow key={score.userId} score={score}></ScoreRow>
          ))}
        </tbody>
      </table>
    </Modal>
  );
});

const ScoreTableHeader = component$(
  ({
    title,
    hyphenated,
    onClick$,
    classes = "",
    width,
  }: {
    title: string;
    hyphenated: string;
    onClick$?: PropFunction<(e: QwikMouseEvent) => void>;
    classes?: string;
    width?: number;
  }) => {
    return (
      <th
        style={{
          width: width ? `${width}px` : "auto",
          maxWidth: width ? `${width}px` : "auto",
        }}
        class={`rotate ${classes}`}
      >
        <div>
          {onClick$ ? (
            <button onClick$={onClick$} data-sort-column={hyphenated}>
              <span>{title}</span>
            </button>
          ) : (
            <div>
              <span>{title}</span>
            </div>
          )}
        </div>
      </th>
    );
  }
);

const calculatePercentiles = (scores: Score[]) => {
  const dictionary = generateDictionaryDeckSizes(scores);
  // console.log({ dictionary });
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i] as ScoreWithPercentiles;
    const matchingScores = dictionary[String(score.deckSize)];
    // console.log({ score, matchingScores });

    score.timePercentile = calculateTimePercentile(score, matchingScores);
    score.mismatchPercentile = calculateMismatchPercentile(
      score,
      matchingScores
    );
  }
  // console.log("~~ SHOULD BE MODIFIED WITH PERCENTILES:", { scores });
  return scores;
};

const generateDictionaryDeckSizes = (scores: Score[]) => {
  const dictionary: { [key: string]: Score[] } = {};
  const deckSizes = new Set(scores.map((s) => s.deckSize));
  // console.log(Array.from(deckSizes));

  for (let i = 6; i <= 52; i += 2) {
    if (!deckSizes.has(i)) continue;
    const matchingScores = scores.filter((s) => s.deckSize === i);
    // console.log({ i, matchingScores });
    dictionary[String(i)] = matchingScores;
  }

  return dictionary;
};

const calculateTimePercentile = (
  score: Score,
  allScoresMatchingDeckSize: Score[]
) => {
  const sorted = allScoresMatchingDeckSize.sort(
    (a, b) =>
      timestampToMs(a.gameTime as string) - timestampToMs(b.gameTime as string)
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
};

const calculateMismatchPercentile = (
  score: Score,
  allScoresMatchingDeckSize: Score[]
) => {
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
};

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

const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${BG_COLOR_ALPHA})`;

const BG_COLOR_ALPHA = 0.9;

const ScoreRow = component$(({ score }: { score: ScoreWithPercentiles }) => {
  // console.log({ score });

  return (
    <tr
      class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md"
      style={{
        backgroundColor: generateBgAlpha(score.color as string),
      }}
    >
      <td
        class="flex justify-center"
        style={{ width: `${PIXEL_AVATAR_SIZE}px` }}
      >
        <PixelAvatar
          color={score.color as string}
          pixels={score.pixels as string}
          width={PIXEL_AVATAR_SIZE}
          height={PIXEL_AVATAR_SIZE}
          classes="border border-gray-100"
        />
      </td>
      <td>
        <div>{score.initials}</div>
      </td>
      <td>
        <div>{score.deckSize}</div>
      </td>
      <td>
        <div>{score.pairs}</div>
      </td>
      <td>
        <div>
          <span class="block">{score.timePercentile}%</span>
          <span class="block">
            <GameTime gameTime={score.gameTime as string} />
          </span>
        </div>
      </td>
      <td>
        <div>
          <span class="block">{score.mismatchPercentile}%</span>
          <span class="block">{score.mismatches}</span>
        </div>
      </td>
      <td>
        <div>
          <CreatedAt createdAt={score.createdAt ?? DATE_JAN_1_1970} />
        </div>
      </td>
    </tr>
  );
});

const CreatedAt = ({ createdAt }: { createdAt: Date }) => {
  const [date, time] = createdAt.toLocaleString().split(", ");
  return (
    <>
      <span class="block">{date}</span>
      <span class="block whitespace-nowrap">{time}</span>
    </>
  );
};
