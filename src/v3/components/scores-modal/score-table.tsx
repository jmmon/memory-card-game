import type { ClassList, FunctionComponent, Signal } from "@builder.io/qwik";
import { type QRL, component$, useTask$, useSignal } from "@builder.io/qwik";
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
  HEADER_UNSORTABLE,
} from "./constants";
import { formatTimeFromMs } from "~/v3/utils/formatTime";
import { lowercaseHyphenate } from "~/v3/utils/utils";
import { calculateOnlyColor } from "~/v3/utils/avatarUtils";

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
                sortColumn.column === key;
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

const ROW_BG_COLOR_ALPHA = 0.8;

const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

type ScoreRowProps = { score: ScoreWithPercentiles; size: Signal<number> };
const ScoreRow = component$<ScoreRowProps>(({ score, size }) => {
  // TODO: find another way?
  const backgroundColor = useSignal("");
  useTask$(async ({ track }) => {
    track(() => score.initials);
    backgroundColor.value = generateBgAlpha(
      await calculateOnlyColor(score.initials),
    );
    console.log({ backgroundColor: backgroundColor.value });
  });

  return (
    <>
      {backgroundColor.value === "" ? (
        <>...</>
      ) : (
        <tr
          class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md text-white"
          style={{
            backgroundColor: backgroundColor.value,
          }}
        >
          <td class="flex justify-center" style={{ width: `${size.value}px` }}>
            <PixelAvatar
              colorFrom={{ value: score.initials }}
              // halfPixels={halfPixels}
              hash={{ value: score.userId }}
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
      )}
    </>
  );
});

const TIME_LABEL_COLOR: ClassList = "text-slate-300/100";

type GameTimeProps = { gameTimeDs: number };
const GameTime = component$<GameTimeProps>(({ gameTimeDs }) => {
  const { minutes, seconds, ms } = formatTimeFromMs(gameTimeDs * 100);
  return (
    <>
      <span class={minutes > 0 ? "" : `text-xs ${TIME_LABEL_COLOR}`}>
        {String(minutes).padStart(2, "0")}
      </span>
      <span
        class={`${Number(seconds) > 0 ? "" : "text-xs"} mx-[1px] ${TIME_LABEL_COLOR}`}
      >
        m
      </span>
      <span>{seconds}</span>
      <span class={`text-xs ${TIME_LABEL_COLOR}`}>.{ms[0]}s</span>
    </>
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
