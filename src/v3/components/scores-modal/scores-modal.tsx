import type { PropFunction, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import serverDbService from "~/v3/services/db.service";
import type {
  ScoreWithPercentiles,
  ScoreColumn,
  SortColumnWithDirection,
} from "~/v3/types/types";
import { server$ } from "@builder.io/qwik-city";
import { isServer } from "@builder.io/qwik/build";
import ScoreTable from "./score-table";

export const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z";
export const DATE_JAN_1_1970 = new Date(JAN_1_1970_STRING);

const PIXEL_AVATAR_SIZE = 44;

export const HEADER_LIST = [
  "Avatar",
  "Initials",
  "Deck Size",
  "Pairs",
  "Game Time",
  "Mismatches",
  "Date",
];

export const MAP_COL_TITLE_TO_OBJ_KEY: { [key: string]: ScoreColumn } = {
  initials: "initials",
  "deck-size": "deck_size",
  pairs: "pairs",
  "game-time": "game_time_ds",
  mismatches: "mismatches",
  // "game-time": "timePercentile",
  // mismatches: "mismatchPercentile",
  date: "created_at",
};

const DEFAULT_SORT_BY_COLUMNS_MAP: {
  [key: string]: SortColumnWithDirection;
} = {
  deckSize: {
    column: "deck_size",
    direction: "desc",
  },
  // timePercentile: {
  //   column: "timePercentile",
  //   direction: "desc",
  // },
  // mismatchPercentile: {
  //   column: "mismatchPercentile",
  //   direction: "desc",
  // },
  gameTime: {
    column: "game_time_ds",
    direction: "asc",
  },
  mismatches: {
    column: "mismatches",
    direction: "asc",
  },
  createdAt: {
    column: "created_at",
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

export const DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY = Object.values(
  DEFAULT_SORT_BY_COLUMNS_MAP,
);

const MAX_SORT_COLUMN_HISTORY = 2;

export type QueryStore = {
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
  const selectValue = useSignal("default");

  const queryStore = useStore<QueryStore>(
    {
      sortByColumnHistory: DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.slice(
        0,
        MAX_SORT_COLUMN_HISTORY,
      ),
      deckSizesFilter: [gameContext.settings.deck.size], // default to our deck.size
      pageNumber: 1,
      resultsPerPage: 100,
      totalResults: 1,
      totalPages: 1,
    },
    { deep: true },
  );

  useTask$(({ track }) => {
    track(() => gameContext.settings.deck.size);
    queryStore.deckSizesFilter = [gameContext.settings.deck.size];
  });

  const deckSizeList = useSignal<number[]>([]);
  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);
  const scoreTotals = useSignal<{
    [key: number]: number;
    all: number;
  }>({
    all: 0,
  });

  const queryAndSaveScores = $(async () => {
    const isScoresDisabled = await server$(() => {
      return process.env.FEATURE_FLAG_SCORES_DISABLED === "true";
    })();
    if (isScoresDisabled) {
      console.log("FEATURE_FLAG: Scores DISABLED");
      return { scores: [] };
    }
    isLoading.value = true;

    console.log({ queryStore });
    const scoresPromise = serverDbService.scores.queryWithPercentiles({
      pageNumber: queryStore.pageNumber,
      resultsPerPage: queryStore.resultsPerPage,
      deckSizesFilter:
        queryStore.deckSizesFilter.length === 0
          ? [gameContext.settings.deck.size]
          : queryStore.deckSizesFilter,
      sortByColumnHistory: queryStore.sortByColumnHistory,
    });

    // fetch all deck sizes for our dropdown
    const scoreCountsPromise = serverDbService.scoreCounts.getDeckSizes();

    const [scoresRes, scoreCounts] = await Promise.all([
      scoresPromise,
      scoreCountsPromise,
    ]);

    const { scores, totals } = scoresRes;

    deckSizeList.value = scoreCounts;

    const totalCount = Object.values(totals).reduce(
      (accum, cur) => (accum += cur),
      0,
    );

    console.log({ totalCount, scores, deckSizeList: deckSizeList.value });

    scoreTotals.value = {
      ...totals,
      all: totalCount,
    };

    // calculate new page number we should place them on, eg match the centers
    const newTotalPages = Math.ceil(totalCount / queryStore.resultsPerPage);
    console.log({ newTotalPages });
    const prevPagePercent =
      queryStore.pageNumber / queryStore.totalPages > 1
        ? 1
        : queryStore.pageNumber / queryStore.totalPages;
    console.log({ prevPagePercent });
    const newPage =
      queryStore.pageNumber === 1
        ? 1
        : Math.ceil(prevPagePercent * newTotalPages);
    console.log({ newPage });
    queryStore.totalPages = newTotalPages;
    queryStore.pageNumber = newPage;

    sortedScores.value = [...scores];

    console.log("finished querying scores");
    return { scores };
  });

  const handleClickColumnHeader = $(async (e: MouseEvent) => {
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

  const onChangeResultsPerPage$ = $(async (e: Event) => {
    const selectedResultsPerPage = Number(
      (e.target as HTMLSelectElement).value,
    );

    const now = Date.now();

    console.log({ selectedDeckSize: selectedResultsPerPage, now });

    // handle top option to toggle all
    if (!isNaN(selectedResultsPerPage)) {
      queryStore.resultsPerPage = selectedResultsPerPage;
      // re-select the top because it shows everything
      selectValue.value = "default";
      (e.target as HTMLSelectElement).value = "default";

      await queryAndSaveScores();

      const newNow = Date.now();
      console.log(`~~ done with query:`, {
        newNow,
        now,
        timeMs: newNow - now,
      });
    }
  });

  const onChangeSelect$ = $((e: Event) => {
    console.log("select changed");

    const selectedDeckSize = Number((e.target as HTMLSelectElement).value);
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
      const indexIfExists =
        queryStore.deckSizesFilter.indexOf(selectedDeckSize);

      if (indexIfExists !== -1) {
        queryStore.deckSizesFilter = queryStore.deckSizesFilter.filter(
          (size) => size !== selectedDeckSize,
        );
        console.log("~~ existed");
      } else {
        queryStore.deckSizesFilter = [
          ...queryStore.deckSizesFilter,
          selectedDeckSize,
        ];
        console.log("~~ NOT existed");
      }
    }

    // re-select the top because it shows everything
    selectValue.value = "default";
    (e.target as HTMLSelectElement).value = "default";

    queryAndSaveScores();
  });

  const size = useSignal(PIXEL_AVATAR_SIZE);

  const resizePixelAvatar = $(() => {
    if (!isServer) {
      size.value =
        window.innerWidth > 639
          ? PIXEL_AVATAR_SIZE
          : Math.round(PIXEL_AVATAR_SIZE * 0.8);
      return;
    }
    size.value = PIXEL_AVATAR_SIZE;
  });

  /*
   * onMount, onShow modal
   * */
  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    resizePixelAvatar();

    isLoading.value = true;

    await queryAndSaveScores(), (isLoading.value = false);
    console.log("done loading");
  });

  const windowSignal = useSignal<
    Partial<typeof window> & { innerWidth: number; innerHeight: number }
  >({
    innerWidth: 500,
    innerHeight: 400,
  });

  const resizeHandler = $(() => {
    resizePixelAvatar();
    windowSignal.value = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });

  useOnWindow("resize", resizeHandler);

  useStyles$(`
  table {
    position: relative;
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


  table.scoreboard thead .asc  {
    --gradiant-start: var(--gradiant-dark);
    --gradiant-end: var(--gradiant-light);
  }
  table.scoreboard thead .desc  {
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

  table.scoreboard tbody tr, 
  table.scoreboard tbody tr .pixel-avatar {
    transition: all 0.1s ease-in-out;
  }
  `);

  return (
    <Modal
      isShowing={gameContext.interface.scoresModal.isShowing}
      hideModal$={() => {
        gameContext.interface.scoresModal.isShowing = false;
      }}
      title="Scoreboard"
      containerClasses="flex w-[80vw] max-w-[100vw] min-w-[18rem]"
    >
      <div class="flex flex-col max-w-full">
        {/* TODO: instead of Select + Options, use a dropdown with checkboxes 
            (could be disabled for those deckSizes we haven't seen yet) */}
        <TableDecksizeFilterHeader
          selectValue={selectValue}
          onChangeSelect$={onChangeSelect$}
          queryStore={queryStore}
          deckSizeList={deckSizeList}
          windowSignal={windowSignal}
        />

        <div
          class="w-full h-full overflow-y-auto"
          style={{ maxHeight: `calc(70vh - 5rem)` }}
        >
          <ScoreTable
            handleClickColumnHeader$={handleClickColumnHeader}
            sortedScores={sortedScores}
            size={size}
            queryStore={queryStore}
          />
        </div>

        <TablePagingFooter
          queryStore={queryStore}
          onChangeResultsPerPage$={onChangeResultsPerPage$}
          queryScores$={queryAndSaveScores}
        />
      </div>
    </Modal>
  );
});

