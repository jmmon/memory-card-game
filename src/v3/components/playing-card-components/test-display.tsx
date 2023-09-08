import { component$ } from "@builder.io/qwik";
import AceCard from "./faces/ace-card";
import TwoCard from "./numbers/two-card";
import ThreeCard from "./numbers/three-card";
import JackClubsCard from "./faces/jack-clubs-card";
import JackDiamondsCard from "./faces/jack-diamonds-card";
import JackHeartsCard from "./faces/jack-hearts-card";
import JackSpadesCard from "./faces/jack-spades-card";
import QueenSpadesCard from "./faces/queen-spades-card";
import QueenClubsCard from "./faces/queen-clubs-card";
import QueenHeartsCard from "./faces/queen-hearts-card";
import KingHeartsCard from "./faces/king-hearts-card";

export default component$(() => {
return (
<div class="flex w-full h-[50%] gap-0.5">
<AceCard color="black" symbol="clubs" />
<AceCard color="black" symbol="spades" />
<TwoCard color="black" symbol="clubs" />
<ThreeCard color="red" symbol="diamonds" />
<JackClubsCard />
<JackDiamondsCard />
<JackHeartsCard />
<JackSpadesCard />
<QueenSpadesCard />
<QueenClubsCard />
<QueenHeartsCard />
<KingHeartsCard />
</div>
);
});
