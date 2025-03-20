import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import HEAD_CONSTANTS from "~/v3/constants/head";

/* 
* Track Experiments
* - tracking refs and ref properties
*
*   Results: NOT possible to track ref.value.offsetWidth etc, ref.value.style.width
*
* */
export default component$(() => {
  const ref = useSignal<HTMLElement>();

  /*
   * Track offsetWidth/offsetHeight
   * */
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const offsetWidth = track(
      () => (ref.value as HTMLElement).offsetWidth
    );
    console.log("track offsetWidth of ref:", offsetWidth);
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const offsetHeight = track(
      () => (ref.value as HTMLElement).offsetHeight
    );
    console.log("track offsetHeight of ref:", offsetHeight);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const offsetHeight = track(
      () => (ref.value as HTMLElement).offsetHeight
    );
    const offsetWidth = track(
      () => (ref.value as HTMLElement).offsetWidth
    );
    console.log("COMBO: track offsetWidth && track offsetHeight of ref:", { offsetHeight, offsetWidth });
  });


  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const [offsetHeight, offsetWidth] = track(
      () => [(ref.value as HTMLElement).offsetHeight, (ref.value as HTMLElement).offsetWidth]
    );
    console.log("COMBO ARRAY: track [offsetWidth, offsetHeight] of ref:", { offsetHeight, offsetWidth });
  });



  /*
   * Track styleWidth/styleHeight
   * */
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const styleWidth = track(
      () => (ref.value as HTMLElement).style.width
    );
    console.log("track styleWidth of ref:", styleWidth);
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const styleHeight = track(
      () => (ref.value as HTMLElement).style.height
    );
    console.log("track styleHeight of ref:", styleHeight);
  });

  /*
   * Track ref itself (assume it only changes on server render)
   * */
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => ref.value as HTMLElement);
    console.log("track ref itself:", ref.value);
  });

  const changeDimension = $((newVal: number, dimension: "width" | "height") => {
    (ref.value as HTMLElement).style[dimension] = newVal + "px";
  });

  return (
    <div class="w-full h-full">
      <h1 class="text-2xl">Task testing</h1>
      <p>Tracking multiple things</p>
      <p>Tracking properties of a ref</p>
      <div style={{ width: "100px", height: "100px", background: 'red' }} ref={ref}></div>
      <div>
        <button
          onClick$={() =>
            changeDimension(
              (ref.value as HTMLElement).offsetWidth + 10,
              "width"
            )
          }
        >
          Inc width
        </button>
        <button
          onClick$={() =>
            changeDimension(
              (ref.value as HTMLElement).offsetWidth - 10,
              "width"
            )
          }
        >
          Dec width
        </button>
      </div>
      <div>
        <button
          onClick$={() =>
            changeDimension(
              (ref.value as HTMLElement).offsetHeight + 10,
              "height"
            )
          }
        >
          Inc height
        </button>
        <button
          onClick$={() =>
            changeDimension(
              (ref.value as HTMLElement).offsetHeight - 10,
              "height"
            )
          }
        >
          Dec height
        </button>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: `Task testing - ${HEAD_CONSTANTS.SITE_NAME} - ${HEAD_CONSTANTS.SITE_HOST}`,
  meta: [
    {
      name: "description",
      content: "Prototype game v2.5 - testing Tasks tracking",
    },
  ],
};
