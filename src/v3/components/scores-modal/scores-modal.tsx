import type { CSSProperties, ClassList, QRL, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import type { ScoreTotals } from "~/v3/types/types";
import {
  SortDirectionEnum,
  type ScoreWithPercentiles,
  type SortColumnWithDirection,
} from "~/v3/types/types";
import { isServer } from "@builder.io/qwik/build";
import ScoreTable from "./score-table";
import {
  SORT_COLUMN_MAP,
  COL_TITLE_TO_OBJ_KEY_MAP,
  SORT_COLUMN_HISTORY_DEFAULT_SLICED,
  SORT_COLUMN_HISTORY_MAX,
  ROW_COUNT_OPTIONS,
  ROW_COUNT_DEFAULT,
} from "./constants";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import Modal from "../templates/modal/modal";
import serverDbService from "~/v3/services/db";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";
import { FONT_SIZES } from "~/v3/constants/styles";
import Dropdown from "../molecules/dropdown/dropdown";
import InputToggle from "../atoms/input-toggle/input-toggle";
import Button from "../atoms/button/button";

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

export type QueryStore = {
  sortByColumnHistory: SortColumnWithDirection[];
  deckSizesFilter: number[];
  pageNumber: number;
  resultsPerPage: number;
  totalResults: number;
  totalPages: number;
};

const HEADER_HEIGHT = "1.75rem" as const; //"28px" as const; // 1.75rem
const FOOTER_HEIGHT = "2.75rem" as const; // "40px" as const; // 2.5rem

export default component$(() => {
  const ctx = useGameContextService();
  if (ctx.state.gameData.IS_SCORES_ENABLED === false) {
    return <></>;
  }

  const isLoading = useSignal(true);

  const queryStore = useStore<QueryStore>(
    {
      sortByColumnHistory: SORT_COLUMN_HISTORY_DEFAULT_SLICED,
      deckSizesFilter: [ctx.state.userSettings.deck.size], // default to our deck.size
      pageNumber: 1,
      resultsPerPage: ROW_COUNT_DEFAULT,
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
  // - >
  // - wish I had qwik-query...
  //
  const displayedScores = useSignal<ScoreWithPercentiles[]>([]);

  // stores the array of decksizes:
  //  or could just use the keys of ScoreTotals
  const allDeckSizesList = useSignal<number[]>([]);
  // stores each deck size totals, and all totals
  // what is this used for??
  const scoreTotals = useSignal<ScoreTotals>({
    all: 0,
  });

  // should this take actual props instead of the store?
  // take query props, then it can save the store at the end after it's done
  const queryScores$ = $(async (opts?: Partial<QueryStore>) => {
    if (ctx.state.gameData.IS_SCORES_ENABLED === false) return;
    isLoading.value = true;

    const params: QueryStore = {
      ...queryStore,
      ...opts,
    };

    // console.log({ params });
    // console.log("queryAndSaveScores timing...", JSON.stringify(params), "\n", JSON.stringify(queryStore));
    if (params.resultsPerPage !== queryStore.resultsPerPage) {
      // page * count / newCount = newPage
      // 4 * 25 === 100 / 50 = 2
      // 5 * 25 === 125 / 50 = 2.5 => 3 math.ceil
      // 6 * 25 === 150 / 50 = 3
      // 4 * 25 === 100 / 100 = 1
      //

      // 4*100 === 400 / 25 = 16, want to place it on page 13 (e.g. starting at index 301) (- factor + 1 e.g. 100 / 25 = 4 => -4 + 1)
      // 4*100 === 400 / 50 = 8, want to place on page 7 (- factor + 1 e.g. 100 / 50 = 2  => - 2 + 1)
      // 1*100 === 100 / 50 = 2, want to be on page 1 (100 / 50 = 2 => -2 + 1)
      //
      // 4 - 1 * 100 === 300 / 50 = 6, + 1
      // 4 - 1 * 100 === 300 / 25 = 12, + 1

      const oldPage = queryStore.pageNumber;
      const oldResultsPerPage = queryStore.resultsPerPage;
      const newResultsPerPage = params.resultsPerPage;
      let newPage = 1;
      if (newResultsPerPage > oldResultsPerPage) {
        newPage = Math.ceil(oldPage * oldResultsPerPage / newResultsPerPage
);
      } else {
        newPage = (((oldPage - 1) * oldResultsPerPage) / newResultsPerPage) + 1
      }
      params.pageNumber = newPage;
    }

    try {
      const [scoresRes, deckSizesRes] = await Promise.all([
        serverDbService.scores.queryWithPercentiles({
          pageNumber: params.pageNumber,
          resultsPerPage: params.resultsPerPage,
          deckSizesFilter:
            params.deckSizesFilter.length === 0
              ? [ctx.state.userSettings.deck.size] // default just in case
              : params.deckSizesFilter,
          sortByColumnHistory: params.sortByColumnHistory,
        }),
        // skip this query if we are getting all deckSizes (only works if we also have data for every decksize)
        // if there's not all the sizes in our dropdown list, we will never have 24 for our value, so it will
        // continue to fetch this query, although that is not needed.
        // - Could separate this query so it's not combined with the Scores query,
        //    - the dropdown list should be separate
        params.deckSizesFilter.length === 24
          ? []
          : serverDbService.scoreCounts.getDeckSizes(),
      ]);

      const { scores, totals } = scoresRes; // totals includes all decksizes in query

      allDeckSizesList.value =
        params.deckSizesFilter.length === 24
          ? Object.keys(totals).map(Number)
          : deckSizesRes;

      const totalCountForQuery = Object.values(totals).reduce(
        (accum, cur) => (accum += cur),
        0,
      );
      scoreTotals.value = {
        ...totals, // totals by deck size
        all: totalCountForQuery, // full score count for specific query
      };
      const newTotalPages = Math.ceil(
        totalCountForQuery / params.resultsPerPage,
      );

      queryStore.pageNumber = params.pageNumber;
      queryStore.resultsPerPage = params.resultsPerPage;
      queryStore.deckSizesFilter = params.deckSizesFilter;
      queryStore.sortByColumnHistory = params.sortByColumnHistory;
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
      displayedScores.value = [...scores];

      // console.log({ queryStore });

      isLoading.value = false;
    } catch (e) {
      console.error("Error fetching the scores!!", e);
      isLoading.value = false;
    }
  });

  const handleClickColumnHeader = $((e: MouseEvent) => {
    // console.log({target: e.target});
    const clickedDataAttr = (e.target as HTMLButtonElement).getAttribute(
      "data-sort-column",
    ) as string;

    // map clicked data-attr to the column title
    const clickedColumnTitle = COL_TITLE_TO_OBJ_KEY_MAP[clickedDataAttr];

    let sortByColumnHistory = queryStore.sortByColumnHistory;
    const currentSortByColumn = queryStore.sortByColumnHistory[0];

    // console.log({ clickedDataAttr, clickedColumnTitle, currentSortByColumn });

    if (currentSortByColumn.column === clickedColumnTitle) {
      // same column so toggle direction
      const newDirection =
        currentSortByColumn.direction === SortDirectionEnum.asc
          ? SortDirectionEnum.desc
          : SortDirectionEnum.asc;
      sortByColumnHistory[0].direction = newDirection;
    } else {
      // set new column & direction
      sortByColumnHistory = [
        SORT_COLUMN_MAP[clickedColumnTitle], // new column first
        ...sortByColumnHistory.filter(
          ({ column }) => column !== clickedColumnTitle, // make sure we don't have duplicates
        ),
      ].slice(0, SORT_COLUMN_HISTORY_MAX);
    }

    queryScores$({
      sortByColumnHistory,
    });
  });

  const onChangeResultsPerPage$ = $((_: Event, t: HTMLSelectElement) => {
    queryScores$({
      resultsPerPage: Number(t.value),
    });
  });

  const onChangeSelectDropdown = $((deckSizesFilter: number[]) => {
    // TODO: if decksizes filter changed, then pass 1 as pageNumber
    // const sortedDeckSizesFilter = deckSizesFilter.sort((a, b) => a - b);
    // const sortedExisting = queryStore.deckSizesFilter.sort((a, b) => a - b);
    // if (JSON.stringify(sortedDeckSizesFilter) !== JSON.stringify(sortedExisting)) {
    //   return queryScores$({
    //     deckSizesFilter,
    //     pageNumber: 1,
    //   });
    // }
    queryScores$({
      deckSizesFilter,
      pageNumber: 1,
    });
  });

  // update filter when user changes their decksize from settings
  useTask$(({ track }) => {
    track(() => ctx.state.userSettings.deck.size);
    queryStore.deckSizesFilter = [ctx.state.userSettings.deck.size];
  });

  /*
   * onMount, onShow modal
   * */
  useTask$(({ track }) => {
    const isShowing = track(
      () => ctx.state.interfaceSettings.scoresModal.isShowing,
    );
    if (isServer || !isShowing) return;

    queryScores$();
  });

  useStyles$(`
    table.scoreboard {
      position: relative;
      overflow: hidden;
    }

    table.scoreboard thead {
      overflow: hidden;
      border: 1px solid #444;
      border-right: none;
      position: relative;
    }
    table.scoreboard tbody {
      position: relative;
      z-index: 1;
    }

    table.scoreboard th {
      height: 6em;
      white-space: nowrap;
      position: relative;
      --button-color: #cbd5e1;
      --button-rotate: 0deg;
      --button-scale: 0.8;
      --button-opacity: 0.3;
      --text-color: #cbd5e1;
      --text-opacity: 0.7;
      --text-weight: 500;
      font-weight: var(--text-weight);
    }

    /* 
     * styling the sort buttons 
     * */
    table.scoreboard th div.header-buttons-container {
      position: absolute;
      bottom: 0;
      left: 0.5em;
      display: flex;
      align-items: end;
      width: calc(99% - 0.5em);
      justify-content: center;
    }
    table.scoreboard th div.header-buttons-container button {
      padding: 0 0.5em;
    }
    table.scoreboard th div.header-buttons-container button svg {
      transition: all 0.1s ease-in-out;
      pointer-events: none;
    }
    table.scoreboard th.desc div.header-buttons-container button svg {
      --button-rotate: 180deg;
    }
    table.scoreboard th[data-sort-priority="1"] {
      --button-color: #fff;
      --button-opacity: 1;
      --button-scale: 1.15;
      --text-color: #fff;
      --text-opacity: 1;
      --text-weight: 900;
      text-shadow: 1px 1px 3px #000;
    }
    table.scoreboard th[data-sort-priority="2"] {
      --button-color: #f1f5f9;
      --button-opacity: 1;
      --text-color: #f1f5f9;
      --text-opacity: 1;
      --text-weight: 700;
    }
    table.scoreboard th[data-sort-priority="3"] {
      /* text-slate-200 */
      --button-color: #e2e8f0;
      --button-opacity: 0.8;
      --text-color: #e2e8f0;
      --text-opacity: 0.9;
    }
    table.scoreboard th[data-sort-priority="4"] {
      /* text-slate-300 */
      --button-color: #cbd5e1;
      --button-opacity: 0.8;
      --text-color: #cbd5e1;
      --text-opacity: 0.9;
    }
    

    table.scoreboard th.desc div.header-buttons-container button svg,
    table.scoreboard th.asc div.header-buttons-container button svg {
      transform: rotate(var(--button-rotate)) scale(var(--button-scale));
      opacity: var(--button-opacity);
      color: var(--button-color);
    }


    /* 
     * Angled sort column headers
     * */
    table.scoreboard th > div.rotate {
      pointer-events: none;
    }
    table.scoreboard th div.rotate > div > span {
      color: var(--text-color);
      opacity: var(--text-opacity);
      font-weight: var(--text-weight);
    }

    /* Rotation -  Magic Numbers... might need tweaking */
    table.scoreboard th > div.rotate {
      /* width also acts as a minimum column width */
      width: 2em;
      transform-origin: left top;
      transform:
        translateY(calc(3.6em))
        rotate(-45deg);
    }

    table.scoreboard th > div.rotate > div {
      text-align: left;
      /* width needed to make the border stretch to the top */
      width: 8.5em;
      /* slide the border to touch the bottom */
      margin-left: -0.15em;
      /* x padding does not mess with the border, yay! position the text more upwards */
      padding: 0 0 0 3em;
    }





    /* table body */
    table.scoreboard tbody td + td {
      border-left-width: 1px;
      border-left-style: solid;
      border-left-color: rgb(127 127 127 / 0.25);
      font-weight: 600;
      text-shadow: 1px 1px 3px #000;
    }
    table.scoreboard.loading tbody td + td {
      border-left-color: rgb(127 127 127 / 0.15);
    }

    table.scoreboard tbody tr {
      transition: all 100ms ease-in-out;
      border-style: solid;
      border-bottom-width: 1px;
      border-bottom-color: #0f172a;
    }

    table.scoreboard.loading tbody tr {
      border-bottom-color: rgb(15 23 42/0.3);
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
      isShowing={ctx.state.interfaceSettings.scoresModal.isShowing}
      hideModal$={ctx.handle.hideScoresModal}
      title="Scoreboard"
      containerClasses="w-full sm:w-[max(640px,60vw)] sm:max-w-[max(640px,60vw)] md:w-[80vw] md:max-w-[50rem]"
      wrapperSyles={{
        overflowY: "hidden",
      }}
    >
      <div
        class={`${FONT_SIZES.SMALL} relative grid max-w-full h-[70vh]`}
        style={`grid-template-rows: ${HEADER_HEIGHT} 1fr ${FOOTER_HEIGHT};`}
      >
        <TableDecksizeFilterHeaderDropdown
          onChangeSelect$={onChangeSelectDropdown}
          queryStore={queryStore}
          allDeckSizesList={allDeckSizesList}
          defaultDeckSizeList={[ctx.state.userSettings.deck.size]}
        />

        <div
          class={`w-full ${isLoading.value ? "overflow-y-scroll" : "overflow-y-scroll"} [scrollbar-gutter:stable] scrollbar-styles shadow-inner-2`}
        >
          <ScoreTable
            isLoading={isLoading.value}
            handleClickColumnHeader$={handleClickColumnHeader}
            sortedScores={displayedScores.value}
            queryStore={queryStore}
            scoreTotals={scoreTotals.value}
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
  listOfOptions: Readonly<Array<number>>;
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

type DropdownProps = {
  onChangeSelect$: QRL<(newDeckSizesFilter: number[]) => any>;
  queryStore: QueryStore;
  allDeckSizesList: Signal<number[]>;
  defaultDeckSizeList: number[];
};

const SELECTED_STYLES = "text-green-400 font-extrabold text=[1.2em]";

const TableDecksizeFilterHeaderDropdown = component$<DropdownProps>(
  ({ onChangeSelect$, queryStore, allDeckSizesList, defaultDeckSizeList }) => {
    const deckSizesFilterString = useSignal("");
    const selectedFilter = useSignal<number[]>(queryStore.deckSizesFilter);
    const lastSelected = useSignal<number[]>(queryStore.deckSizesFilter);

    // only for if they change settings and then open the score modal
    useTask$(({ track }) => {
      track(() => queryStore.deckSizesFilter);
      selectedFilter.value = queryStore.deckSizesFilter;
      deckSizesFilterString.value = queryStore.deckSizesFilter
        .sort((a, b) => a - b)
        .join(", ");
    });

    const isDropdownOpen = useSignal(false);
    const unsavedFilter = useSignal<number[]>([]);

    const handleToggle = $((_isOpen: boolean, isChanged: boolean = false) => {
      isDropdownOpen.value = _isOpen;
      if (_isOpen) {
        // save previous settings
        unsavedFilter.value = selectedFilter.value;
      } else if (!isChanged) {
        // reset to prev settings
        selectedFilter.value = unsavedFilter.value;
      }
    });

    const clear$ = $(() => {
      selectedFilter.value = defaultDeckSizeList;
    });

    const apply$ = $(() => {
      // runs the query
      // console.log(selectedFilter.value);
      onChangeSelect$(selectedFilter.value);
      handleToggle(false, true);
    });

    return (
      <div class="w-full">
        <Dropdown
          wrapperClasses={`absolute z-50 transition-all w-full rounded-lg border-l border-b box-border border-slate-700 ${
            isDropdownOpen.value
              ? "border-l-slate-500 border-b-slate-500 bg-slate-800"
              : "hover:border-l-slate-500 bg-slate-700" // hide left dark line on hover
          }`}
          buttonClasses={`flex justify-center items-center w-full [padding:0!important;] bg-slate-700`}
          buttonStyles={`height: ${HEADER_HEIGHT};` as unknown as CSSProperties}
          contentClasses="border-none"
          isOpen={isDropdownOpen}
          onClick$={() => handleToggle(!isDropdownOpen.value)}
        >
          <div
            q:slot="button"
            class="inline-block max-w-[90%] overflow-hidden overflow-ellipsis whitespace-nowrap"
          >
            Filter: {deckSizesFilterString.value}
          </div>

          <div
            class={`grid p-[0.6em] gap-4 rounded-lg ${
              allDeckSizesList.value.length === 0
                ? "grid-rows-[calc(2.25em+0.875rem)_calc(1.625em+1rem)]"
                : "grid-rows-[calc(2.25em+0.875rem)_1fr_calc(1.625em+1rem)]"
            } max-h-[calc(15em+108px)]`}
          >
            <InputToggle
              classes="rounded-full bg-slate-700 p-1 pl-4 text-[1.2em]"
              checked={
                selectedFilter.value.length === allDeckSizesList.value.length
              }
              onChange$={(_, t) => {
                if (t.checked) {
                  // when toggling all, save the last selected first so we can restore
                  lastSelected.value = selectedFilter.value;
                  selectedFilter.value = allDeckSizesList.value;
                } else {
                  selectedFilter.value = lastSelected.value;
                }
              }}
            >
              <div
                q:slot="label"
                class={
                  queryStore.deckSizesFilter.length ===
                  allDeckSizesList.value.length
                    ? SELECTED_STYLES
                    : ""
                }
              >
                Toggle All
              </div>
            </InputToggle>

            {allDeckSizesList.value.length > 0 && (
              <div class="overflow-y-auto scrollbar-styles relative p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-700/40 rounded-md lg:rounded-lg">
                {allDeckSizesList.value.map((deckSize) => (
                  <InputToggle
                    key={deckSize}
                    classes="rounded-full bg-slate-700 p-1 pl-[1em]"
                    checked={selectedFilter.value.includes(deckSize)}
                    onChange$={(_, t) => {
                      selectedFilter.value = t.checked
                        ? [...selectedFilter.value, deckSize]
                        : selectedFilter.value.filter(
                            (size) => size !== deckSize,
                          );
                    }}
                  >
                    <div
                      q:slot="label"
                      class={`text-[1.1em] w-[1.15em] text-center ${
                        selectedFilter.value.includes(deckSize)
                          ? SELECTED_STYLES
                          : ""
                      }`}
                    >
                      {deckSize}
                    </div>
                  </InputToggle>
                ))}
              </div>
            )}

            <div class="mx-auto flex w-full gap-[1.5em] max-w-[30em]">
              <Button classes="w-full max-w-[12em]" onClick$={clear$}>
                My Size Only ({defaultDeckSizeList[0]})
              </Button>
              <Button classes="w-full" onClick$={apply$}>
                Apply
              </Button>
            </div>
          </div>
        </Dropdown>
      </div>
    );
  },
);

const calculateRemainingPageButtons = (
  remainingButtons: number, // e.g. 13 - 2 = 11 or 13 - 4 = 9
  pageNumber: number,
  totalPages: number,
) => {
  const halfRemaining = Math.floor((remainingButtons - 1) / 2); // e.g. 5
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

  // e.g. on page 1/100: startPage = 1
  // e.g. end page should be 11
  //
  // e.g. on page 96/100: startPage = 90
  // e.g. end page should be 100
  let startPage = 1;
  let endPage = totalPages;
  if (pageNumber / totalPages <= 0.5) {
    // e.g. 1-50 is less, 51-100 is more
    startPage = Math.max(1, pageNumber - halfRemaining); // e.g. 3 => 1
    endPage = Math.min(totalPages, startPage + remainingButtons - 1); // e.g. 12
  } else {
    // e.g. on page 100 + 5 => 100 end page
    // e.g. 100 - 11 = 89 + 1 => 90
    endPage = Math.min(totalPages, pageNumber + halfRemaining); // e.g. 96 => 100
    startPage = Math.max(1, endPage - remainingButtons + 1); // e.g. 96 => 89
  }

  // 100 - 90 = 10 length array => [0...10] => [89...99] so add 1
  return Array(endPage - startPage + 1) // e.g. 12 - 1 = 11, or 100 - 89 = 11
    .fill(0)
    .map((_, i) => startPage + i);
};

const BASE_BUTTON_CLASSES: ClassList =
  "text-slate-100 flex justify-center items-center w-[1.4em] min-w-min h-[1.4em] leading-[1.1]";
const ARROW_BUTTON_CLASSES: ClassList =
  BASE_BUTTON_CLASSES + " w-[1em] disabled:opacity-40 ";

const NUMBER_BUTTONS_MAX = 11;

const DECK_SIZES_WIDTH: ClassList = "7em";

type TablePagingFooterProps = {
  queryStore: QueryStore;
  queryScores$: QRL<(opts: Partial<QueryStore>) => any>;
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

    useTask$(({ track }) => {
      track(() => [queryStore.pageNumber, queryStore.totalPages]);

      buttons.first = queryStore.pageNumber > 2;
      buttons.prev = queryStore.pageNumber > 1;
      buttons.next = queryStore.pageNumber < queryStore.totalPages;
      buttons.last = queryStore.pageNumber < queryStore.totalPages - 1;

      remainingPageButtons.value = calculateRemainingPageButtons(
        NUMBER_BUTTONS_MAX,
        queryStore.pageNumber,
        queryStore.totalPages,
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

      // console.log("clicked page number button:", { label, pageNumber });
      queryScores$({
        pageNumber,
      });
    });

    return (
      <div
        class={`flex-grow-0 flex flex-col justify-end gap-1 text-xs px-1`}
        style={`height: ${FOOTER_HEIGHT};`}
      >
        <div class={`grid w-full flex-grow-0`}>
          <div
            class="flex gap-[0.2em] items-center justify-center  w-full"
            onClick$={onClick$}
          >
            <button
              disabled={!buttons.first}
              class={ARROW_BUTTON_CLASSES}
              data-label="page-first"
            >
              <ChevronStyled direction="left" />
              <ChevronStyled direction="left" />
            </button>
            <button
              disabled={!buttons.prev}
              class={ARROW_BUTTON_CLASSES}
              data-label="page-prev"
            >
              <ChevronStyled direction="left" />
            </button>

            {remainingPageButtons.value.map((number) => (
              <button
                key={number}
                class={`${BASE_BUTTON_CLASSES} ${
                  number === queryStore.pageNumber
                    ? "bg-slate-700/50 text-slate-200 scale-110"
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
              class={ARROW_BUTTON_CLASSES}
              data-label="page-next"
            >
              <ChevronStyled direction="right" />
            </button>
            <button
              disabled={!buttons.last}
              class={ARROW_BUTTON_CLASSES}
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
            classes={`z-10 justify-self-start`}
            value={queryStore.resultsPerPage}
            onChange$={onChangeResultsPerPage$}
            listOfOptions={ROW_COUNT_OPTIONS}
          />

          <div class="text-slate-300">
            Results:{" "}
            {1 + (queryStore.pageNumber - 1) * queryStore.resultsPerPage}
            {" - "}
            {queryStore.pageNumber === queryStore.totalPages // is last page
              ? queryStore.totalResults // e.g. 400 - [463]
              : queryStore.pageNumber * queryStore.resultsPerPage}
            {queryStore.totalPages > 1 ? ` of ${queryStore.totalResults}` : ""}
          </div>

          <div class={`text-slate-400 pointer-events-none justify-self-end`}>
            {queryStore.totalPages} page{queryStore.totalPages > 1 ? "s" : ""}
          </div>
        </div>
      </div>
    );
  },
);