const SelectEl = component$(
  ({
    value,
    onChange$,
    listOfOptions,
    classes = "",
  }: {
    value: number;
    onChange$: PropFunction<(e: Event) => void>;
    listOfOptions: Array<number>;
    classes?: string;
  }) => (
    <select
      class={` bg-slate-800 ${classes}`}
      value={value}
      onChange$={onChange$}
    >
      <option value={value}>{String(value)}</option>
      {listOfOptions.map((num) => (
        <option key={num} value={num} class="bg-slate-800">
          {String(num)}
        </option>
      ))}
    </select>
  ),
);

const DECK_SIZES_WIDTH = "3em";
const TableDecksizeFilterHeader = component$(
  ({
    selectValue,
    onChangeSelect$,
    queryStore,
    deckSizeList,
    // windowSignal,
  }: {
    selectValue: Signal<string>;
    onChangeSelect$: PropFunction<(e: Event) => void>;
    queryStore: QueryStore;
    deckSizeList: Signal<number[]>;
    windowSignal: Signal<
      Partial<typeof window> & { innerWidth: number; innerHeight: number }
    >;
  }) => {
    const deckSizesFilterString = useComputed$(() => {
      return queryStore.deckSizesFilter.join(",");
    });
    const deckSizesSelected = useComputed$(() =>
      deckSizeList.value.filter((each) =>
        queryStore.deckSizesFilter.includes(each),
      ),
    );
    const deckSizesUnselected = useComputed$(() =>
      deckSizeList.value.filter(
        (each) => !queryStore.deckSizesFilter.includes(each),
      ),
    );
    const widthCutoffLength = 100;
    return (
      <div class="flex max-w-full overflow-hidden justify-between bg-slate-700 items-center gap-1 h-[2rem] p-1">
        <select
          class={` bg-slate-800 w-full text-xs md:text-sm lg:text-md justify-self-start `}
          value={selectValue.value}
          onChange$={onChangeSelect$}
        >
          <option value="default">
            {deckSizesFilterString.value.length > widthCutoffLength
              ? deckSizesFilterString.value.substring(
                  0,
                  widthCutoffLength - 3,
                ) + "..."
              : deckSizesFilterString.value}
          </option>
          <option value={-1}>Toggle All</option>
          {deckSizesSelected.value
            .sort((a, b) => a - b)
            .concat(deckSizesUnselected.value.sort((a, b) => a - b))
            .map((deckSize) => (
              <option
                key={deckSize}
                value={deckSize}
                class={` bg-slate-800 ${
                  queryStore.deckSizesFilter.includes(deckSize)
                    ? "text-green-400 font-extrabold"
                    : ""
                }`}
              >
                {String(deckSize)}
              </option>
            ))}
        </select>
      </div>
    );
  },
);

