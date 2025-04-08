import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import PixelAvatar from "~/v3/components/pixel-avatar/pixel-avatar";
import type { Score, ScoreCount } from "~/v3/db/schemas/types";
import serverDbService from "~/v3/services/db";
import runSeed from "~/v3/services/db/seed";

const DEFAULT_SCORES_PER_DECK_SIZE = 5_000;
const DEFAULT_TOTAL_DECK_SIZES = 24;

type Parameters = { totalDeckSizes: number; scoresPerDeckSize: number };
type ResponseObj = {
  status: number;
  body: {
    time: string;
    opts: Parameters;
  } & (
    | {
        finished: true;
        err: undefined;
      }
    | {
        finished: false;
        err: unknown;
      }
  );
};
export const serverRunSeed = server$(async (obj: Parameters) => {
  // create an obj from the query params

  const totalDeckSizes = Math.max(
    1,
    Math.min(Number(obj.totalDeckSizes), DEFAULT_TOTAL_DECK_SIZES),
  );
  const scoresPerDeckSize = Math.max(1, Number(obj.scoresPerDeckSize));

  const opts = {
    totalDeckSizes,
    scoresPerDeckSize,
  };

  const start = Date.now();
  // console.log({opts});

  try {
    await runSeed(opts);

    const end = Date.now();
    const differenceSeconds = (end - start) / 1000;

    console.log(`Finished: ${differenceSeconds} seconds`, {
      totalDeckSizes,
      scoresPerDeckSize,
    });

    return {
      status: 200,
      body: {
        time: differenceSeconds + " seconds",
        finished: true,
        opts,
      },
    } as ResponseObj;
  } catch (err) {
    const end = Date.now();
    const differenceSeconds = (end - start) / 1000;
    console.log(`FAILED: ${differenceSeconds} seconds`, {
      totalDeckSizes,
      scoresPerDeckSize,
    });
    return {
      status: 200,
      body: {
        time: differenceSeconds + " seconds",
        finished: false,
        opts,
        err,
      },
    } as ResponseObj;
  }
});

export const useParams = routeLoader$((requestEvent) => {
  if (process.env.FEATURE_FLAG_SCORES_DISABLED === "true") {
    return { message: "Scores disabled" };
  }

  const obj = Object.fromEntries(requestEvent.query.entries());

  return obj;
});

