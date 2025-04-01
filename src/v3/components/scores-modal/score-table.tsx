import type { ClassList, FunctionComponent, Signal } from "@builder.io/qwik";
import { type QRL, component$ } from "@builder.io/qwik";
import type {
  ScoreWithPercentiles,
  SortColumnWithDirection,
} from "~/v3/types/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import type { QueryStore } from "./scores-modal";
import {
  DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY,
  HEADER_LIST,
  MAP_COL_TITLE_TO_OBJ_KEY,
} from "./constants";
import { formatTime } from "~/v3/utils/formatTime";
import { lowercaseHyphenate } from "~/v3/utils/utils";

type ScoreTableProps = {
  queryStore: QueryStore;
  handleClickColumnHeader$: QRL<(e: MouseEvent) => void>;
  sortedScores: Signal<ScoreWithPercentiles[]>;
  size: Signal<number>;
};
export default component$<ScoreTableProps>(
  ({ queryStore, handleClickColumnHeader$, sortedScores, size }) => {
    return (
      <table q:slot="scoreboard-tab0" class="scoreboard w-full ">
        <thead class={` text-xs sm:text-sm md:text-md bg-slate-500`}>
          <tr>
            {HEADER_LIST.map((header) => {
              const hyphenated = lowercaseHyphenate(header);
              const key = MAP_COL_TITLE_TO_OBJ_KEY[hyphenated];
              const findFn = (sortColumn: SortColumnWithDirection) =>
                sortColumn?.column === key;
              // console.log({key});
              const classes =
                queryStore.sortByColumnHistory.find(findFn)?.direction ??
                DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(findFn)
                  ?.direction ??
                "desc";
              return (
                <ScoreTableHeader
                  key={key}
                  title={header}
                  hyphenated={hyphenated}
                  classes={classes}
                  onClick$={
                    header === "Avatar" ? undefined : handleClickColumnHeader$
                  }
                />
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedScores.value.map((score) => (
            <ScoreRow size={size} key={score.id} score={score} />
          ))}
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
};
const ScoreTableHeader = component$<ScoreTableHeaderProps>(
  ({ title, hyphenated, onClick$, classes = "" }) => {
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
  },
);

const TIME_LABEL_COLOR: ClassList = "text-slate-300/100";

type GameTimeProps = { gameTimeDs: number };
const GameTime = component$<GameTimeProps>(({ gameTimeDs }) => {
  const { minutes, seconds, tenths } = formatTime(gameTimeDs);
  return (
    <>
      <span class={minutes > 0 ? "" : `text-xs ${TIME_LABEL_COLOR}`}>
        {String(minutes).padStart(2, "0")}
      </span>
      <span
        class={`${seconds > 0 ? "" : "text-xs"} mx-[1px] ${TIME_LABEL_COLOR}`}
      >
        m
      </span>
      <span>{String(seconds).padStart(2, "0")}</span>
      <span class={`text-xs ${TIME_LABEL_COLOR}`}>.{tenths}s</span>
    </>
  );
});

const ROW_BG_COLOR_ALPHA = 0.8;

const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

type ScoreRowProps = { score: ScoreWithPercentiles; size: Signal<number> };
const ScoreRow = component$<ScoreRowProps>(({ score, size }) => {
  const [dimensions, halfPixels] = (score.pixelData as string).split(":");
  const [cols, rows] = dimensions.split("x");
  return (
    <tr
      class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md text-white"
      style={{
        backgroundColor: generateBgAlpha(score.color as string),
      }}
    >
      <td class="flex justify-center" style={{ width: `${size.value + 2}px` }}>
        <PixelAvatar
          color={score.color as string}
          halfPixels={halfPixels}
          rows={Number(rows)}
          cols={Number(cols)}
          width={size.value}
          height={size.value}
          classes="pixel-avatar"
        />
      </td>
      <td>{score.initials}</td>
      <td>{score.deckSize}</td>
      <td>{score.pairs}</td>
      <td>
        <span class="block">
          <GameTime gameTimeDs={score.gameTimeDs} />
        </span>
        <span class="block">{score.timePercentile}%</span>
      </td>
      <td>
        <span class="block">{score.mismatches}</span>
        <span class="block">{score.mismatchPercentile}%</span>
      </td>
      <td>
        <CreatedAt createdAtMs={score.createdAt} />
      </td>
    </tr>
  );
});

type CreatedAtProps = { createdAtMs: number };
const CreatedAt: FunctionComponent<CreatedAtProps> = ({ createdAtMs }) => {
  const [date, time] = new Date(createdAtMs).toLocaleString().split(", ");
  return (
    <>
      <span class="block">{date}</span>
      <span class="block whitespace-nowrap">{time}</span>
    </>
  );
};
