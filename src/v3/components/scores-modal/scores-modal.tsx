import {
  $,
  PropFunction,
  QwikChangeEvent,
  QwikMouseEvent,
  Slot,
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
import type {
  ScoreWithPercentiles,
  ScoreColumn,
  SortColumnWithDirection,
} from "~/v3/types/types";

const hyphenateTitle = (text: string) => text.toLowerCase().replace(" ", "-");

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

const genColHistoryFindFn = (key: ScoreColumn) => ({ column }: SortColumnWithDirection) => column === key;

type QueryStore = {
  sortByColumnHistory: SortColumnWithDirection[];
  deckSizesFilter: number[];
  pageNumber: number;
  resultsPerPage: number;
}

export default component$(() => {
  const gameContext = useContext(GameContext);
  const isLoading = useSignal(true);
  const selectValue = useSignal('default');

  const queryStore = useStore<QueryStore>(
    {
      sortByColumnHistory: DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.slice(
        0,
        MAX_SORT_COLUMN_HISTORY
      ),
      deckSizesFilter: [gameContext.settings.deck.size],
      pageNumber: 1,
      resultsPerPage: 50,
    },
    { deep: true }
  );

  const deckSizeList = useSignal<number[]>([]);

  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);
  const queryScores = $(
    async () => {
      isLoading.value = true;
      const query = {
        pageNumber: queryStore.pageNumber,
        resultsPerPage: queryStore.resultsPerPage,
        deckSizesFilter: queryStore.deckSizesFilter.length === 0 ? [gameContext.settings.deck.size] : queryStore.deckSizesFilter,
        sortByColumnHistory: queryStore.sortByColumnHistory
      };

      const { scores } = await serverDbService.scores.queryWithPercentiles(query);
      sortedScores.value = scores;

      isLoading.value = false;
    }
  );

  const handleClickColumnHeader = $(async (e: QwikMouseEvent) => {
    isLoading.value = true;
    const clickedDataAttr = (e.target as HTMLButtonElement).dataset[
      "sortColumn"
    ] as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = MAP_COL_TITLE_TO_OBJ_KEY[clickedDataAttr];

    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    if (currentSortByColumn.column === clickedColumnTitle) {
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

    queryScores();
  });

  /* 
  * fetches deck sizes and scores when showing modal
  * */
  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    isLoading.value = true;
    try {
      const scoreCounts = await serverDbService.scoreCounts.getAll()
      console.log(scoreCounts);

      // fetch the list of all deckSizes we have scores of
      const list = scoreCounts.map(sc => sc.deckSize as number);

      // set to show all deckSizes by default
      deckSizeList.value = list;
      queryStore.deckSizesFilter = list;

      await queryScores();
    } catch (err) {
      console.error(err);

    } finally {
      isLoading.value = false;
    }
  });

  const onChangeSelect = $(
    (e: QwikChangeEvent) => {
      console.log('select changed');

      const selectedDeckSize = Number((e.target as HTMLSelectElement).value)
      console.log({ selectedDeckSize });

      if (isNaN(selectedDeckSize)) return;

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

      selectValue.value = 'default';
      (e.target as HTMLSelectElement).value = 'default';

      queryScores();
    }
  );

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
        <select
          class="bg-slate-800"
          value={selectValue.value}
          onChange$={onChangeSelect}>
          <option value="default">{queryStore.deckSizesFilter.join(', ')}</option>
          {deckSizeList.value.map((deckSize) => (
            <option key={deckSize} value={deckSize} class="bg-slate-800">
              {String(deckSize)}
            </option>
          ))}
        </select>
        <table
          class="scoreboard w-full  max-h-[90vh]"
        >
          <thead class={` text-xs sm:text-sm md:text-md bg-slate-500`}>
            <tr>
              {headersList.map((header) => {
                const findFn = genColHistoryFindFn(MAP_COL_TITLE_TO_OBJ_KEY[header]);
                const classes = queryStore.sortByColumnHistory.find(
                  findFn
                )?.direction ??
                  (
                    DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(
                      findFn
                    )?.direction ??
                    "desc"
                  );
                const hyphenated = hyphenateTitle(header);
                return (
                  <ScoreTableHeader
                    classes={classes}
                    key={hyphenated}
                    hyphenated={hyphenated}
                    onClick$={
                      header === "Avatar"
                        ? undefined
                        : handleClickColumnHeader
                    }
                  >
                    <span>{header}</span>
                  </ScoreTableHeader>
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
      </div>
    </Modal>
  );
});

const ScoreTableHeader = component$(
  ({
    classes = '',
    hyphenated,
    onClick$,
  }: {
    classes?: string,
    hyphenated: string;
    onClick$?: PropFunction<(e: QwikMouseEvent) => void>;
  }) => {
    return (
      <th class={`rotate ${classes}`}>
        <div>
          {onClick$ ? (
            <button onClick$={onClick$} data-sort-column={hyphenated}>
              <Slot />
            </button>
          ) : (
            <div>
              <Slot />
            </div>
          )}
        </div>
      </th>
    );
  }
);

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
