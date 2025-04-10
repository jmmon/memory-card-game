import { useVisibleTask$ } from "@builder.io/qwik";

import type { QRL } from "@builder.io/qwik";

export type UseVisibilityChangeProps = {
  onHidden$?: QRL<() => void>;
  onShown$?: QRL<() => void>;
  onChange$?: QRL<() => void>;
};

/* ============================
 * pause game when switching tabs
 * - set up listeners
 * ============================ */
export const useVisibilityChange = ({
  onHidden$,
  onShown$,
  onChange$,
}: UseVisibilityChangeProps) => {
  // TODO: switch to useOnDocument? could set up all the events regardless of browser
  // - only the correct ones will fire, since only certain ones exist in certain browsers
  // - what if two fire? might want to figure out how to handle that, debounce or something?
  //
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    let hidden = "hidden";
    let state = 0;

    // Standards:
    if (hidden in document) {
      document.addEventListener("visibilitychange", _onchange);
      state = 1;
    } else if ((hidden = "mozHidden") in document) {
      document.addEventListener("mozvisibilitychange", _onchange);
      state = 2;
    } else if ((hidden = "webkitHidden") in document) {
      document.addEventListener("webkitvisibilitychange", _onchange);
      state = 3;
    } else if ((hidden = "msHidden") in document) {
      document.addEventListener("msvisibilitychange", _onchange);
      state = 4;
    }
    // IE 9 and lower:
    else if ("onfocusin" in document) {
      (document as Document & { onfocusin: any; onfocusout: any }).onfocusin = (
        document as Document & { onfocusin: any; onfocusout: any }
      ).onfocusout = _onchange;
      state = 5;
    }
    // All others:
    else {
      window.onpageshow =
        window.onpagehide =
        window.onfocus =
        window.onblur =
          _onchange;
    }

    function _onchange(evt: any) {
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
        document.body.dataset["visibilitychange"] = evtMap[evt.type];
      } else {
        // @ts-ignore
        document.body.dataset["visibilitychange"] = this[hidden]
          ? "hidden"
          : "visible";
      }

      if (document.body.dataset["visibilitychange"] === "hidden") {
        if (onHidden$) onHidden$();
      } else {
        if (onShown$) onShown$();
      }
      // runs every function run
      if (onChange$) onChange$();
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if ((document as Document & { [key: string]: any })[hidden] !== undefined) {
      _onchange({
        type: (document as Document & { [key: string]: any })[hidden]
          ? "blur"
          : "focus",
      });
    }

    cleanup(() => {
      if (state === 1) {
        document.removeEventListener("visibilitychange", _onchange);
      } else if (state === 2) {
        document.removeEventListener("mozvisibilitychange", _onchange);
      } else if (state === 3) {
        document.removeEventListener("webkitvisibilitychange", _onchange);
      } else if (state === 4) {
        document.removeEventListener("msvisibilitychange", _onchange);
      } else if (state === 5) {
        (document as Document & { onfocusin: any }).onfocusin = (
          document as Document & { onfocusout: any }
        ).onfocusout = null;
      } else if (state === 0) {
        window.onpageshow =
          window.onpagehide =
          window.onfocus =
          window.onblur =
            null;
      }
    });
  });
};
