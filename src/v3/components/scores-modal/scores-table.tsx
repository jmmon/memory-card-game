import {
  $,
  PropFunction,
  QwikMouseEvent,
  component$,
  useContext,
  useSignal,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import Modal from "../modal/modal";
import { GameContext } from "~/v3/context/gameContext";
import { Score } from "~/v3/db/types";
import PixelAvatar from "../pixel-avatar/pixel-avatar";
import serverDbService from "~/v3/services/db.service";
import { truncateMs } from "~/v3/utils/formatTime";
import { ScoreWithPercentiles } from "~/v3/types/types";
import Tabulation from "../tabulation//tabulation";
type DeckSizesDictionary = { [key: string]: Score[] };

const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z";
const DATE_JAN_1_1970 = new Date(JAN_1_1970_STRING);

const PIXEL_AVATAR_SIZE = 44;

const mapColTitleToObjKey: { [key: string]: string } = {
  initials: "initials",
  "deck-size": "deckSize",
  pairs: "pairs",
  "game-time": "timePercentile",
  mismatches: "mismatchPercentile",
  date: "createdAt",
};

const sortFunctions: {
  [key: string]: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => number;
} = {
  initials: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.initials as string) ?? "").localeCompare(
      (a.initials as string) ?? ""
    );
    return value;
  },
  deckSize: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.deckSize as number) ?? 0) - ((a.deckSize as number) ?? 0);
    return value;
  },
  pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.pairs as number) ?? 0) - ((a.pairs as number) ?? 0);
    return value;
  },
  timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      ((b.timePercentile as number) ?? 0) - ((a.timePercentile as number) ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      ((b.mismatchPercentile as number) ?? 0) -
      ((a.mismatchPercentile as number) ?? 0);
    return value;
  },
  createdAt: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.createdAt ?? DATE_JAN_1_1970).getTime() -
      (a.createdAt ?? DATE_JAN_1_1970).getTime();
    return value;
  },
};

/*
*
 * this component will render a table for the given deckSize (or for ALL deckSizes)
 * */