export default component$(() => {
  const params = useParams();
  console.log({ params: params.value });
  const totalDeckSizes = useSignal(
    !isNaN(Number(params.value.totalDeckSizes))
      ? Number(params.value.scoresPerDeckSize)
      : DEFAULT_TOTAL_DECK_SIZES,
  );
  const scoresPerDeckSize = useSignal(
    !isNaN(Number(params.value.scoresPerDeckSize))
      ? Number(params.value.scoresPerDeckSize)
      : DEFAULT_SCORES_PER_DECK_SIZE,
  );

  const status = useSignal<"waiting" | "running" | "finished" | "failed">(
    "waiting",
  );
  const clearSig = useSignal<"waiting" | "running" | "finished" | "failed">(
    "waiting",
  );
  const responseSig = useSignal<undefined | ResponseObj>(undefined);

  const queryResults = useSignal<Score[] | ScoreCount[]>();
  const fetchAllScores = $(async () => {
    queryResults.value = await serverDbService.scores.getAll();
  });

  const fetchAllScoreCounts = $(async () => {
    queryResults.value = await serverDbService.scoreCounts.getAll();
  });

  useTask$(({ track }) => {
    track(() => [scoresPerDeckSize.value, totalDeckSizes.value]);
    status.value = "waiting";
    clearSig.value = "waiting";
  });

  const runSeed$ = $(async () => {
    status.value = "running";
    const response = await serverRunSeed({
      totalDeckSizes: totalDeckSizes.value,
      scoresPerDeckSize: scoresPerDeckSize.value,
    });
    responseSig.value = response;

    if (response.body.err) {
      status.value = "failed";
      return;
    }
    status.value = "finished";
    return;
  });

  const clearDb$ = $(async () => {
    clearSig.value = "running";
    console.log("Clearing db...");
    try {
      await serverDbService.clearAllData();
      clearSig.value = "finished";
      console.log("db cleared!");
    } catch (err) {
      clearSig.value = "failed";
      console.log("error clearing DB:", err);
    }
  });

  const factor = 3;
  const size = 16 * factor;

  return (
    <div
      class="w-full h-auto max-h-[100vh] flex flex-col justify-start items-center gap-10"
      style={{
        scrollbarGutter: "stable",
        overflowY: "auto",
      }}
    >
      <div class="mt-4 mx-auto w-1/2 min-w-[20rem] grid justify-center gap-4">
        {params.value.message ? (
          <p>{params.value.message}</p>
        ) : (
          <>
            <div class="flex items-center justify-around">
              <button
                class="w-3/4 mx-auto p-2 rounded border border-slate-400 bg-slate-800"
                onClick$={runSeed$}
              >
                Run Seed
              </button>

              <button
                class="w-3/4 mx-auto p-2 rounded border border-slate-400 bg-slate-800"
                onClick$={clearDb$}
              >
                Clear DB
              </button>
            </div>
            {status.value === "running" ? (
              <p>Running...</p>
            ) : (
              status.value !== "waiting" && (
                <>
                  <p
                    onClick$={() => (status.value = "waiting")}
                    class="cursor-pointer"
                  >
                    {status.value === "finished"
                      ? "Completed!"
                      : status.value === "failed" && "Failed!"}
                  </p>
                  <pre>{JSON.stringify(responseSig.value, null, 2)}</pre>
                </>
              )
            )}

            {clearSig.value === "running" ? (
              <p>Clearing...</p>
            ) : clearSig.value === "failed" ? (
              <p
                onClick$={() => (clearSig.value = "waiting")}
                class="cursor-pointer"
              >
                Failed... check the console
              </p>
            ) : (
              clearSig.value !== "waiting" && <p>Completed!</p>
            )}

            <label class="p-4 w-full rounded-lg border border-slate-400 ">
              Total deck sizes:
              <input
                class="block bg-slate-400"
                name="totalDeckSizes"
                bind:value={totalDeckSizes}
                min={1}
                max={24}
                step={1}
              />
            </label>

            <label class="p-4 w-full rounded-lg border border-slate-400 ">
              Scores per deck size:
              <input
                class="block bg-slate-400"
                name="scoresPerDeckSize"
                bind:value={scoresPerDeckSize}
                min={1}
                max={5000}
                step={10}
              />
            </label>
          </>
        )}
      </div>

      <div class="grid gap-4 justify-center mx-auto mb-10 ">
        <div class="flex items-center gap-6">
          <button
            class="w-[320px] mx-auto p-2 rounded border border-slate-400 bg-slate-800"
            onClick$={fetchAllScores}
          >
            Fetch all scores
          </button>
          <button
            class="w-[320px] mx-auto p-2 rounded border border-slate-400 bg-slate-800"
            onClick$={fetchAllScoreCounts}
          >
            Fetch all scoreCounts
          </button>
        </div>
        <ul
          class={`mx-auto p-0 text-xs leading-5 ${
            queryResults.value &&
            queryResults.value[0] &&
            typeof (queryResults.value[0] as Score).initials !== "undefined"
              ? " [&>li:nth-child(odd)]:ml-[68px] [&>li:nth-child(even)]:gap-[84px]"
              : "max-w-[80%]"
          }`}
        >
          {queryResults.value &&
            queryResults.value[0] &&
            (typeof (queryResults.value[0] as Score).initials !== "undefined"
              ? (queryResults.value as Score[]).map((score) => (
                  <li
                    key={score.id}
                    class=" flex gap-4 items-center my-[-16px]"
                  >
                    <PixelAvatar
                      classes=""
                      width={size}
                      height={size}
                      hash={{ value: score.userId }}
                      colorFrom={{ value: score.initials }}
                    />
                    {JSON.stringify(score)
                      .replaceAll(",", ", ")
                      .replaceAll(":", ": ")
                      .replace("{", "{ ")
                      .replace("}", " }")}
                  </li>
                ))
              : (queryResults.value as ScoreCount[]).map((scoreCounts) => (
                  <li key={scoreCounts.id} class="my-4">
                    {JSON.stringify(scoreCounts)
                      .replaceAll(",", ", ")
                      .replaceAll(":", ": ")
                      .replace("{", "{ ")
                      .replace("}", " }")}
                  </li>
                )))}
        </ul>
      </div>
    </div>
  );
});
