import type { ClassList, FunctionComponent } from "@builder.io/qwik";
import {
  type QRL,
  component$,
  useSignal,
  useComputed$,
} from "@builder.io/qwik";
import type { ScoreTotals } from "~/v3/types/types";
import { type ScoreWithPercentiles, SortDirectionEnum } from "~/v3/types/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import type { QueryStore } from "./scores-modal";
import {
  HEADER_LIST,
  COL_TITLE_TO_OBJ_KEY_MAP,
  HEADER_UNSORTABLE,
  SORT_COLUMN_HISTORY_DEFAULT_FULL,
} from "./constants";
import { formatTimeFromMs } from "~/v3/utils/formatTime";
import { lowercaseHyphenate } from "~/v3/utils/utils";
import ChevronSvg from "~/media/icons/icons8-chevron-96 convertio.svg?jsx";
import { FONT_SIZES } from "~/v3/constants/styles";

type ScoreTableProps = {
  queryStore: QueryStore;
  onChangeSort$: QRL<(e: MouseEvent, t: HTMLElement) => void>;
  sortedScores: ScoreWithPercentiles[];
  isLoading: boolean;
  scoreTotals: ScoreTotals;
};
export default component$<ScoreTableProps>(
  ({ queryStore, onChangeSort$, sortedScores, scoreTotals, isLoading }) => {
    return (
      <table
        q:slot="scoreboard-tab0"
        class={`scoreboard ${isLoading ? "loading" : ""} w-full`}
      >
        <thead class={`text-xs sm:text-sm`}>
          <tr>
            {HEADER_LIST.map((header) => {
              const hyphenated = lowercaseHyphenate(header);
              const key = COL_TITLE_TO_OBJ_KEY_MAP[hyphenated];
              // should have the asc/desc and also the sort order/index
              // e.g. asc-1 asc-2 asc-n
              //
              //list of headers
              //have the current hyphenated to get the column title
              // need to get the direction for the label, and also need to get the index
              //
              // this is only for css!
              const defaultDirection: SortDirectionEnum =
                SORT_COLUMN_HISTORY_DEFAULT_FULL.find(
                  ({ column }) => column === key,
                )?.direction ?? SortDirectionEnum.desc;

              let priority = 0;
              let direction:
                | `${SortDirectionEnum}-${number}`
                | SortDirectionEnum
                | undefined = undefined;
              queryStore.sortByColumnHistory.forEach((sortColumn, i) => {
                if (sortColumn.column === key) {
                  direction = sortColumn.direction;
                  priority = i + 1;
                }
              });
              return (
                <ScoreTableHeader
                  key={key}
                  title={header}
                  hyphenated={hyphenated}
                  sortPriority={priority}
                  direction={direction ?? defaultDirection}
                  onClick$={
                    HEADER_UNSORTABLE.includes(header)
                      ? undefined
                      : onChangeSort$
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
  onClick$?: QRL<(e: MouseEvent, t: HTMLElement) => void>;
  sortPriority?: number;
  direction?: SortDirectionEnum;
};
const ScoreTableHeader = component$<ScoreTableHeaderProps>(
  ({ title, hyphenated, onClick$, sortPriority, direction }) => {
    const computedProperties = useComputed$(() => ({
      "data-sort-column": hyphenated,
      "data-sort-priority": sortPriority,
      "data-sort-direction": direction,
    }));
    return (
      <th data-column={hyphenated} {...(onClick$ && computedProperties.value)}>
        <div class="rotate-clip">
          <div class="rotate">
            {onClick$ ? (
              <button
                type="button"
                class="background"
                {...(onClick$ && {
                  onClick$: onClick$,
                  ...computedProperties.value,
                })}
              >
                <span>{title}</span>
              </button>
            ) : (
              <div class="background">
                <span>{title}</span>
              </div>
            )}
          </div>
        </div>

        {onClick$ && <ChevronSvg />}
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
        class={`${backgroundColor.value === "" ? "opacity-0" : "opacity-100"} ${FONT_SIZES.SMALL} text-slate-50`}
        style={{
          backgroundColor: backgroundColor.value,
        }}
      >
        <td>
          <PixelAvatar
            class={AVATAR_WIDTH}
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
          <GameTime gameTimeDs={score.gameTimeDs} />
          {scoreTotalsForDeckSize > 1 && (
            <span class="block text-[0.9em] text-slate-200">
              ({score.timePercentile}%)
            </span>
          )}
        </td>
        <td>
          <span class="block">{score.mismatches}</span>
          {scoreTotalsForDeckSize > 1 && (
            <span class="block text-[0.9em] text-slate-200">
              ({score.mismatchPercentile}%)
            </span>
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
        <tr key={i} class={`${FONT_SIZES.SMALL}`}>
          <td>
            <div class={AVATAR_WIDTH} />
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      ))}
  </>
));

const TIME_COLOR_GREY: ClassList = "text-slate-300/100";
const TIME_COLOR_GREY_DARK: ClassList = "text-slate-200 opacity-50";
const TIME_LABEL_SIZE_SMALL: ClassList = "text-[0.8em] leading-3";

type GameTimeProps = { gameTimeDs: number };
const GameTime: FunctionComponent<GameTimeProps> = ({ gameTimeDs }) => {
  const { minutes, seconds, ms } = formatTimeFromMs(gameTimeDs * 100);
  return (
    <div>
      <span
        class={
          minutes === 0
            ? `${TIME_LABEL_SIZE_SMALL} ${TIME_COLOR_GREY_DARK}`
            : ""
        }
      >
        {String(minutes).padStart(2, "0")}
      </span>
      <span
        class={`mx-[1px] ${TIME_LABEL_SIZE_SMALL} ${
          Number(minutes) === 0 ? TIME_COLOR_GREY_DARK : TIME_COLOR_GREY
        }`}
      >
        m
      </span>
      <span>{seconds}</span>
      <span class={`${TIME_LABEL_SIZE_SMALL} ${TIME_COLOR_GREY}`}>
        .{ms[0]}s
      </span>
    </div>
  );
};

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
