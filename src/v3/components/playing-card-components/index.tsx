import aceCard from "./generators/faces/ace-card";
import twoCard from "./generators/numbers/two-card";
import threeCard from "./generators/numbers/three-card";
import fourCard from "./generators/numbers/four-card";
import fiveCard from "./generators/numbers/five-card";
import sixCard from "./generators/numbers/six-card";
import sevenCard from "./generators/numbers/seven-card";
import eightCard from "./generators/numbers/eight-card";
import nineCard from "./generators/numbers/nine-card";
import tenCard from "./generators/numbers/ten-card";
import jackClubsCard from "./generators/faces/jack-clubs-card";
import jackSpadesCard from "./generators/faces/jack-spades-card";
import jackDiamondsCard from "./generators/faces/jack-diamonds-card";
import jackHeartsCard from "./generators/faces/jack-hearts-card";
import queenClubsCard from "./generators/faces/queen-clubs-card";
import queenSpadesCard from "./generators/faces/queen-spades-card";
import queenDiamondsCard from "./generators/faces/queen-diamonds-card";
import queenHeartsCard from "./generators/faces/queen-hearts-card";
import kingClubsCard from "./generators/faces/king-clubs-card";
import kingSpadesCard from "./generators/faces/king-spades-card";
import kingDiamondsCard from "./generators/faces/king-diamonds-card";
import kingHeartsCard from "./generators/faces/king-hearts-card";

const cards: { [key: string]: any } = {
  AC: aceCard({ symbol: "clubs" }),
  AS: aceCard({ symbol: "spades" }),
  AD: aceCard({ symbol: "diamonds" }),
  AH: aceCard({ symbol: "hearts" }),

  "2C": twoCard({ symbol: "clubs" }),
  "2S": twoCard({ symbol: "spades" }),
  "2D": twoCard({ symbol: "diamonds" }),
  "2H": twoCard({ symbol: "hearts" }),

  "3C": threeCard({ symbol: "clubs" }),
  "3S": threeCard({ symbol: "spades" }),
  "3D": threeCard({ symbol: "diamonds" }),
  "3H": threeCard({ symbol: "hearts" }),

  "4C": fourCard({ symbol: "clubs" }),
  "4S": fourCard({ symbol: "spades" }),
  "4D": fourCard({ symbol: "diamonds" }),
  "4H": fourCard({ symbol: "hearts" }),

  "5C": fiveCard({ symbol: "clubs" }),
  "5S": fiveCard({ symbol: "spades" }),
  "5D": fiveCard({ symbol: "diamonds" }),
  "5H": fiveCard({ symbol: "hearts" }),

  "6C": sixCard({ symbol: "clubs" }),
  "6S": sixCard({ symbol: "spades" }),
  "6D": sixCard({ symbol: "diamonds" }),
  "6H": sixCard({ symbol: "hearts" }),

  "7C": sevenCard({ symbol: "clubs" }),
  "7S": sevenCard({ symbol: "spades" }),
  "7D": sevenCard({ symbol: "diamonds" }),
  "7H": sevenCard({ symbol: "hearts" }),

  "8C": eightCard({ symbol: "clubs" }),
  "8S": eightCard({ symbol: "spades" }),
  "8D": eightCard({ symbol: "diamonds" }),
  "8H": eightCard({ symbol: "hearts" }),

  "9C": nineCard({ symbol: "clubs" }),
  "9S": nineCard({ symbol: "spades" }),
  "9D": nineCard({ symbol: "diamonds" }),
  "9H": nineCard({ symbol: "hearts" }),

  "0C": tenCard({ symbol: "clubs" }),
  "0S": tenCard({ symbol: "spades" }),
  "0D": tenCard({ symbol: "diamonds" }),
  "0H": tenCard({ symbol: "hearts" }),

  JC: jackClubsCard(),
  JS: jackSpadesCard(),
  JD: jackDiamondsCard(),
  JH: jackHeartsCard(),

  QC: queenClubsCard(),
  QS: queenSpadesCard(),
  QD: queenDiamondsCard(),
  QH: queenHeartsCard(),

  KC: kingClubsCard(),
  KS: kingSpadesCard(),
  KD: kingDiamondsCard(),
  KH: kingHeartsCard(),
} as const;

export default cards;
