import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";

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
  useVisibleTask$((taskCtx) => {
    const offsetWidth = taskCtx.track(
      () => (ref.value as HTMLElement).offsetWidth
    );
    console.log("track offsetWidth of ref:", offsetWidth);
  });
  useVisibleTask$((taskCtx) => {
    const offsetHeight = taskCtx.track(
      () => (ref.value as HTMLElement).offsetHeight
    );
    console.log("track offsetHeight of ref:", offsetHeight);
  });

  useVisibleTask$((taskCtx) => {
    const offsetHeight = taskCtx.track(
      () => (ref.value as HTMLElement).offsetHeight
    );
    const offsetWidth = taskCtx.track(
      () => (ref.value as HTMLElement).offsetWidth
    );
    console.log("COMBO: track offsetWidth && track offsetHeight of ref:", { offsetHeight, offsetWidth });
  });


  useVisibleTask$((taskCtx) => {
    const [ offsetHeight, offsetWidth ] = taskCtx.track(
      () => [(ref.value as HTMLElement).offsetHeight, (ref.value as HTMLElement).offsetWidth]
    );
    console.log("COMBO ARRAY: track [offsetWidth, offsetHeight] of ref:", { offsetHeight, offsetWidth });
  });



  /*
   * Track styleWidth/styleHeight
   * */
  useVisibleTask$((taskCtx) => {
    const styleWidth = taskCtx.track(
      () => (ref.value as HTMLElement).style.width
    );
    console.log("track styleWidth of ref:", styleWidth);
  });
  useVisibleTask$((taskCtx) => {
    const styleHeight = taskCtx.track(
      () => (ref.value as HTMLElement).style.height
    );
    console.log("track styleHeight of ref:", styleHeight);
  });

  /*
   * Track ref itself (assume it only changes on server render)
   * */
  useVisibleTask$((taskCtx) => {
    taskCtx.track(() => ref.value as HTMLElement);
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
