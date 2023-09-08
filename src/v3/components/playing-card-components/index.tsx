import aceCard from "./faces/ace-card";
import twoCard from "./numbers/two-card";
import threeCard from "./numbers/three-card";
import fourCard from "./numbers/four-card";
import fiveCard from "./numbers/five-card";
import sixCard from "./numbers/six-card";
import sevenCard from "./numbers/seven-card";
import eightCard from "./numbers/nine-card";
import nineCard from "./numbers/eight-card";
import tenCard from "./numbers/ten-card";
import jackClubsCard from "./faces/jack-clubs-card";
import jackSpadesCard from "./faces/jack-spades-card";
import jackDiamondsCard from "./faces/jack-diamonds-card";
import jackHeartsCard from "./faces/jack-hearts-card";
import queenClubsCard from "./faces/queen-clubs-card";
import queenSpadesCard from "./faces/queen-spades-card";
import queenDiamondsCard from "./faces/queen-diamonds-card";
import queenHeartsCard from "./faces/queen-hearts-card";
import kingClubsCard from "./faces/king-clubs-card";
import kingSpadesCard from "./faces/king-spades-card";
import kingDiamondsCard from "./faces/king-diamonds-card";
import kingHeartsCard from "./faces/king-hearts-card";

const cards: { [key: string]: any } = {
  AC: aceCard({ color: "black", symbol: "clubs" }),
  AS: aceCard({ color: "black", symbol: "spades" }),
  AD: aceCard({ color: "red", symbol: "diamonds" }),
  AH: aceCard({ color: "red", symbol: "hearts" }),
  "2C": twoCard({ color: "black", symbol: "clubs" }),
  "2S": twoCard({ color: "black", symbol: "spades" }),
  "2D": twoCard({ color: "red", symbol: "diamonds" }),
  "2H": twoCard({ color: "red", symbol: "hearts" }),
  "3C": threeCard({ color: "black", symbol: "clubs" }),
  "3S": threeCard({ color: "black", symbol: "spades" }),
  "3D": threeCard({ color: "red", symbol: "diamonds" }),
  "3H": threeCard({ color: "red", symbol: "hearts" }),
  "4C": fourCard({ color: "black", symbol: "clubs" }),
  "4S": fourCard({ color: "black", symbol: "spades" }),
  "4D": fourCard({ color: "red", symbol: "diamonds" }),
  "4H": fourCard({ color: "red", symbol: "hearts" }),
  "5C": fiveCard({ color: "black", symbol: "clubs" }),
  "5S": fiveCard({ color: "black", symbol: "spades" }),
  "5D": fiveCard({ color: "red", symbol: "diamonds" }),
  "5H": fiveCard({ color: "red", symbol: "hearts" }),
  "6C": sixCard({ color: "black", symbol: "clubs" }),
  "6S": sixCard({ color: "black", symbol: "spades" }),
  "6D": sixCard({ color: "red", symbol: "diamonds" }),
  "6H": sixCard({ color: "red", symbol: "hearts" }),
  "7C": sevenCard({ color: "black", symbol: "clubs" }),
  "7S": sevenCard({ color: "black", symbol: "spades" }),
  "7D": sevenCard({ color: "red", symbol: "diamonds" }),
  "7H": sevenCard({ color: "red", symbol: "hearts" }),
  "8C": eightCard({ color: "black", symbol: "clubs" }),
  "8S": eightCard({ color: "black", symbol: "spades" }),
  "8D": eightCard({ color: "red", symbol: "diamonds" }),
  "8H": eightCard({ color: "red", symbol: "hearts" }),
  "9C": nineCard({ color: "black", symbol: "clubs" }),
  "9S": nineCard({ color: "black", symbol: "spades" }),
  "9D": nineCard({ color: "red", symbol: "diamonds" }),
  "9H": nineCard({ color: "red", symbol: "hearts" }),
  "0C": tenCard({ color: "black", symbol: "clubs" }),
  "0S": tenCard({ color: "black", symbol: "spades" }),
  "0D": tenCard({ color: "red", symbol: "diamonds" }),
  "0H": tenCard({ color: "red", symbol: "hearts" }),
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
};

export default cards;
