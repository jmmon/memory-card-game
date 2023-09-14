import {
  $,
  PropFunction,
  QwikMouseEvent,
  component$,
  useContext,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import { Score } from "~/v3/db/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";
import { timestampToMs, truncateMs } from "~/v3/utils/formatTime";
import Tabulation from "../tabulation//tabulation";
import { type Signal } from "@builder.io/qwik";
import {
  type ScoreWithPercentiles,
  type SortDirection,
  type DeckSizesDictionary,
  type ScoreColumn,
  type SortColumnWithDirection,
} from "~/v3/types/types";

/* TODO: set up for multiple deckSizes
 * Opt 1: have all the fetching and sorting logic in the modal, and it passes the data down to the tables.
 * - However, how do we control the sorting? Could sort it inside each table
 * - What is needed is to fetch data with particular sort settings and page settings, and return only that data
 * - filter by deckSize, sort by column/direction
 *
 * So, no tabulation? Just have a deckSize filter, could be a bunch of checkboxes, showing depending on which sizes we have scores for
 *
 * */

/*
 * How to calculate percentiles?
 * I would need all the scores for the given deckSize
 * for a given score of a given deckSize, we need to know:
 *   - total scores for those conditions
 *   - count of scores less than this score
 *
 * How?
 * - could query all scores of given deckSize, sorted by gameTime (or mismatches)
 * - then we can know the length of the total set
 * - and we can count how many land under our score
 * - that way we can calculate the percentile for this score
*
* Performance:
* Should I save some of this data in a secondaory table? scoreCounts table?
* - scoreCounts might be for a given deckSize
* - scoreCounts[size: 6] = {
*     totalScores: n, (increment when we add a new score of this deckSize)
*     lessThanOurScoreMap: {
*       [ourScore (e.g. our mismatches)]: m (count less than our score)
*       // when add a score of this deckSize, take our mismatches.
*       // For each entry where key:mismatches is GREATER THAN our mismatches,
*       //  - add 1 to each value
*     }
*   }
* e.g. we have scores for deckSize of 6:
* totalScores = 12,
* lessThanOurScoreMap: {
* 1: 0, // if our score is 1, there are 0 less than this score
* 2: 2,
* 3: 4,
* 4: 6, // if our score is 4, there are 6 scores less than this score
* 5: 9, // if our score is 5, there are 9 scores less than this score
* 6: 10,
* 8: 11, // 11 are less than a score of 8, so a score of 8 is the 12th score
* }
* 
* When adding a new score of deckSize 6: score.mismatches = 4
* totalScores = 12 + 1,
* lessThanOurScoreMap: {
*   1: 0,
*   2: 2,
*   3: 4,
*   4: 6, // -- our score
*   5: 9 + 1, // we scored 4, so we have to increment any that land ABOVE our score
*   6: 10 + 1,
*   8: 11 + 1 // now the score of 8 is the 13th score, with 12 less than it
* }
*
 * */

const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z";
const DATE_JAN_1_1970 = new Date(JAN_1_1970_STRING);

const PIXEL_AVATAR_SIZE = 44;

const mapColTitleToObjKey: { [key: string]: ScoreColumn } = {
  initials: "initials",
  "deck-size": "deckSize",
  pairs: "pairs",
  "game-time": "timePercentile",
  mismatches: "mismatchPercentile",
  date: "createdAt",
};

const DEFAULT_SORT_BY_COLUMNS_MAP: {
  [key: string]: SortColumnWithDirection;
} = {
  deckSize: {
    column: "deckSize",
    direction: "desc",
  },
  timePercentile: {
    column: "timePercentile",
    direction: "desc",
  },
  mismatchPercentile: {
    column: "mismatchPercentile",
    direction: "desc",
  },
  createdAt: {
    column: "createdAt",
    direction: "desc",
  },
  initials: {
    column: "initials",
    direction: "asc",
  },
  pairs: {
    column: "pairs",
    direction: "desc",
  },
};

const DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY = Object.values(
  DEFAULT_SORT_BY_COLUMNS_MAP
);

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
    const value =
      ((b.timePercentile as number) ?? 0) - ((a.timePercentile as number) ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      ((b.mismatchPercentile as number) ?? 0) -
      ((a.mismatchPercentile as number) ?? 0);
    return value;
  },
  createdAt: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.createdAt ?? DATE_JAN_1_1970).getTime() -
      (a.createdAt ?? DATE_JAN_1_1970).getTime();
    return value;
  },
};

