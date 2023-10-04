import { $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";

type UseWatchWindowFocusProps = {
  onHidden: QRL<(...args: any[]) => any>;
  onVisible: QRL<(...args: any[]) => any>;
};

const DEFAULT_OPTS = {
  onHidden: undefined,
  onVisible: undefined,
};

export const useWatchWindowFocus = function(
  props: Partial<UseWatchWindowFocusProps>
) {
  const isVisible = useSignal(true);
  const opts = { ...DEFAULT_OPTS, ...props };

  // const windowSize = useStore<WindowSize>({ ...opts, ...DEFAULT_OPTS });

  useVisibleTask$(({ cleanup }) => {
    // console.log("useWatchWindowFocus: setup");
    let hidden = "hidden";
    let state = 0;
    let docEl = document as Document & {
      [key: string]: any;
      onfocusin: any;
      onfocusout: any;
    };

    // Standards:
    if (hidden in docEl) {
      docEl.addEventListener("visibilitychange", onchange);
      state = 1;
    } else if ((hidden = "mozHidden") in docEl) {
      docEl.addEventListener("mozvisibilitychange", onchange);
      state = 2;
    } else if ((hidden = "webkitHidden") in docEl) {
      docEl.addEventListener("webkitvisibilitychange", onchange);
      state = 3;
    } else if ((hidden = "msHidden") in docEl) {
      docEl.addEventListener("msvisibilitychange", onchange);
      state = 4;
    }
    // IE 9 and lower:
    else if ("onfocusin" in docEl) {
      docEl.onfocusin = docEl.onfocusout = onchange;
      state = 5;
    }
    // All others:
    else {
      state = 0;
      window.onpageshow =
        window.onpagehide =
        window.onfocus =
        window.onblur =
        onchange;
    }

    function onchange(this: any, evt: any) {
      // console.log("useWatchWindowFocus: onchange runs", { evt });
      const v = "visible",
        h = "hidden",
        evtMap: { [key: string]: string } = {
          focus: v,
          focusin: v,
          pageshow: v,
          blur: h,
          focusout: h,
          pagehide: h,
        };

      evt = evt || window.event;

      if (evt.type in evtMap) {
        docEl.body.dataset["visibilitychange"] = evtMap[evt.type];
      } else {
        docEl.body.dataset["visibilitychange"] = this[hidden]
          ? "hidden"
          : "visible";
      }

      // save the new state, in case an outsider wants to watch it for changes
      isVisible.value = docEl.body.dataset["visibilitychange"] === "visible";

      // alternate: call a function, so we don't need to track state outside
      // console.log({opts});
      if (docEl.body.dataset["visibilitychange"] === "visible") {
        opts.onVisible?.();
      } else {
        opts.onHidden?.();
      }
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if (docEl[hidden] !== undefined) {
      onchange({
        type: docEl[hidden] ? "blur" : "focus",
      });
    }

    cleanup(() => {
      // console.log("useWatchWindowFocus: cleanup");
      if (state === 1) {
        docEl.removeEventListener("visibilitychange", onchange);
      } else if (state === 2) {
        docEl.removeEventListener("mozvisibilitychange", onchange);
      } else if (state === 3) {
        docEl.removeEventListener("webkitvisibilitychange", onchange);
      } else if (state === 4) {
        docEl.removeEventListener("msvisibilitychange", onchange);
      } else if (state === 5) {
        docEl.onfocusin = docEl.onfocusout = null;
      } else if (state === 0) {
        window.onpageshow =
          window.onpagehide =
          window.onfocus =
          window.onblur =
          null;
      }
    });
  });

  return isVisible;
};
