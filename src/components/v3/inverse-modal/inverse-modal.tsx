import {
  Slot,
  component$,
  useSignal,
  useStyles$,
  useStylesScoped$,
  useVisibleTask$,
} from "@builder.io/qwik";

export default component$(() => {
  useStylesScoped$(`
.game {
  transition: all 0.3s ease-in-out;
  perspective: 1000px;
}
.game.showing-settings {
  transform: scale(1.5) rotateY(90deg) translateX(150%);
  transform-origin: right;
}
.settings {

}
.settings.showing-settings {
}
`);

  const signal = useSignal(false);
  useVisibleTask$((taskCtx) => {
    const timer = setInterval(() => {
      signal.value = !signal.value;
    }, 3000);
    taskCtx.cleanup(() => {
      clearInterval(timer);
    });
  });
  return (
    <div class="w-full h-full">
      <div
        class={`game w-full h-full ${signal.value ? "showing-settings" : ""}`}
      >
        <Slot />
      </div>
      <div
        class={`settings w-full h-full ${
          signal.value ? "showing-settings" : ""
        }`}
      >
        Settings
      </div>
    </div>
  );
});
