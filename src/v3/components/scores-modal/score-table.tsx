import { PropFunction, QwikMouseEvent, Signal, component$ } from "@builder.io/qwik";
import { ScoreWithPercentiles, SortColumnWithDirection } from "~/v3/types/types";
import { truncateMs } from "~/v3/utils/formatTime";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import {
  DATE_JAN_1_1970,
  DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY,
  HEADER_LIST,
  MAP_COL_TITLE_TO_OBJ_KEY,
  QueryStore
} from "./scores-modal";

const hyphenateTitle = (text: string) => text.toLowerCase().replace(" ", "-");

export default component$(({
  queryStore,
  handleClickColumnHeader$,
  sortedScores,
  size,
}: {
  queryStore: QueryStore;
  handleClickColumnHeader$: PropFunction<(e: QwikMouseEvent) => void>;
  sortedScores: Signal<ScoreWithPercentiles[]>
  size: Signal<number>
}) => {
  return (<table
    q: slot="scoreboard-tab0"
    class="scoreboard w-full "
  >
    <thead class={` text-xs sm:text-sm md:text-md bg-slate-500`}>
      <tr>
        {HEADER_LIST.map((header) => {
          const hyphenated = hyphenateTitle(header);
          const key = MAP_COL_TITLE_TO_OBJ_KEY[hyphenated];
          // const findFn = ({ column }: SortColumnWithDirection) => column === key;
          // console.log({key});
          const classes = queryStore.sortByColumnHistory.find(
            ({ column }: SortColumnWithDirection) => column === key
          )?.direction ??
            (
              DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY.find(
                ({ column }: SortColumnWithDirection) => column === key
              )?.direction ??
              "desc"
            )
          return (
            <ScoreTableHeader
              key={hyphenated}
              title={header}
              hyphenated={hyphenated}
              classes={classes}
              onClick$={
                header === "Avatar"
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
});

const ScoreTableHeader = component$(
  ({
    title,
    hyphenated,
    onClick$,
    classes = "",
  }: {
    title: string;
    hyphenated: string;
    onClick$?: PropFunction<(e: QwikMouseEvent) => void>;
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
  }
);

const TIME_LABEL_COLOR = "text-slate-300/90";

const GameTime = component$(({ gameTime }: { gameTime: string }) => {
  let [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  if (haveHours) minutes += hours * 60;
  const haveMinutes = minutes !== 0;
  // pad seconds so we can get full 3 digit milliseconds
  const [truncSeconds, ms] = String(seconds.toFixed(3)).split(".");
  const limitedMs = truncateMs(Number(ms ?? 0), 1);

  return (
    <>
      <span class={haveMinutes ? '' : `text-xs ${TIME_LABEL_COLOR}`}>{String(minutes).padStart(2, "0")}</span>
      <span class={`${haveMinutes ? '' : 'text-xs'} mx-[1px] ${TIME_LABEL_COLOR}`}>m</span>
      <span>{String(truncSeconds).padStart(2, "0")}</span>
      <span class={`text-xs ${TIME_LABEL_COLOR}`}>{String(limitedMs)}s</span>
    </>
  );
});

const ROW_BG_COLOR_ALPHA = 0.8;
const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

const ScoreRow = component$(({ score, size }: { score: ScoreWithPercentiles, size: Signal<number> }) => {
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
          pixels={score.pixels as string}
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