// TODO: this will be built into the query??
const sortScores = (
  scores: ScoreWithPercentiles[],
  sortByColumnHistory: Array<SortColumnWithDirection>
) => {
  let result = [...scores];

  result.sort((a, b) => {
    let value = 0;
    let nextKeyIndex = 0;
    let { column, direction } = sortByColumnHistory[0];
    // console.log({ sortByColumnHistory: sortByColumnHistory.value });
    while (value === 0 && nextKeyIndex < sortByColumnHistory.length) {
      const sortingInstructions = sortByColumnHistory[nextKeyIndex];
      column = sortingInstructions.column;

      value = sortFunctions[column](a, b);
      // console.log({ value, key, fn });
      nextKeyIndex++;
    }
    // console.log({ value });
    return direction === "desc" ? value : 0 - value;
  });

  // console.log({ sortedResult: result });
  return result;
};

const MAX_SORT_COLUMN_HISTORY = 2;
// const DEFAULT_SORT_BY_COLUMN_HISTORY = [
//   "deckSize",
//   "timePercentile",
//   "mismatchPercentile",
// ];
// const DEFAULT_SORT_DIRECTION: SortDirection = "desc";

const fetchScores = async (
  pageNumber: number,
  deckSizesFilter: number[],
  sortByColumnHistory: Array<SortColumnWithDirection>
) => {
  // fetch using the db service (TODO: add the settings to the dbService)
  const fetchedScores = await serverDbService.queryScores({
    pageNumber,
    deckSizesFilter,
    sortByColumnHistory,
  });
  console.log({ fetchedScores });
  return fetchedScores as ScoreWithPercentiles[];
};