const TablePagingFooter = component$(
  ({
    queryStore,
    queryScores$,
    onChangeResultsPerPage$,
  }: {
    queryStore: QueryStore;
    queryScores$: PropFunction<() => any>;
    onChangeResultsPerPage$: PropFunction<(e: Event) => any>;
  }) => {
    const buttons = useStore({
      first: true,
      prev: true,
      next: true,
      last: true,
      maxPageButtons: 7,
      prevPage: queryStore.pageNumber,
    });

    const remainingPageButtonSlots = useSignal(buttons.maxPageButtons);
    const remainingPageButtons = useSignal<number[]>([]);

    const calculateRemainingPageButtons = $(() => {
      const currentPage = queryStore.pageNumber;

      const bonus = Math.floor((remainingPageButtonSlots.value - 1) / 2);

      const startPage = Math.max(1, currentPage - bonus);
      const endPage = Math.min(queryStore.totalPages, currentPage + bonus) + 1;

      return Array(endPage - startPage)
        .fill(0)
        .map((_, i) => startPage + i);
    });

    useTask$(async ({ track }) => {
      track(() => [
        queryStore.pageNumber,
        queryStore.totalPages,
        queryStore.totalResults,
      ]);

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

      remainingPageButtonSlots.value =
        buttons.maxPageButtons -
        Object.values(buttons).filter((v) => v === true).length;

      remainingPageButtons.value = await calculateRemainingPageButtons();
    });

    const onClick$ = $((e: MouseEvent) => {
      const label = (e.target as HTMLButtonElement).dataset["label"]?.split(
        "-",
      ) ?? [0, 0];
      let pageNumber = queryStore.pageNumber;
      pageNumber =
        label[0] === "page"
          ? Number(label[2])
          : label[0] === "first"
            ? 1
            : label[0] === "previous"
              ? pageNumber - 1 < 1
                ? 1
                : pageNumber - 1
              : label[0] === "next"
                ? pageNumber + 1 > queryStore.totalPages
                  ? queryStore.totalPages
                  : pageNumber + 1
                : label[0] === "last"
                  ? queryStore.totalPages
                  : queryStore.pageNumber;
      console.log("clicked page number button:", { label, pageNumber });
      buttons.prevPage = queryStore.pageNumber;
      queryStore.pageNumber = pageNumber;

      queryScores$();
    });
    const baseButtonStyles = "bg-slate-800 text-slate-100 p-1 inline";
    return (
      <div class="flex flex-col h-[3rem]">
        <div
          class={` grid  w-full h-full p-1 flex-grow-0 `}
          style={{
            gridTemplateColumns: `${DECK_SIZES_WIDTH} 1fr ${DECK_SIZES_WIDTH}`,
          }}
          onClick$={onClick$}
        >
          <SelectEl
            classes={`text-xs md:text-sm lg:text-md z-10 justify-self-start`}
            value={queryStore.resultsPerPage}
            onChange$={onChangeResultsPerPage$}
            listOfOptions={[5, 10, 25, 50, 100]}
          />
          <div class="justify-center flex gap-2 w-full">
            {buttons.first && (
              <button class={baseButtonStyles} data-label="first-page">
                {"<<"}
              </button>
            )}
            {buttons.prev && (
              <button class={baseButtonStyles} data-label="previous-page">
                {"<"}
              </button>
            )}

            {remainingPageButtons.value.map((number) => (
              <button
                key={number}
                class={`${baseButtonStyles} ${
                  number === queryStore.pageNumber
                    ? "bg-slate-500 text-slate-600"
                    : ""
                }`}
                data-label={`page-number-${number}`}
                disabled={number === queryStore.pageNumber}
              >
                {number}
              </button>
            ))}

            {buttons.next && (
              <button class={baseButtonStyles} data-label="next-page">
                {">"}
              </button>
            )}
            {buttons.last && (
              <button class={baseButtonStyles} data-label="last-page">
                {">>"}
              </button>
            )}
          </div>
          <div
            class={`w-[${DECK_SIZES_WIDTH}]`}
            data-label="empty-spacer"
          ></div>
        </div>
        <div class="flex-grow">Total Pages: {queryStore.totalPages}</div>
      </div>
    );
  },
);
