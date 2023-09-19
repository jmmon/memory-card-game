import {
  $,
  PropFunction,
  QwikChangeEvent,
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
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";
import { truncateMs } from "~/v3/utils/formatTime";
// import Tabulation from "../tabulation//tabulation";
import type {
  ScoreWithPercentiles,
  ScoreColumn,
  SortColumnWithDirection,
} from "~/v3/types/types";

const hyphenateTitle = (text: string) => text.toLowerCase().replace(" ", "-");
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

export const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z";
export const DATE_JAN_1_1970 = new Date(JAN_1_1970_STRING);

const PIXEL_AVATAR_SIZE = 44;

const MAP_COL_TITLE_TO_OBJ_KEY: { [key: string]: ScoreColumn } = {
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


const MAX_SORT_COLUMN_HISTORY = 2;
// const DEFAULT_SORT_BY_COLUMN_HISTORY = [
//   "deckSize",
//   "timePercentile",
//   "mismatchPercentile",
// ];
// const DEFAULT_SORT_DIRECTION: SortDirection = "desc";

type QueryStore = {
  sortByColumnHistory: SortColumnWithDirection[];
  deckSizesFilter: number[];
  pageNumber: number;
  resultsPerPage: number;
  totalResults: number;
  totalPages: number;
};

export default component$(() => {
  const gameContext = useContext(GameContext);
  const isLoading = useSignal(true);
  const selectValue = useSignal('default');

  const queryStore = useStore<QueryStore>({
    sortByColumnHistory: DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.slice(
      0,
      MAX_SORT_COLUMN_HISTORY
    ),
    deckSizesFilter: [gameContext.settings.deck.size], // default to our deck.size
    pageNumber: 1,
    resultsPerPage: 10,
    totalResults: 0,
    totalPages: 0,
  },
    { deep: true }
  );

  useTask$(({ track }) => {
    track(() => gameContext.settings.deck.size)
    queryStore.deckSizesFilter = [gameContext.settings.deck.size];
  });

  // map deck sizes to fetched scores -- needed after improvement??
  // const getDeckBySizeSignal = useSignal<DeckSizesDictionary>({});
  const deckSizeList = useSignal<number[]>([]);

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
  const scoreTotals = useSignal<{
    [key: number]: number;
    all: number;
  }>({
    all: 0,
  });

  const queryAndSaveScores = $(
    async () => {
      isLoading.value = true;

      // console.log('started querying scores', {
      //   pageNumber: queryStore.pageNumber,
      //   resultsPerPage: queryStore.resultsPerPage,
      //   deckSizesFilter: queryStore.deckSizesFilter.length === 0
      //     ? [gameContext.settings.deck.size]
      //     : queryStore.deckSizesFilter,
      //   sortByColumnHistory: queryStore.sortByColumnHistory
      // });
      //
      const scoresPromise = serverDbService.scores.queryWithPercentiles({
        pageNumber: queryStore.pageNumber,
        resultsPerPage: queryStore.resultsPerPage,
        deckSizesFilter: queryStore.deckSizesFilter.length === 0
          ? [gameContext.settings.deck.size]
          : queryStore.deckSizesFilter,
        sortByColumnHistory: queryStore.sortByColumnHistory
      });

      const scoreCountsPromise = serverDbService.scoreCounts.getDeckSizes()

      const [scoresRes, scoreCounts] = await Promise.all([
        scoresPromise,
        scoreCountsPromise
      ])

      const { scores, totals } = scoresRes
      deckSizeList.value = scoreCounts;
      const totalCount = Object.values(totals)
        .reduce((accum, cur) => accum += cur, 0)

      console.log({ totalCount, scores, deckSizeList: deckSizeList.value });

      scoreTotals.value = {
        ...totals,
        all: totalCount
      };

      queryStore.totalPages = Math.ceil(
        totalCount / queryStore.resultsPerPage
      );

      sortedScores.value = [...scores];

      console.log('finished querying scores');
      return { scores }
    }
  );


  const handleClickColumnHeader = $(async (e: QwikMouseEvent) => {
    isLoading.value = true;
    // console.log({ e });
    const clickedDataAttr = (e.target as HTMLButtonElement).dataset[
      "sortColumn"
    ] as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = MAP_COL_TITLE_TO_OBJ_KEY[clickedDataAttr];

    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    if (currentSortByColumn.column === clickedColumnTitle) {
      // same column
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
    queryAndSaveScores();
  });


  const onChangeResultsPerPage$ = $((e: QwikChangeEvent) => {
    const selectedResultsPerPage = Number((e.target as HTMLSelectElement).value)
    console.log({ selectedDeckSize: selectedResultsPerPage });

    // handle top option to toggle all
    if (!isNaN(selectedResultsPerPage)) {
      queryStore.resultsPerPage = selectedResultsPerPage;
      // re-select the top because it shows everything
      selectValue.value = 'default';
      (e.target as HTMLSelectElement).value = 'default';
      queryAndSaveScores();
    }
  });


  const onChangeSelect = $(
    (e: QwikChangeEvent) => {
      console.log('select changed');

      const selectedDeckSize = Number((e.target as HTMLSelectElement).value)
      console.log({ selectedDeckSize });

      // handle top option to toggle all
      if (selectedDeckSize === -1) {
        const midway = deckSizeList.value.length / 2;

        // if we have fewer than midway selected, we select all. Else, we select our own deckSize
        if (queryStore.deckSizesFilter.length <= midway) {
          queryStore.deckSizesFilter = [...deckSizeList.value];
        } else {
          queryStore.deckSizesFilter = [gameContext.settings.deck.size];
        }

      } else {
        const indexIfExists = queryStore.deckSizesFilter.indexOf(selectedDeckSize);

        if (indexIfExists !== -1) {
          queryStore.deckSizesFilter = queryStore.deckSizesFilter.filter(
            (size) => size !== selectedDeckSize
          )
          console.log('~~ existed');
        } else {
          queryStore.deckSizesFilter = [...queryStore.deckSizesFilter, selectedDeckSize];
          console.log('~~ NOT existed');
        }
      }

      // re-select the top because it shows everything
      selectValue.value = 'default';
      (e.target as HTMLSelectElement).value = 'default';

      queryAndSaveScores();
    }
  );

  /* 
  * onMount, onShow modal
  * */
  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    isLoading.value = true;

    await queryAndSaveScores(),

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


  table.scoreboard > thead th.asc  {
    --gradiant-start: var(--gradiant-dark);
    --gradiant-end: var(--gradiant-light);
  }
  table.scoreboard > thead th.desc  {
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
  table.scoreboard tfoot {
    height: 2rem;
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
      containerClasses="flex"
    >
      <div class="flex flex-col w-min">
        {/* TODO: instead of Select + Options, use a dropdown with checkboxes 
            (could be disabled for those deckSizes we haven't seen yet) */}
        <div class="flex justify-between bg-slate-700 items-center gap-2 h-[2rem] p-1">
          <select
            class="bg-slate-800 flex-grow"
            value={selectValue.value}
            onChange$={onChangeSelect}
          >
            <option value="default">{queryStore.deckSizesFilter.join(', ')}</option>
            <option value={-1}>Toggle All</option>
            {deckSizeList.value.map((deckSize) => (
              <option key={deckSize} value={deckSize} class="bg-slate-800">
                {String(deckSize)}
              </option>
            ))}
          </select>
          <SelectEl
            value={queryStore.resultsPerPage}
            onChange$={onChangeResultsPerPage$}
            listOfOptions={Array(10).fill(null).map((_, i) => (i + 1) * 5)}
          />
        </div>

        <div class="w-full h-full overflow-y-auto"
          style={{ maxHeight: `calc(70vh - 5rem)` }}
        >
          <table
            q: slot="scoreboard-tab0"
            class="scoreboard w-full "
          >
            <thead class={` text-xs sm:text-sm md:text-md bg-slate-500`}>
              <tr>
                {headersList.map((header) => {
                  const hyphenated = hyphenateTitle(header);
                  const key = MAP_COL_TITLE_TO_OBJ_KEY[header];
                  const findFn = ({ column }: SortColumnWithDirection) => column === key;
                  const classes = queryStore.sortByColumnHistory.find(
                    findFn
                  )?.direction ??
                    (
                      DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(
                        findFn
                      )?.direction ??
                      "desc"
                    )
                  return (
                    <ScoreTableHeader
                      key={hyphenated}
                      title={header}
                      hyphenated={hyphenated}
                      classes={classes}
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
                <ScoreRow key={score.id} score={score} />
              ))}
            </tbody>
          </table>
        </div>
        <TablePagingFooter
          queryStore={queryStore}
          queryScores={queryAndSaveScores}
        />
      </div>
    </Modal>
  );
});

const SelectEl = component$(({
  value,
  onChange$,
  listOfOptions,
}: {
  value: number;
  onChange$: PropFunction<(e: QwikChangeEvent) => void>;
  listOfOptions: Array<number>;
}) => {
  return (
    <select
      class="bg-slate-800"
      value={value}
      onChange$={onChange$}
    >
      <option value="default">{String(value)}</option>
      {listOfOptions.map((num) => (
        <option key={num} value={num} class="bg-slate-800">
          {String(num)}
        </option>
      ))}
    </select>
  );
});

const TablePagingFooter = component$(({
  queryStore,
  queryScores,
}: {
  queryStore: QueryStore;
  queryScores: PropFunction<() => any>;
}) => {
  const buttons = useStore({
    first: true,
    prev: true,
    next: true,
    last: true,
    maxPageButtons: 7,
    prevPage: queryStore.pageNumber,
  })

  const remainingPageButtonSlots = useSignal(buttons.maxPageButtons);
  const remainingPageButtons = useSignal<number[]>([]);

  const calculateRemainingPageButtons = $(() => {
    const currentIndex = queryStore.pageNumber - 1; // 0-based page number

    // const half = ((buttons.prevPage < queryStore.pageNumber)
    //   ? Math.floor(remainingPageButtonSlots.value / 2)
    //   : Math.ceil(remainingPageButtonSlots.value / 2)) - 1

    const half =
      Math.round(remainingPageButtonSlots.value / 2)
    // const bonus = (queryStore.pageNumber > buttons.prevPage) ? 1 : queryStore.pageNumber < buttons.prevPage ? -1 : 0;
    const bonus = 0;

    // const start = pages.slice(Math.max(1, currentIndex - (half)), currentIndex)
    // const end = pages.slice(currentIndex, Math.min(pages.length, currentIndex + (half)))
    // const total = start.concat(end);
    const startIndex = Math.max(0, currentIndex - half - (bonus));
    const endIndex = Math.min(queryStore.totalPages, currentIndex + half - (bonus));

    return Array(endIndex - startIndex).fill(0).map((_, i) => startIndex + i + 1);
  });

  useTask$(async ({ track }) => {
    track(() => [queryStore.pageNumber, queryStore.totalPages, queryStore.totalResults]);

    if (queryStore.pageNumber > 1) {
      buttons.first = true;
      buttons.prev = true;
    } else {
      buttons.first = false;
      buttons.prev = false;
    }

    if (queryStore.pageNumber < queryStore.totalPages) {
      buttons.last = true;
      buttons.next = true;
    } else {
      buttons.last = false;
      buttons.next = false;
    }

    remainingPageButtonSlots.value = buttons.maxPageButtons - Object.values(
      buttons
    ).filter((v) => v === true).length;

    remainingPageButtons.value = await calculateRemainingPageButtons();
  })

  const onClick$ = $(
    (e: QwikMouseEvent) => {
      const label = (e.target as HTMLButtonElement).dataset['label']?.split('-') ?? [0, 0];
      let pageNumber = queryStore.pageNumber;
      pageNumber = (
        label[0] === 'page' ? Number(label[2]) :
          label[0] === 'first' ? 1
            : label[0] === 'previous' ? (pageNumber - 1 < 1 ? 1 : pageNumber - 1)
              : label[0] === 'next' ? (pageNumber + 1 > queryStore.totalPages ? queryStore.totalPages : pageNumber + 1)
                : label[0] === 'last' ? queryStore.totalPages : queryStore.pageNumber
      );
      console.log('clicked page number button:', { label, pageNumber });
      buttons.prevPage = queryStore.pageNumber;
      queryStore.pageNumber = pageNumber;

      queryScores();
    }
  )
  const baseButtonStyles = 'bg-slate-100 text-slate-800 p-1 inline';
  return (
    <div class="flex flex-col h-[3rem]">
      <div
        class="flex justify-between w-max gap-2 mx-auto h-full p-1 flex-grow-0"
        onClick$={onClick$}
      >
        {buttons.first && <button class={baseButtonStyles} data-label="first-page">{"<<"}</button>}
        {buttons.prev && <button class={baseButtonStyles} data-label="previous-page">{"<"}</button>}

        {remainingPageButtons.value.map((number) => (
          <button
            class={`${baseButtonStyles} ${number === queryStore.pageNumber ? 'bg-slate-500 text-slate-600' : ''}`}
            data-label={`page-number-${number}`}
            disabled={number === queryStore.pageNumber}
          >
            {number}
          </button>
        ))}

        {buttons.next && <button class={baseButtonStyles} data-label="next-page">{">"}</button>}
        {buttons.last && <button class={baseButtonStyles} data-label="last-page">{">>"}</button>}
      </div>
      <div class="flex-grow">
        Total Pages: {queryStore.totalPages}
      </div>

    </div>
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



const TIME_LABEL_COLOR = "text-slate-400/90";
// const GameTime = component$(({ gameTime }: { gameTime: string }) => {
//   console.log('gameTime component:', { gameTime });
//   const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
//   const haveHours = hours !== 0;
//   const haveMinutes = minutes !== 0;
//   // pad seconds so we can get full 3 digit milliseconds
//   const [truncSeconds, ms] = String(seconds.toFixed(3)).split(".");
//   const limitedMs = truncateMs(Number(ms ?? 0), 1);
//
//   return (
//     <>
//       {haveHours ? (
//         <>
//           <span>{hours}</span>
//           <span class={TIME_LABEL_COLOR}>h</span>
//         </>
//       ) : (
//         ""
//       )}
//
//       {haveMinutes ? (
//         <>
//           {haveHours ? (
//             <span class="ml-1">{String(minutes).padStart(2, "0")}</span>
//           ) : (
//             <span>{minutes}</span>
//           )}
//           <span class={TIME_LABEL_COLOR}>m</span>
//         </>
//       ) : (
//         ""
//       )}
//
//       <>
//         {haveMinutes ? (
//           <span class="ml-1">{truncSeconds.padStart(2, "0")}</span>
//         ) : (
//           <span>{Number(truncSeconds)}</span>
//         )}
//         <span class={`text-xs ${TIME_LABEL_COLOR}`}>
//           {Number(limitedMs) > 0 ? limitedMs : ''}s
//         </span>
//       </>
//     </>
//   );
// });
const GameTime = component$(({ gameTime }: { gameTime: string }) => {
  console.log('gameTime component:', { gameTime });
  const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  const haveMinutes = minutes !== 0;
  // pad seconds so we can get full 3 digit milliseconds
  const [truncSeconds, ms] = String(seconds.toFixed(3)).split(".");
  const limitedMs = truncateMs(Number(ms ?? 0), 1);

  return (
    <>
      <span class={haveHours ? '' : `text-xs ${TIME_LABEL_COLOR}`}>{String(hours).padStart(2, "0")}</span>
      <span class={`${haveHours ? '' : 'text-xs'} mx-[1px] ${TIME_LABEL_COLOR}`}>:</span>
      <span class={haveMinutes ? '' : `text-xs ${TIME_LABEL_COLOR}`}>{String(minutes).padStart(2, "0")}</span>
      <span class={`${haveMinutes ? '' : 'text-xs'} mx-[1px] ${TIME_LABEL_COLOR}`}>:</span>
      <span>{String(truncSeconds).padStart(2, "0")}</span>
      {
        (Number(limitedMs) > 0) ? (<>
          <span class={`text-xs ${TIME_LABEL_COLOR}`}>{String(limitedMs)}</span>
        </>) : ''
      }
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
