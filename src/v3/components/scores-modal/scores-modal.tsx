import type { ClassList, QRL, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
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
      pointerEvents: "none",
      width: "1em",
      height: "1em",
      margin: "0 -0.3em",
      fill: "#c0c8ff",
      transform: `rotate(${direction === "left" ? "-90" : "90"}deg)`,
    }}
  />
);

export const isScoresDisabled = server$(() => {
  return process.env.FEATURE_FLAG_SCORES_DISABLED === "true";
});

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

  // stores the data:
  // TODO: should I paginate it so it can save previous pages?
  // e.g. page[1]: data,
  //      page[2]: undefined | data
  //      each time it fetches, it can save that page locally
  // problems: 
  // - have to dedupe by id, so it could be a map by id
  // - would have to re-sort based on changing sorting order
  // - or e.g. just wipe data when changing column sorting
  // - > 
  // - so then the map would only help when only changing the page size, but nothing else
  // - could store all the query params as json and use that as a key
  // - > 
  // - key of query params (sortByColumnHistory, deckSizesFilter, pageNumber, resultsPerPage)
  // - value of map<id, score>
  //
  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);

  // stores the array of decksizes:
  //  or could just use the keys of ScoreTotals
  const deckSizeList = useSignal<number[]>([]);
  // stores each deck size totals, and all totals
  // what is this used for??
  const scoreTotals = useSignal<{
    [key: number]: number;
    all: number;
  }>({
    all: 0,
  });

  // should this take actual props instead of the store?
  // take query props, then it can save the store at the end after it's done
  const queryScores$ = $(async (newQueryParams: QueryStore) => {
    if (await isScoresDisabled()) {
      console.log("FEATURE_FLAG: Scores DISABLED");
      return { scores: [] };
    }
    isLoading.value = true;

    const now = Date.now();
    console.log("queryAndSaveScores timing...", { queryStore: newQueryParams });
    // const prevResultsPerPage = queryData.resultsPerPage;

    const [scoresRes, deckSizesRes] = await Promise.all([
      serverDbService.scores.queryWithPercentiles({
        pageNumber: newQueryParams.pageNumber,
        resultsPerPage: newQueryParams.resultsPerPage,
        deckSizesFilter:
          newQueryParams.deckSizesFilter.length === 0
            ? [ctx.state.userSettings.deck.size] // default just in case
            : newQueryParams.deckSizesFilter,
        sortByColumnHistory: newQueryParams.sortByColumnHistory,
      }),
      // skip this query if we are getting all deckSizes (only works if we also have data for every decksize)
      // if there's not all the sizes in our dropdown list, we will never have 24 for our value, so it will
      // continue to fetch this query, although that is not needed.
      // - Could separate this query so it's not combined with the Scores query,
      //    - the dropdown list should be separate
      newQueryParams.deckSizesFilter.length === 24
        ? []
        : serverDbService.scoreCounts.getDeckSizes(),
    ]);

    const newNow = Date.now();
    console.log(`~~ done with query:`, {
      newNow,
      now,
      timeMs: newNow - now,
    });

    const { scores, totals } = scoresRes;

    const totalCountForQuery = Object.values(totals).reduce(
      (accum, cur) => (accum += cur),
      0,
    );
    deckSizeList.value =
      newQueryParams.deckSizesFilter.length === 24
        ? Object.keys(totals).map(Number) // is this already sorted? (I think so - does it even matter)
        : deckSizesRes;

    scoreTotals.value = {
      ...totals,
      all: totalCountForQuery,
    };

    console.log({
      totalCount: totalCountForQuery,
      scores,
      deckSizeList: deckSizeList.value,
    });

    const newTotalPages = Math.ceil(
      totalCountForQuery / newQueryParams.resultsPerPage,
    );

    // TODO: only should do these calculations if the resultsPerPage has changed!
    if (newQueryParams.resultsPerPage !== queryStore.resultsPerPage) {
      // calculate new page number we should place them on, eg match the centers
      const prevPagePercent = Math.min(
        1,
        newQueryParams.pageNumber / newQueryParams.totalPages,
      );
      // ahh probably this is the issue...
      // i think this is supposed to keep you seeing the same data when switching page-sizes
      // e.g. it sets your new page to the same percentage you were at before
      // so if you were on page 50/100 at page-size of 100 you are at 50%
      // and then you switch to 25 page-size, attempt to place you at page 200/400
      const newPage =
        newQueryParams.pageNumber === 1
          ? 1
          : // : Math.ceil(prevPagePercent * newTotalPages);
            Math.floor(prevPagePercent * newTotalPages); // try math.floor instead? or just truncate it?
      console.log("Finished querying scores:", {
        newTotalPages,
        prevPagePercent,
        newPage,
      });

      // only change current page number if we changed resultsPerPage
      queryStore.pageNumber = newPage;
      queryStore.resultsPerPage = newQueryParams.resultsPerPage;
    } else {
      console.log("Finished querying scores:", {
        newTotalPages,
        newPage: newQueryParams.pageNumber,
      });
      queryStore.pageNumber = newQueryParams.pageNumber;
    }
    queryStore.sortByColumnHistory = newQueryParams.sortByColumnHistory;
    queryStore.deckSizesFilter = newQueryParams.deckSizesFilter;
    // always set new total pages, in case there's more data now
    queryStore.totalPages = newTotalPages;
    queryStore.totalResults = totalCountForQuery;

    // TODO: instead append the scores? so it keeps the previous pages?
    // then could sort here on client-side by percentiles or whatever
    // - could make a map of page: data
    // > - but then if changing page size, would mess up the cache
    // - could just store the entire list, dedup based on id
    // > - then adjusting page size can just slice from the list
    //
    sortedScores.value = [...scores];

    isLoading.value = false;
    return { scores };
  });

  const handleClickColumnHeader = $((e: MouseEvent) => {
    const clickedDataAttr = (e.target as HTMLButtonElement).getAttribute(
      "data-sort-column",
    ) as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = MAP_COL_TITLE_TO_OBJ_KEY[clickedDataAttr];

    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    console.log({ clickedDataAttr, clickedColumnTitle, currentSortByColumn });

    if (currentSortByColumn.column === clickedColumnTitle) {
      // same column so toggle direction
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
    queryScores$({
      sortByColumnHistory: queryStore.sortByColumnHistory,
      deckSizesFilter: queryStore.deckSizesFilter,
      pageNumber: queryStore.pageNumber,
      resultsPerPage: queryStore.resultsPerPage,
      totalResults: queryStore.totalResults,
      totalPages: queryStore.totalPages,
    });
  });

  const onChangeResultsPerPage$ = $((_: Event, t: HTMLSelectElement) => {
    const selectedResultsPerPage = Number(t.value);
    // queryStore.resultsPerPage = selectedResultsPerPage;

    console.log({ selectedResultsPerPage });

    queryScores$({
      sortByColumnHistory: queryStore.sortByColumnHistory,
      deckSizesFilter: queryStore.deckSizesFilter,
      pageNumber: queryStore.pageNumber,
      resultsPerPage: selectedResultsPerPage,
      totalResults: queryStore.totalResults,
      totalPages: queryStore.totalPages,
    });
  });

  const onChangeSelect$ = $((_: Event, t: HTMLSelectElement) => {
    const selectedDeckSize = Number(t.value);
    console.log("select changed:", { selectedDeckSize });

    let newDeckSizesFilter = [ctx.state.userSettings.deck.size];
    // handle top option to toggle all e.g. default
    if (selectedDeckSize === -1) {
      const midway = deckSizeList.value.length / 2;

      // if we have fewer than midway selected, we select all. Else, we select our own deckSize
      if (queryStore.deckSizesFilter.length <= midway) {
        newDeckSizesFilter = [...deckSizeList.value];
      } else {
        newDeckSizesFilter = [ctx.state.userSettings.deck.size];
      }
    } else {
      const indexIfExists =
        queryStore.deckSizesFilter.indexOf(selectedDeckSize);

      if (indexIfExists !== -1) {
        newDeckSizesFilter = queryStore.deckSizesFilter.filter(
          (size) => size !== selectedDeckSize,
        );
        console.log("~~ decksize existed");
      } else {
        newDeckSizesFilter = [...queryStore.deckSizesFilter, selectedDeckSize];
        console.log("~~ decksize NOT existed");
      }
    }

    // re-select the top because it shows everything
    selectValue.value = "default";
    t.value = "default";

    queryScores$({
      sortByColumnHistory: queryStore.sortByColumnHistory,
      deckSizesFilter: newDeckSizesFilter, // pass in temp var to be set later
      pageNumber: queryStore.pageNumber,
      resultsPerPage: queryStore.resultsPerPage,
      totalResults: queryStore.totalResults,
      totalPages: queryStore.totalPages,
    });
  });

  useTask$(({ track }) => {
    track(() => ctx.state.userSettings.deck.size);
    queryStore.deckSizesFilter = [ctx.state.userSettings.deck.size];
  });

  /*
   * onMount, onShow modal
   * */
  useTask$(async ({ track }) => {
    const isShowing = track(
      () => ctx.state.interfaceSettings.scoresModal.isShowing,
    );
    if (isServer || !isShowing) return;

    queryScores$({
      sortByColumnHistory: queryStore.sortByColumnHistory,
      deckSizesFilter: queryStore.deckSizesFilter,
      pageNumber: queryStore.pageNumber,
      resultsPerPage: queryStore.resultsPerPage,
      totalResults: queryStore.totalResults,
      totalPages: queryStore.totalPages,
    });
  });

  useStyles$(`
    table {
      position: relative;
      overflow: hidden;
      --gradiant-dark: #aaa;
      --gradiant-light: #fff;
    }

    table.scoreboard thead {
      overflow: hidden;
      border: 1px solid #444;
      position: relative;
    }
    table.scoreboard tbody {
      position: relative;
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

    table.scoreboard:not(.loading) tbody td + td {
      border-left: 1px solid #44444480;
    }

    /* table.scoreboard.loading thead tr th {
      opacity: 0;
    } */

    table.scoreboard tbody tr > :not(:first-child) {
      /* padding: 0 0.25em; */
      font-weight: 600;
      text-shadow: 1px 1px 3px #000;
    }

    table.scoreboard tbody tr, 
    table.scoreboard tbody tr .pixel-avatar {
      transition: all 100ms ease-in-out;
    }

/* 
* 752.84 total width
* avatar: 51
*
* initials: 97.72 = 12.98%
* decksize: 63.45 = 8.43%
* pairs: 63.45 = 8.43%
* gametime: 149.11 = 19.8%
* mismatches: 130.97 = 17.4%
* createdAt: 197.2 = 26.2%
*
* */
    table.scoreboard thead tr td {
      width: 8.43% /* it auto adjusts larger if needed on large screens */
    }
    table.scoreboard thead tr > :nth-child(2) {
      width: 12.98%; /* it auto adjusts larger if needed on large screens */
    }
    table.scoreboard thead tr > :nth-child(5) {
      width: 19.8%; /* it auto adjusts larger if needed on large screens */
    }
    table.scoreboard thead tr > :nth-child(6) {
      width: 17.4%; /* it auto adjusts larger if needed on large screens */
    }
    table.scoreboard thead tr > :nth-child(7) {
      width: 26.2%; /* it auto adjusts larger if needed on large screens */
    }

    table.scoreboard thead tr > :first-child {
      width: 35px; /* it auto adjusts larger if needed on large screens */
    }
    @media screen and (min-width: 640px) {
      table.scoreboard thead tr > :first-child {
        width: 43px; /* it auto adjusts larger if needed on large screens */
      }
    }
    @media screen and (min-width: 1024px) {
      table.scoreboard thead tr > :first-child {
        width: 51px; /* it auto adjusts larger if needed on large screens */
      }
    }

    .scrollbar-styles {
      scrollbar-color: #6b7280 #1f2937;
      scrollbar-width: thin;
    }
  `);

  return (
    <Modal
      // isShowing={true}
      isShowing={ctx.state.interfaceSettings.scoresModal.isShowing}
      hideModal$={ctx.handle.hideScores}
      title="Scoreboard"
      // containerClasses="w-full sm:min-w-[31rem] sm:w-[60vw] md:max-w-[50rem]"
      containerClasses="w-full sm:w-[max(640px,60vw)] sm:max-w-[max(640px,60vw)]  md:w-[80vw] md:max-w-[50rem]"
      wrapperSyles={{
        overflowY: "hidden",
      }}
    >
      <div class="grid grid-rows-[20px_1fr_42px] sm:grid-rows-[23px_1fr_49px]  lg:grid-rows-[28px_1fr_63px] max-w-full h-[70vh] ">
        {/* TODO: instead of Select + Options, use a dropdown with checkboxes 
              (could be disabled for those deckSizes we haven't seen yet) */}
        <TableDecksizeFilterHeader
          selectValue={selectValue}
          onChangeSelect$={onChangeSelect$}
          queryStore={queryStore}
          deckSizeList={deckSizeList}
        />

        <div class={`w-full ${isLoading.value ? "overflow-y-hidden" : "overflow-y-auto"} [scrollbar-gutter:stable] scrollbar-styles`}>
          <ScoreTable
            isLoading={isLoading.value}
            handleClickColumnHeader$={handleClickColumnHeader}
            sortedScores={sortedScores.value}
            queryStore={queryStore}
          />
        </div>

        <TablePagingFooter
          queryStore={queryStore}
          onChangeResultsPerPage$={onChangeResultsPerPage$}
          queryScores$={queryScores$}
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
      track(deckSizeList);
      track(() => queryStore.deckSizesFilter);
      console.log("header track:", { deckSizeList, queryStore });

      // for display:
      deckSizesFilterString.value = queryStore.deckSizesFilter.join(",");

      // for highlighting/sorting the dropdown sizes:
      // separate into selected and unselected
      [deckSizesSelected.value, deckSizesUnselected.value] = deckSizeList.value
        .sort((a, b) => a - b) // ascending
        .reduce<[number[], number[]]>(
          (accum, eachSize) => {
            queryStore.deckSizesFilter.includes(eachSize)
              ? accum[0].push(eachSize)
              : accum[1].push(eachSize);
            return accum;
          },
          [[], []],
        );
    });

    const widthCutoffLength = 100;
    return (
      <div class="flex-grow-0 flex justify-center items-center max-w-full overflow-hidden bg-slate-700 text-xs sm:text-sm lg:text-lg p-0.5">
        <select
          class={` bg-slate-800 w-full justify-self-start `}
          value={selectValue.value}
          onChange$={onChangeSelect$}
        >
          <option value="default" data-label="current-selection">
            {deckSizesFilterString.value.length > widthCutoffLength
              ? deckSizesFilterString.value.substring(
                  0,
                  widthCutoffLength - 3,
                ) + "..."
              : deckSizesFilterString.value}
          </option>
          <option value={-1}>Toggle All</option>

          {deckSizesSelected.value.map((deckSize) => (
            <option
              key={deckSize}
              value={deckSize}
              class={` bg-slate-800 text-green-400 font-extrabold`}
            >
              {String(deckSize)}
            </option>
          ))}

          {deckSizesUnselected.value.map((deckSize) => (
            <option key={deckSize} value={deckSize} class={`bg-slate-800`}>
              {String(deckSize)}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

const BASE_BUTTON_CLASSES: ClassList =
  "disabled:opacity-40 text-slate-100 flex justify-center items-center w-[1em] min-w-min h-[1.4em] leading-[1.2]";

const PAGE_BUTTONS_MAX = 13;

const DECK_SIZES_WIDTH = "7em";

type TablePagingFooterProps = {
  queryStore: QueryStore;
  queryScores$: QRL<(queryStoreProp: QueryStore) => any>;
  onChangeResultsPerPage$: QRL<(e: Event, t: HTMLSelectElement) => any>;
};
const TablePagingFooter = component$<TablePagingFooterProps>(
  ({ queryStore, queryScores$, onChangeResultsPerPage$ }) => {
    const buttons = useStore({
      first: true,
      prev: true,
      next: true,
      last: true,
      prevPage: queryStore.pageNumber, // used for?
    });

    const remainingPageButtons = useSignal<number[]>([]);

    const calculateRemainingPageButtons = $(
      (remainingButtons = PAGE_BUTTONS_MAX) => {
        const currentPage = queryStore.pageNumber;

        const bonus = Math.floor((remainingButtons - 1) / 2);
        // with 11 max, I'm getting up to 5 "number" buttons on one side,
        // when at the start or the end page
        // e.g. 10 total buttons, 6 number and then << < > >>
        //
        // TODO:
        // would like more dynamic:
        // - if on second to last or first page, hide the last/first button
        // - if on the last/first page, hide both next/last or prev/first buttons
        // - and should always attempt to show up to MAX buttons
        //  - so if 11 MAX, and on page 1, should show 1 thru 9 and next/last === 11
        //
        // - or maybe something with ".." and then a 5 or 10 step?
        // 1 2 3 4 5 .. 10 > >>

        const startPage = Math.max(1, currentPage - bonus);
        const endPage =
          Math.min(queryStore.totalPages, currentPage + bonus) + 1;

        return Array(endPage - startPage)
          .fill(0)
          .map((_, i) => startPage + i);
      },
    );

    useTask$(({ track }) => {
      track(() => [
        queryStore.pageNumber,
        queryStore.totalPages,
        queryStore.totalResults,
      ]);

      buttons.first = queryStore.pageNumber > 1;
      buttons.prev = queryStore.pageNumber > 1;
      buttons.last = queryStore.pageNumber < queryStore.totalPages;
      buttons.next = queryStore.pageNumber < queryStore.totalPages;

      const remainingButtons =
        PAGE_BUTTONS_MAX -
        Object.values(buttons).filter((v) => v === true).length;

      calculateRemainingPageButtons(remainingButtons).then(
        (numberButtons) => (remainingPageButtons.value = numberButtons),
      );
    });

    const onClick$ = $((e: MouseEvent) => {
      const label = (e.target as HTMLButtonElement).dataset["label"]?.split(
        "-",
      );
      if (!label || label[0] !== "page") return;

      let pageNumber = queryStore.pageNumber;
      buttons.prevPage = pageNumber;

      switch (label[1]) {
        case "first":
          pageNumber = 1;
          break;
        case "next":
          pageNumber =
            pageNumber > queryStore.totalPages - 1
              ? queryStore.totalPages
              : pageNumber + 1;
          break;
        case "number":
          pageNumber = Number(label[2]);
          break;
        case "prev":
          pageNumber = pageNumber < 2 ? 1 : pageNumber - 1;
          break;
        case "last":
          pageNumber = queryStore.totalPages;
          break;
        default:
          pageNumber = queryStore.pageNumber;
      }

      // queryStore.pageNumber = pageNumber;

      console.log("clicked page number button:", { label, pageNumber });
      queryScores$({
        sortByColumnHistory: queryStore.sortByColumnHistory,
        deckSizesFilter: queryStore.deckSizesFilter,
        pageNumber: pageNumber,
        resultsPerPage: queryStore.resultsPerPage,
        totalResults: queryStore.totalResults,
        totalPages: queryStore.totalPages,
      });
    });

    return (
      <div class="flex-grow-0 flex flex-col justify-center gap-0.5 text-xs sm:text-sm lg:text-lg h-[3.5em] px-1">
        <div class={`grid w-full flex-grow-0`}>
          <div class="justify-center flex gap-1 w-full" onClick$={onClick$}>
            <button
              disabled={!buttons.first}
              class={BASE_BUTTON_CLASSES}
              data-label="page-first"
            >
              <ChevronStyled direction="left" />
              <ChevronStyled direction="left" />
            </button>
            <button
              disabled={!buttons.prev}
              class={BASE_BUTTON_CLASSES}
              data-label="page-prev"
            >
              <ChevronStyled direction="left" />
            </button>

            {remainingPageButtons.value.map((number) => (
              <button
                key={number}
                class={`${BASE_BUTTON_CLASSES} ${
                  number === queryStore.pageNumber ? "bg-slate-500" : ""
                }`}
                data-label={`page-number-${number}`}
                disabled={number === queryStore.pageNumber}
              >
                {number}
              </button>
            ))}

            <button
              disabled={!buttons.next}
              class={BASE_BUTTON_CLASSES}
              data-label="page-next"
            >
              <ChevronStyled direction="right" />
            </button>
            <button
              disabled={!buttons.last}
              class={BASE_BUTTON_CLASSES}
              data-label="page-last"
            >
              <ChevronStyled direction="right" />
              <ChevronStyled direction="right" />
            </button>
          </div>
        </div>

        <div
          class={`flex-grow-0 grid w-full`}
          style={{
            gridTemplateColumns: `${DECK_SIZES_WIDTH} 1fr ${DECK_SIZES_WIDTH}`,
          }}
        >
          <SelectEl
            classes={`text-xs md:text-sm lg:text-lg z-10 justify-self-start`}
            value={queryStore.resultsPerPage}
            onChange$={onChangeResultsPerPage$}
            listOfOptions={[25, 50, 100, 200]}
          />

          <div class=" text-slate-200">
            ({(queryStore.pageNumber - 1) * queryStore.resultsPerPage}-
            {queryStore.pageNumber * queryStore.resultsPerPage} /{" "}
            {queryStore.totalResults})
          </div>

          <div
            class={` text-slate-400 pointer-events-none justify-self-end`}
            data-label="empty-spacer"
          >
            {queryStore.totalPages} pages
          </div>
        </div>
      </div>
    );
  },
);
