import type { ClassList, FunctionComponent } from "@builder.io/qwik";
import { type QRL, component$, useSignal } from "@builder.io/qwik";
import type {
  ScoreTotals} from "~/v3/types/types";
import {
  type ScoreWithPercentiles,
  SortDirectionEnum
} from "~/v3/types/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import type { QueryStore } from "./scores-modal";
import {
  DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY,
  HEADER_LIST,
  MAP_COL_TITLE_TO_OBJ_KEY,
  HEADER_UNSORTABLE,
} from "./constants";
import { formatTimeFromMs } from "~/v3/utils/formatTime";
import { lowercaseHyphenate } from "~/v3/utils/utils";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";
import { FONT_SIZES } from "~/v3/constants/styles";

type ScoreTableProps = {
  queryStore: QueryStore;
  handleClickColumnHeader$: QRL<(e: MouseEvent) => void>;
  sortedScores: ScoreWithPercentiles[];
  isLoading: boolean;
  scoreTotals: ScoreTotals;
};
export default component$<ScoreTableProps>(
  ({
    queryStore,
    handleClickColumnHeader$,
    sortedScores,
    scoreTotals,
    isLoading,
  }) => {
    return (
      <table
        q:slot="scoreboard-tab0"
        class={`scoreboard ${isLoading ? "loading" : ""} w-full `}
      >
        <thead class={` text-xs sm:text-sm  bg-slate-500`}>
          <tr>
            {HEADER_LIST.map((header) => {
              const hyphenated = lowercaseHyphenate(header);
              const key = MAP_COL_TITLE_TO_OBJ_KEY[hyphenated];
              // should have the asc/desc and also the sort order/index
              // e.g. asc-1 asc-2 asc-n
              //
              //list of headers
              //have the current hyphenated to get the column title
              // need to get the direction for the label, and also need to get the index
              //
              // this is only for css!
              const defaultClass: SortDirectionEnum =
                DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(
                  ({ column }) => column === key,
                )?.direction ?? SortDirectionEnum.desc;

              let priority = 0;
              let classes:
                | `${SortDirectionEnum}-${number}`
                | SortDirectionEnum
                | undefined;
              queryStore.sortByColumnHistory.forEach((sortColumn, i) => {
                if (sortColumn.column === key) {
                  classes = sortColumn.direction;
                  priority = i + 1;
                }
              });
              return (
                <ScoreTableHeader
                  key={key}
                  title={header}
                  hyphenated={hyphenated}
                  classes={classes ?? defaultClass}
                  sortPriority={priority}
                  onClick$={
                    HEADER_UNSORTABLE.includes(header)
                      ? undefined
                      : handleClickColumnHeader$
                  }
                />
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <RowsSkeleton />
          ) : (
            sortedScores.map((score) => (
              <ScoreRow
                key={score.id}
                score={score}
                scoreTotalsForDeckSize={scoreTotals[score.deckSize]}
              />
            ))
          )}
        </tbody>
      </table>
    );
  },
);

type ScoreTableHeaderProps = {
  title: string;
  hyphenated: string;
  onClick$?: QRL<(e: MouseEvent) => void>;
  classes?: ClassList;
  sortPriority?: number;
};
const ScoreTableHeader = component$<ScoreTableHeaderProps>(
  ({ title, hyphenated, onClick$, classes = "", sortPriority }) => {
    return (
      <th class={`${classes}`} data-sort-priority={sortPriority}>
        <div class="rotate ">
          <div
            class="border-t-[1px] border-t-slate-800"
            data-sort-column={hyphenated}
          >
            <span>{title}</span>
          </div>
        </div>

        {onClick$ && (
          <div class="header-buttons-container">
            <button
              onClick$={onClick$}
              data-sort-column={hyphenated}
              class="text-slate-300"
            >
              <ChevronSvg style={{ width: "1.15em", height: "0.9em" }} />
            </button>
          </div>
        )}
      </th>
    );
  },
);

const ROW_BG_COLOR_ALPHA = 0.8;
const AVATAR_WIDTH: ClassList = "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12";

const appendAlphaToHSL = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

type ScoreRowProps = {
  score: ScoreWithPercentiles;
  scoreTotalsForDeckSize: number;
};
const ScoreRow = component$<ScoreRowProps>(
  ({ score, scoreTotalsForDeckSize }) => {
    const backgroundColor = useSignal("");

    return (
      <tr
        class={`${backgroundColor.value === "" ? "opacity-0" : "opacity-100"} w-full h-full ${FONT_SIZES.SMALL} text-white`}
        style={{
          backgroundColor: backgroundColor.value,
        }}
      >
        <td>
          <PixelAvatar
            classes={AVATAR_WIDTH}
            hash={{ value: score.userId }}
            colorFrom={{ value: score.initials }}
            outputTo$={({ color }) => {
              backgroundColor.value = appendAlphaToHSL(color);
            }}
          />
        </td>
        <td>{score.initials}</td>
        <td>{score.deckSize}</td>
        <td>{score.pairs}</td>
        <td>
          <span class="block">
            <GameTime gameTimeDs={score.gameTimeDs} />
          </span>
          {scoreTotalsForDeckSize > 1 && (
            <span class="block">{score.timePercentile}%</span>
          )}
        </td>
        <td>
          <span class="block">{score.mismatches}</span>
          {scoreTotalsForDeckSize > 1 && (
            <span class="block">{score.mismatchPercentile}%</span>
          )}
        </td>
        <TdCreatedAt createdAtMs={score.createdAt} />
      </tr>
    );
  },
);

const RowsSkeleton = component$(() => (
  <>
    {Array(20)
      .fill(0)
      .map((_, i) => (
        <tr
          key={i}
          class={`${FONT_SIZES.SMALL}`}
        >
          <td>
            <div class={AVATAR_WIDTH} />
          </td>
          <td> </td>
          <td> </td>
          <td> </td>
          <td> </td>
          <td> </td>
          <td> </td>
        </tr>
      ))}
  </>
));

const TIME_LABEL_COLOR: ClassList = "text-slate-300/100";
const TIME_LABEL_SIZE_SMALL: ClassList = "text-[0.8em] leading-3";

type GameTimeProps = { gameTimeDs: number };
const GameTime = component$<GameTimeProps>(({ gameTimeDs }) => {
  const { minutes, seconds, ms } = formatTimeFromMs(gameTimeDs * 100);
  return (
    <>
      <span
        class={
          minutes > 0
            ? ""
            : `${TIME_LABEL_SIZE_SMALL} ${TIME_LABEL_COLOR}
      `
        }
      >
        {String(minutes).padStart(2, "0")}
      </span>
      <span
        class={`mx-[1px] ${TIME_LABEL_COLOR} ${
          Number(minutes) > 0 ? "" : TIME_LABEL_SIZE_SMALL
        }`}
      >
        m
      </span>
      <span>{seconds}</span>
      <span class={`${TIME_LABEL_SIZE_SMALL} ${TIME_LABEL_COLOR}`}>
        .{ms[0]}s
      </span>
    </>
  );
});

type TdCreatedAtProps = { createdAtMs: number };
const TdCreatedAt: FunctionComponent<TdCreatedAtProps> = ({ createdAtMs }) => {
  const [date, time] = new Date(createdAtMs).toLocaleString().split(", ");
  return (
    <td>
      <span class="block">{date}</span>
      <span class="block whitespace-nowrap">{time}</span>
    </td>
  );
};