export default component$(() => {
  const gameContext = useContext(GameContext);
  const isLoading = useSignal(true);

  // TODO: NEW:
  const queryStore = useStore(
    {
      sortByColumnHistory: DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.slice(
        0,
        MAX_SORT_COLUMN_HISTORY
      ),
      deckSizesFilter: [gameContext.settings.deck.size],
      pageNumber: 1,
    },
    { deep: true }
  );

  // map deck sizes to fetched scores -- needed after improvement??
  const getDeckBySizeSignal = useSignal<DeckSizesDictionary>({});

  /*
* // array of sort-by-columns, so we can sort by a primary and secondary key
  const sortByColumnHistory = useSignal(
    DEFAULT_SORT_BY_COLUMN_HISTORY.slice(0, MAX_SORT_COLUMN_HISTORY)
  );
  // direction of the sortColumn
  const sortDirection = useSignal<SortDirection>(DEFAULT_SORT_DIRECTION);
  // array of deck sizes to show in the scores list 
 */

  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);

  const handleClickColumnHeader = $(async (e: QwikMouseEvent) => {
    isLoading.value = true;
    // console.log({ e });
    const clickedDataAttr = (e.target as HTMLButtonElement).dataset[
      "sortColumn"
    ] as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = mapColTitleToObjKey[clickedDataAttr];

    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    if (currentSortByColumn.column === clickedColumnTitle) {
      // console.log("clicked the same column, switching direction");

      const newDirection =
        currentSortByColumn.direction === "asc" ? "desc" : "asc";
      queryStore.sortByColumnHistory[0].direction = newDirection;
    } else {
      // set new column & direction
      queryStore.sortByColumnHistory = [
        DEFAULT_SORT_BY_COLUMNS_MAP[clickedColumnTitle],
        ...queryStore.sortByColumnHistory,
      ].slice(0, MAX_SORT_COLUMN_HISTORY);
    }

    // resort:
    // TODO: do a db query and pass in the parameters, rather than using our sort function
    // sortedScores.value = sortScores(
    //   gameContext.interface.scoresModal.scores,
    //   queryStore.sortByColumnHistory
    // );

    isLoading.value = true;
    sortedScores.value = await fetchScores(
      queryStore.pageNumber,
      queryStore.deckSizesFilter,
      queryStore.sortByColumnHistory
    );
    isLoading.value = false;
  });

  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    const { scores, dictionary } = calculatePercentiles(
      await fetchScores(
        queryStore.pageNumber,
        queryStore.deckSizesFilter,
        queryStore.sortByColumnHistory
      )
    );
    // const { scores, dictionary } = calculatePercentiles(
    //   await serverDbService.getAllScores()
    // );
    gameContext.interface.scoresModal.scores = scores;
    getDeckBySizeSignal.value = dictionary;

    console.log({ scores: gameContext.interface.scoresModal.scores });

    // // TODO: do a db query and pass in the parameters, rather than using our sort function
    // sortedScores.value = sortScores(
    //   gameContext.interface.scoresModal.scores,
    //  sortByColumnHistory,
    //   sortDirection
    // );
    // console.log({ sortedScores: sortedScores.value });

    isLoading.value = true;
    sortedScores.value = await fetchScores(
      queryStore.pageNumber,
      queryStore.deckSizesFilter,
      queryStore.sortByColumnHistory
    );
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

  table.scoreboard th.rotate > div > div,
  table.scoreboard th.rotate > div > button {
    border-top: 1px solid #222;
    text-align: left;
    /* width needed to make the border stretch to the top */
    width: 9.5em;
    /* x padding does not mess with the border, yay! */
    padding: 0em 2em;

  }
  table.scoreboard {
    --gradiant-dark: #aaa;
    --gradiant-light: #fff;
  }
  table.scoreboard th.rotate > div > * > span {
    /* for when text is not gradiant */
    color: var(--gradiant-dark);
    pointer-events: none;
    font-weight: 900;
    text-shadow: 1px 1px 3px #000;
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
    text-shadow: none;
  }

  table.scoreboard td + td {
    border-left: 1px solid #444;
  }

  table.scoreboard tbody tr > :not(:first-child) {
    padding: 0 0.5em;
    font-weight: 600;
    text-shadow: 1px 1px 3px #000;
  }

  table.scoreboard {
    min-width: max-content;
    background: #000;
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
      classes="flex"
    >
      <div class="flex flex-col w-min">
        <Tabulation
          setName="scoreboard"
          containerClasses=""
          handlesContainerClasses="overflow-y-clip overflow-x-scroll"
          titles={Object.keys(getDeckBySizeSignal.value).map(
            (deckSize) => deckSize
          )}
        >
          <table
            q:slot="scoreboard-tab0"
            class="scoreboard w-full  max-h-[90vh]"
          >
            <thead
              class={`${sortDirection.value} text-xs sm:text-sm md:text-md bg-slate-500`}
            >
              <tr>
                {headersList.map((header) => {
                  const hyphenated = header.toLowerCase().replace(" ", "-");
                  return (
                    <ScoreTableHeader
                      key={hyphenated}
                      title={header}
                      hyphenated={hyphenated}
                      onClick$={
                        header === "Avatar"
                          ? undefined
                          : handleClickColumnHeader
                      }
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedScores.value.map((score) => (
                <ScoreRow key={score.userId} score={score} />
              ))}
            </tbody>
          </table>
          {Object.keys(getDeckBySizeSignal.value).map(
            (_, i) =>
              i !== 0 && (
                <div q:slot={`scoreboard-tab${i}`} key={i}>
                  test
                </div>
              )
          )}
        </Tabulation>
      </div>
    </Modal>
  );
});

const ScoreTableHeader = component$(
  ({
    title,
    hyphenated,
    onClick$,
    classes = "",
  }: {
    title: string;
    hyphenated: string;
    onClick$?: PropFunction<(e: QwikMouseEvent) => void>;
    classes?: string;
  }) => {
    return (
      <th class={`rotate ${classes}`}>
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
  const dictionary = generateDeckSizesDictionary(scores);
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
  return { scores: scores as ScoreWithPercentiles[], dictionary };
};

const generateDeckSizesDictionary = (scores: Score[]) => {
  const dictionary: DeckSizesDictionary = {};
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
      timestampToMs(b.gameTime as string) - timestampToMs(a.gameTime as string)
  );
  const indexOfThisScore = sorted.findIndex((s) => s.id === score.id);

  const countBelowThisScore = indexOfThisScore;
  const percentile = (countBelowThisScore / sorted.length) * 100;

  return Math.round(percentile * 10) / 10;
};

const calculateMismatchPercentile = (
  score: Score,
  allScoresMatchingDeckSize: Score[]
) => {
  const sorted = allScoresMatchingDeckSize.sort(
    (a, b) => (b.mismatches ?? 0) - (a.mismatches ?? 0)
  );
  const indexOfThisScore = sorted.findIndex((s) => s.id === score.id);

  const countBelowThisScore = indexOfThisScore;
  const percentile = (countBelowThisScore / sorted.length) * 100;

  // inverse the mismatches percentile, so 0 is the best score
  return Math.round(percentile * 10) / 10;
};

const TIME_LABEL_COLOR = "text-slate-300";
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
          <span class={TIME_LABEL_COLOR}>h</span>
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
          <span class={TIME_LABEL_COLOR}>m</span>
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
        <span class={`text-xs ${TIME_LABEL_COLOR}`}>{limitedMs}s</span>
      </>
    </>
  );
});

const ROW_BG_COLOR_ALPHA = 0.8;
const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

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
      <td>{score.initials}</td>
      <td>{score.deckSize}</td>
      <td>{score.pairs}</td>
      <td>
        <span class="block">{score.timePercentile}%</span>
        <span class="block">
          <GameTime gameTime={score.gameTime as string} />
        </span>
      </td>
      <td>
        <span class="block">{score.mismatchPercentile}%</span>
        <span class="block">{score.mismatches}</span>
      </td>
      <td>
        <CreatedAt createdAt={score.createdAt ?? DATE_JAN_1_1970} />
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
