import type { Signal } from "@builder.io/qwik";
import { type QRL, component$ } from "@builder.io/qwik";
import type { ScoreWithPercentiles } from "~/v3/types/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import type { QueryStore } from "./scores-modal";
import {
  DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY,
  HEADER_LIST,
  JAN_1_1970_STRING,
  MAP_COL_TITLE_TO_OBJ_KEY,
} from "./scores-modal";

const hyphenateTitle = (text: string) => text.toLowerCase().replace(" ", "-");

export default component$(
  ({
    queryStore,
    handleClickColumnHeader$,
    sortedScores,
    size,
  }: {
    queryStore: QueryStore;
    handleClickColumnHeader$: QRL<(e: MouseEvent) => void>;
    sortedScores: Signal<ScoreWithPercentiles[]>;
    size: Signal<number>;
  }) => {
    return (
      <table q:slot="scoreboard-tab0" class="scoreboard w-full ">
        <thead class={` text-xs sm:text-sm md:text-md bg-slate-500`}>
          <tr>
            {HEADER_LIST.map((header) => {
              const hyphenated = hyphenateTitle(header);
              const key = MAP_COL_TITLE_TO_OBJ_KEY[hyphenated];
              // const findFn = ({ column }: SortColumnWithDirection) => column === key;
              // console.log({key});
              const classes =
                queryStore.sortByColumnHistory.find(
                  ({ column }) => column === key,
                )?.direction ??
                DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(
                  ({ column }) => column === key,
                )?.direction ??
                "desc";
              return (
                <ScoreTableHeader
                  key={hyphenated}
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

const ScoreTableHeader = component$(
  ({
    title,
    hyphenated,
    onClick$,
    classes = "",
  }: {
    title: string;
    hyphenated: string;
    onClick$?: QRL<(e: MouseEvent) => void>;
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
  },
);

const TIME_LABEL_COLOR = "text-slate-300/90";

const GameTime = component$(({ gameTime }: { gameTime: number }) => {
  const [seconds, ms] = String(gameTime)
    .split(".")
    .map((n) => Number(n));
  const minutes = Math.floor(seconds / 60);
  const haveMinutes = minutes !== 0;
  return (
    <>
      <span class={haveMinutes ? "" : `text-xs ${TIME_LABEL_COLOR}`}>
        {String(minutes).padStart(2, "0")}
      </span>
      <span
        class={`${haveMinutes ? "" : "text-xs"} mx-[1px] ${TIME_LABEL_COLOR}`}
      >
        m
      </span>
      <span>{String(seconds).padStart(2, "0")}</span>
      <span class={`text-xs ${TIME_LABEL_COLOR}`}>{String(ms)}s</span>
    </>
  );
});

const ROW_BG_COLOR_ALPHA = 0.8;
const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

const ScoreRow = component$(
  ({ score, size }: { score: ScoreWithPercentiles; size: Signal<number> }) => {
    const [dimensions, halfPixels] = (score.pixelData as string).split(":");
    const [cols, rows] = dimensions.split("x");
    return (
      <tr
        class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md text-white"
        style={{
          backgroundColor: generateBgAlpha(score.color as string),
        }}
      >
        <td
          class="flex justify-center"
          style={{ width: `${size.value + 2}px` }}
        >
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
          <span class="block">{score.timePercentile}%</span>
          <span class="block">
            <GameTime gameTime={score.gameTime} />
          </span>
        </td>
        <td>
          <span class="block">{score.mismatchPercentile}%</span>
          <span class="block">{score.mismatches}</span>
        </td>
        <td>
          <CreatedAt createdAt={score.createdAt ?? JAN_1_1970_STRING} />
        </td>
      </tr>
    );
  },
);

const CreatedAt = ({ createdAt }: { createdAt: string }) => {
  const [date, time] = new Date(createdAt).toLocaleString().split(", ");
  return (
    <>
      <span class="block">{date}</span>
      <span class="block whitespace-nowrap">{time}</span>
    </>
  );
};
