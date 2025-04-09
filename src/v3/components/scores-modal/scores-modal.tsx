import type { ClassList, QRL, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useOnWindow,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import {
  SortDirectionEnum,
  type ScoreWithPercentiles,
  type SortColumnWithDirection,
} from "~/v3/types/types";
import { server$ } from "@builder.io/qwik-city";
import { isServer } from "@builder.io/qwik/build";
import ScoreTable from "./score-table";
import {
  DEFAULT_SORT_BY_COLUMNS_MAP,
  DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY,
  MAP_COL_TITLE_TO_OBJ_KEY,
  MAX_SORT_COLUMN_HISTORY,
  PIXEL_AVATAR_SIZE,
} from "./constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import Modal from "../templates/modal/modal";
import serverDbService from "~/v3/services/db";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";

// const ChevronStyled = ({ direction }: { direction: "left" | "right" }) => (
//   <svg
//     width="1em"
//     height="1em"
//     viewBox="0 0 96 96"
//     preserveAspectRatio="xMidYMid meet"
//     fill="white"
//     style={{
//       margin: "0 -0.3em",
//       fill: "#c0c8ff",
//     }}
//     class={direction === "left" ? `rotate-[-90]` : "rotate-90"}
//   >
//     <use
//       xlink:href="#chevron-up"
//       width="1em"
//       height="1em"
//       fill="white"
//       style={{
//         margin: "0 -0.3em",
//         fill: "#c0c8ff",
//       }}
//     />
//   </svg>
// );

const ChevronStyled = ({ direction }: { direction: "left" | "right" }) => (
  <ChevronSvg
    style={{
      width: "1em",
      height: "1em",
      margin: "0 -0.3em",
      fill: "#c0c8ff",
      transform: `rotate(${direction === "left" ? "-90" : "90"}deg)`,
    }}
  />
);

export type QueryStore = {
  sortByColumnHistory: SortColumnWithDirection[];
  deckSizesFilter: number[];
  pageNumber: number;
  resultsPerPage: number;
  totalResults: number;
  totalPages: number;
};

export default component$(() => {
  const ctx = useGameContextService();
  const isLoading = useSignal(true);
  const selectValue = useSignal("default");

  const queryStore = useStore<QueryStore>(
    {
      sortByColumnHistory: DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.slice(
        0,
        MAX_SORT_COLUMN_HISTORY,
      ),
      deckSizesFilter: [ctx.state.userSettings.deck.size], // default to our deck.size
      pageNumber: 1,
      resultsPerPage: 100,
      totalResults: 1,
      totalPages: 1,
    },
    { deep: true },
  );

  useTask$(({ track }) => {
    track(() => ctx.state.userSettings.deck.size);
    queryStore.deckSizesFilter = [ctx.state.userSettings.deck.size];
  });

  const deckSizeList = useSignal<number[]>([]);
  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);
  // stores each deck size totals, and all totals
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
          ? [ctx.state.userSettings.deck.size]
          : queryStore.deckSizesFilter,
      sortByColumnHistory: queryStore.sortByColumnHistory,
    });

    // fetch all deck sizes for our dropdown
    const scoreCountsPromise = serverDbService.scoreCounts.getDeckSizes();

    const [scoresRes, scoreCounts] = await Promise.all([
      scoresPromise,
      scoreCountsPromise,
    ]);
    deckSizeList.value = scoreCounts;

    const { scores, totals } = scoresRes;
    const totalCountForQuery = Object.values(totals).reduce(
      (accum, cur) => (accum += cur),
      0,
    );

    console.log({
      totalCount: totalCountForQuery,
      scores,
      deckSizeList: deckSizeList.value,
    });

    scoreTotals.value = {
      ...totals,
      all: totalCountForQuery,
    };

    // calculate new page number we should place them on, eg match the centers
    const newTotalPages = Math.ceil(
      totalCountForQuery / queryStore.resultsPerPage,
    );
    const prevPagePercent = Math.min(
      1,
      queryStore.pageNumber / queryStore.totalPages,
    );
    const newPage =
      queryStore.pageNumber === 1
        ? 1
        : Math.ceil(prevPagePercent * newTotalPages);
    console.log("Finished querying scores:", {
      newTotalPages,
      prevPagePercent,
      newPage,
    });

    queryStore.totalPages = newTotalPages;
    queryStore.pageNumber = newPage;
    sortedScores.value = [...scores];

    return { scores };
  });

  const handleClickColumnHeader = $(async (e: MouseEvent) => {
    isLoading.value = true;
    // console.log({ e });
    const clickedDataAttr = (e.target as HTMLButtonElement).getAttribute(
      "data-sort-column",
    ) as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = MAP_COL_TITLE_TO_OBJ_KEY[clickedDataAttr];

    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    console.log({ clickedDataAttr, clickedColumnTitle, currentSortByColumn });

    if (currentSortByColumn.column === clickedColumnTitle) {
      // same column
      const newDirection =
        currentSortByColumn.direction === SortDirectionEnum.asc
          ? SortDirectionEnum.desc
          : SortDirectionEnum.asc;
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

  const onChangeResultsPerPage$ = $(async (_: Event, t: HTMLSelectElement) => {
    const selectedResultsPerPage = Number(t.value);

    const now = Date.now();

    console.log({ selectedDeckSize: selectedResultsPerPage, now });

    // handle top option to toggle all
    if (!isNaN(selectedResultsPerPage)) {
      queryStore.resultsPerPage = selectedResultsPerPage;
      // re-select the top because it shows everything
      selectValue.value = "default";
      t.value = "default";

      await queryAndSaveScores();

      const newNow = Date.now();
      console.log(`~~ done with query:`, {
        newNow,
        now,
        timeMs: newNow - now,
      });
    }
  });

  const onChangeSelect$ = $((_: Event, t: HTMLSelectElement) => {
    const selectedDeckSize = Number(t.value);
    console.log("select changed:", { selectedDeckSize });

    // handle top option to toggle all e.g. default
    if (selectedDeckSize === -1) {
      const midway = deckSizeList.value.length / 2;

      // if we have fewer than midway selected, we select all. Else, we select our own deckSize
      if (queryStore.deckSizesFilter.length <= midway) {
        queryStore.deckSizesFilter = [...deckSizeList.value];
      } else {
        queryStore.deckSizesFilter = [ctx.state.userSettings.deck.size];
      }
    } else {
      const indexIfExists =
        queryStore.deckSizesFilter.indexOf(selectedDeckSize);

      if (indexIfExists !== -1) {
        queryStore.deckSizesFilter = queryStore.deckSizesFilter.filter(
          (size) => size !== selectedDeckSize,
        );
        console.log("~~ decksize existed");
      } else {
        queryStore.deckSizesFilter = [
          ...queryStore.deckSizesFilter,
          selectedDeckSize,
        ];
        console.log("~~ decksize NOT existed");
      }
    }

    // re-select the top because it shows everything
    selectValue.value = "default";
    t.value = "default";

    queryAndSaveScores();
  });

  const size = useSignal<number>(PIXEL_AVATAR_SIZE);

  const resizePixelAvatar = $(() => {
    if (isServer) {
      return;
    }
    size.value =
      window.innerWidth <= 639
        ? Math.round(PIXEL_AVATAR_SIZE * 0.8)
        : PIXEL_AVATAR_SIZE;
  });

  /*
   * onMount, onShow modal
   * */
  useTask$(async ({ track }) => {
    const isShowing = track(
      () => ctx.state.interfaceSettings.scoresModal.isShowing,
    );
    if (!isShowing) return;

    resizePixelAvatar();

    isLoading.value = true;
    await queryAndSaveScores();
    isLoading.value = false;

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

    table.scoreboard tbody {
      background-color: #fff;
    }

    table.scoreboard tbody tr > :not(:first-child) {
      padding: 0 0.5em;
      font-weight: 600;
      text-shadow: 1px 1px 3px #000;
    }
    @media screen and max-width(640px) {
        table.scoreboard tbody tr > :nth-child(2) {
          padding: 0 0.25em;
        }
    }

    table.scoreboard thead tr > :first-child {
      width: 36px; /* size of avatar on small screens, it auto adjusts larger if needed on large screens */
    }
    table.scoreboard thead tr > :nth-child(2) {
      width: 3ch;
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
      // isShowing={true}
      isShowing={ctx.state.interfaceSettings.scoresModal.isShowing}
      hideModal$={() => {
        ctx.state.interfaceSettings.scoresModal.isShowing = false;
      }}
      title="Scoreboard"
      containerClasses="bg-opacity-[98%] shadow-2xl"
      wrapperSyles={{
        overflowY: "hidden",
      }}
      containerStyles={{
        width: "80vw",
        maxWidth: "100vw",
        minWidth: "18rem",
        display: "flex",
      }}
    >
      <div class="flex flex-col max-w-full h-[70vh]">
        {/* TODO: instead of Select + Options, use a dropdown with checkboxes 
            (could be disabled for those deckSizes we haven't seen yet) */}
        <TableDecksizeFilterHeader
          selectValue={selectValue}
          onChangeSelect$={onChangeSelect$}
          queryStore={queryStore}
          deckSizeList={deckSizeList}
        />

        <div class="w-full max-h-[calc(70vh-5.2rem)] overflow-y-auto">
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

type SelectElProps = {
  value: number;
  onChange$: QRL<(e: Event, t: HTMLSelectElement) => void>;
  listOfOptions: Array<number>;
  classes?: string;
};
const SelectEl = component$<SelectElProps>(
  ({ value, onChange$, listOfOptions, classes = "" }) => (
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
type TableDeckSizesFilterHeaderProps = {
  selectValue: Signal<string>;
  onChangeSelect$: QRL<(e: Event, t: HTMLSelectElement) => any>;
  queryStore: QueryStore;
  deckSizeList: Signal<number[]>;
};
const TableDecksizeFilterHeader = component$<TableDeckSizesFilterHeaderProps>(
  ({ selectValue, onChangeSelect$, queryStore, deckSizeList }) => {
    const deckSizesFilterString = useSignal("");
    const deckSizesSelected = useSignal<number[]>([]);
    const deckSizesUnselected = useSignal<number[]>([]);
    useTask$(({ track }) => {
      track(() => deckSizeList.value);
      track(() => queryStore.deckSizesFilter);
      deckSizesFilterString.value = queryStore.deckSizesFilter.join(",");

      deckSizeList.value.forEach((each) => {
        queryStore.deckSizesFilter.includes(each)
          ? deckSizesSelected.value.push(each)
          : deckSizesUnselected.value.push(each);
      });
      // deckSizesSelected.value = deckSizeList.value.filter((each) =>
      //   queryStore.deckSizesFilter.includes(each),
      // );
      // deckSizesUnselected.value = deckSizeList.value.filter(
      //   (each) => !queryStore.deckSizesFilter.includes(each),
      // );
    });
    const widthCutoffLength = 100;
    return (
      <div class="flex-grow-0 flex max-w-full overflow-hidden justify-between bg-slate-700 items-center gap-1 h-[2rem] p-1">
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

type TablePagingFooterProps = {
  queryStore: QueryStore;
  queryScores$: QRL<() => any>;
  onChangeResultsPerPage$: QRL<(e: Event, t: HTMLSelectElement) => any>;
};
const TablePagingFooter = component$<TablePagingFooterProps>(
  ({ queryStore, queryScores$, onChangeResultsPerPage$ }) => {
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

      buttons.first = buttons.prev = queryStore.pageNumber > 1;
      buttons.last = buttons.next =
        queryStore.pageNumber < queryStore.totalPages;

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
      switch (label[0]) {
        case "first":
          pageNumber = 1;
          break;
        case "next":
          pageNumber =
            pageNumber >= queryStore.totalPages
              ? queryStore.totalPages
              : pageNumber + 1;
          break;
        case "page":
          pageNumber = Number(label[2]);
          break;
        case "previous":
          pageNumber = pageNumber < 2 ? 1 : pageNumber - 1;
          break;
        case "last":
          pageNumber = queryStore.totalPages;
          break;
        default:
          pageNumber = queryStore.pageNumber;
      }
      // pageNumber =
      // label[0] === "page"
      //   ? Number(label[2])
      //   : label[0] === "first"
      //     ? 1
      // : label[0] === "previous"
      //   ? pageNumber - 1 < 1
      //     ? 1
      //     : pageNumber - 1
      // : label[0] === "next"
      //   ? pageNumber + 1 > queryStore.totalPages
      //     ? queryStore.totalPages
      //     : pageNumber + 1
      // : label[0] === "last"
      //   ? queryStore.totalPages
      //   : queryStore.pageNumber;
      console.log("clicked page number button:", { label, pageNumber });
      buttons.prevPage = queryStore.pageNumber;
      queryStore.pageNumber = pageNumber;

      queryScores$();
    });

    const baseButtonClasses: ClassList =
      "bg-slate-800 text-slate-100 p-1 inline";

    return (
      <div class="flex-grow-0 flex flex-col h-[3.2rem]">
        <div
          class={` grid  w-full p-1 flex-grow-0 `}
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
            <button
              disabled={!buttons.first}
              class={`${baseButtonClasses} flex items-center justify-center`}
              data-label="first-page"
            >
              <ChevronStyled direction="left" />
              <ChevronStyled direction="left" />
            </button>
            <button
              disabled={!buttons.prev}
              class={baseButtonClasses}
              data-label="previous-page"
            >
              <ChevronStyled direction="left" />
            </button>

            {remainingPageButtons.value.map((number) => (
              <button
                key={number}
                class={`${baseButtonClasses} ${
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

            <button
              disabled={!buttons.next}
              class={baseButtonClasses}
              data-label="next-page"
            >
              <ChevronStyled direction="right" />
            </button>
            <button
              disabled={!buttons.last}
              class={`${baseButtonClasses} flex`}
              data-label="last-page"
            >
              <ChevronStyled direction="right" />
              <ChevronStyled direction="right" />
            </button>
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