export default component$(({ deckSize }: { deckSize?: number }) => {
  const gameContext = useContext(GameContext);
  const isLoading = useSignal(true);

  const sortDirection = useSignal<"asc" | "desc">("desc");
  const sortColumnHistory = useSignal<string[]>([
    "deckSize",
    "timePercentile",
    "mismatchPercentile",
  ]);

  const sortedScores = useSignal<ScoreWithPercentiles[]>([]);


  const handleClickColumnHeader = $(async (e: QwikMouseEvent) => {
    isLoading.value = true;
    console.log({ e });
    const clickedDataAttr = (e.target as HTMLButtonElement).dataset[
      "sortColumn"
    ] as string;

    // tweak some words to match the object keys
    const clickedColumnTitle = mapColTitleToObjKey[clickedDataAttr];

    // console.log({
    //   clickedDataAttr,
    //   clickedColumnTitle,
    //   mapColTitleToObjKey,
    // });

    if (sortColumnHistory.value[0] === clickedColumnTitle) {
      console.log("clicked the same column, switching direction");
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      console.log("clicked different column, changing column");
      sortColumnHistory.value = [
        clickedColumnTitle,
        ...sortColumnHistory.value,
      ].slice(0, 3);
      console.log({ sortColumnHistory: sortColumnHistory.value });
      sortDirection.value = "desc";
    }

    // resort:
    sortedScores.value = await sortScores(
      gameContext.interface.scoresModal.scores
    );
    isLoading.value = false;
  });

  const dictionarySignal = useSignal<DeckSizesDictionary>({});

  useTask$(async ({ track }) => {
    track(() => gameContext.interface.scoresModal.isShowing);
    if (!gameContext.interface.scoresModal.isShowing) return;

    const { scores, dictionary } = calculatePercentiles(
      await serverDbService.getAllScores()
    );
    gameContext.interface.scoresModal.scores = scores;
    dictionarySignal.value = dictionary;

    console.log({ scores: gameContext.interface.scoresModal.scores });

    sortedScores.value = await sortScores(
      gameContext.interface.scoresModal.scores
    );
    console.log({ sortedScores: sortedScores.value });

    isLoading.value = false;
    console.log("done loading");
  });

  useStyles$(`
  table {
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


  table.scoreboard > thead.asc  {
    --gradiant-start: var(--gradiant-dark);
    --gradiant-end: var(--gradiant-light);
  }
  table.scoreboard > thead.desc  {
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
  `);

  const headersList = [
    "Avatar",
    "Initials",
    "Deck Size",
    "Pairs",
    "Game Time",
    "Mismatches",
    "Date",
  ];

  return (
      <table class="scoreboard w-full max-w-[25rem] max-h-[90vh]">
        <thead
          class={`${sortDirection.value} text-xs sm:text-sm md:text-md bg-slate-500`}
        >
          <tr>
            {headersList.map((header) => {
              const hyphenated = header.toLowerCase().replace(" ", "-");
              return (
                <ScoreTableHeader
                  key={hyphenated}
                  title={header}
                  hyphenated={hyphenated}
                  onClick$={
                    header === "Avatar" ? undefined : handleClickColumnHeader
                  }
                />
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedScores.value.map((score) => (
            <ScoreRow key={score.userId} score={score} />
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



const TIME_LABEL_COLOR = "text-slate-300";
const GameTime = component$(({ gameTime }: { gameTime: string }) => {
  const [hours, minutes, seconds] = gameTime.split(":").map((n) => Number(n));
  const haveHours = hours !== 0;
  const haveMinutes = minutes !== 0;
  const [truncSeconds, ms] = String(seconds).split(".");
  const limitedMs = truncateMs(Number(ms ?? 0), 3);

  return (
    <>
      {haveHours ? (
        <>
          <span>{hours}</span>
          <span class={TIME_LABEL_COLOR}>h</span>
        </>
      ) : (
        ""
      )}

      {haveMinutes ? (
        <>
          {haveHours ? (
            <span class="ml-1">{String(minutes).padStart(2, "0")}</span>
          ) : (
            <span>{minutes}</span>
          )}
          <span class={TIME_LABEL_COLOR}>m</span>
        </>
      ) : (
        ""
      )}

      <>
        {haveMinutes ? (
          <span class="ml-1">{truncSeconds.padStart(2, "0")}</span>
        ) : (
          <span>{Number(truncSeconds)}</span>
        )}
        <span class={`text-xs ${TIME_LABEL_COLOR}`}>{limitedMs}s</span>
      </>
    </>
  );
});

const timestampToMs = (time: string) => {
  const [hours, minutes, seconds] = time.split(":").map((n) => Number(n));
  return (
    Number(hours) * 60 * 60 * 1000 +
    Number(minutes) * 60 * 1000 +
    Number(seconds) * 1000
  );
};

const ROW_BG_COLOR_ALPHA = 0.8;
const generateBgAlpha = (color: string) =>
  color.slice(0, -2) + `${ROW_BG_COLOR_ALPHA})`;

const ScoreRow = component$(({ score }: { score: ScoreWithPercentiles }) => {
  // console.log({ score });

  return (
    <tr
      class="w-full h-full border border-slate-900 rounded-lg text-xs sm:text-sm md:text-md"
      style={{
        backgroundColor: generateBgAlpha(score.color as string),
      }}
    >
      <td
        class="flex justify-center"
        style={{ width: `${PIXEL_AVATAR_SIZE}px` }}
      >
        <PixelAvatar
          color={score.color as string}
          pixels={score.pixels as string}
          width={PIXEL_AVATAR_SIZE}
          height={PIXEL_AVATAR_SIZE}
          classes="border border-gray-100"
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
