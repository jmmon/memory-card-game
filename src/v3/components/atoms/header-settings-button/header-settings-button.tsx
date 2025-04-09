import { component$, useSignal, useStyles$ } from "@builder.io/qwik";
import Button from "../button/button";
import { useGameContextService } from "~/v3/services/gameContext.service/gameContext.service";
import { useDebouncer$ } from "~/v3/hooks/useDebounce2";

type HeaderSettingsIconProps = {
  isOpen?: boolean;
};
export default component$<HeaderSettingsIconProps>(() => {
  const ctx = useGameContextService();
  useStyles$(`
    .bar-1, .bar-2, .bar-3 {
      transition: all 200ms ease-in-out;
      transform: none;
    }
    .settings-button.open .bar-1 {
      transform: rotate(45deg) scaleX(1.414);
      transform-origin: left;
    }
    .settings-button.open .bar-2 {
      transform: rotate(-45deg) scaleX(1.414);
      transform-origin: center;
    }
    .settings-button.open .bar-3 {
      transform: translateY(4px) rotate(45deg) scaleX(1.414);
      transform-origin: right;
      opacity: 0.3;
    }

    .settings-button:not(.open):focus .bar-1,
    .settings-button:not(.open):hover .bar-1 {
      transform: rotate(6deg) scaleX(1.06);
      transform-origin: left;
    }
    .settings-button:not(.open):focus .bar-2,
    .settings-button:not(.open):hover .bar-2 {
      transform: rotate(-6deg) scaleX(1.06);
      transform-origin: center;
    }
    .settings-button:not(.open):focus .bar-3,
    .settings-button:not(.open):hover .bar-3 {
      transform: translateY(1px) rotate(6deg) scaleX(1.06);
      transform-origin: right;
      opacity: 0.90;
    }
  `);

  const ref = useSignal<HTMLButtonElement>();
  const debounceUnfocus = useDebouncer$(() => {
    ref.value?.blur();
  }, 500);

  return (
    <Button
      buttonRef={ref}
      onClick$={() => {
        debounceUnfocus();
        ctx.state.interfaceSettings.settingsModal.isShowing
          ? ctx.handle.hideSettings()
          : ctx.handle.showSettings();
      }}
      classes={`p-[0.5em] my-auto text-[1.2em] sm:text-[1.5em] h-min settings-button ${ctx.state.interfaceSettings.settingsModal.isShowing ? "open bg-slate-800 border-slate-300 hover-bg-slate-700" : ""}`}
    >
      <div class={`bar-icon grid gap-[calc(calc(1.2em-6px)/2)]`}>
        <div class="bar-1 bg-slate-300 rounded-full w-[1.2em] h-[2px] " />
        <div class="bar-2 bg-slate-300 rounded-full w-[1.2em] h-[2px] " />
        <div class="bar-3 bg-slate-300 rounded-full w-[1.2em] h-[2px] " />
      </div>
    </Button>
  );
});
