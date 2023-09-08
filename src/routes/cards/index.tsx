import { component$ } from "@builder.io/qwik";
import PlayingCardComponents from "~/v3/components/playing-card-components";
import CardSymbols from "~/v3/components/playing-card-components/card-symbols";
import FaceCardSymbols from "~/v3/components/playing-card-components/face-card-symbols";

export default component$(() => {
  return (
    <div
      class="mx-auto h-screen flex flex-wrap justify-center"
      style={{ overflowY: "scroll" }}
    >
      {Object.values(PlayingCardComponents)
        .reverse()
        .map((card, i) => (
          <div
            key={i}
            style={{ width: "14%", minWidth: "250px" }}
            dangerouslySetInnerHTML={card}
          ></div>
        ))}
      <CardSymbols />
      <FaceCardSymbols />
    </div>
  );
});
