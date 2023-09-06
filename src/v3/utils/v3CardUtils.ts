import { CARD_RATIO } from "../components/board/board";
import { BoardLayout, CardLayout, Coords, Pair, ShuffleTransform, Card } from "../types/types";

/*
 * compared to board, how big will the enlarged card (flipped card) be?
 * range: 0-1
 * */
export const ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION = 0.8;
export const CARD_RATIO_VS_CONTAINER = 0.9;
export const DEFAULT_SHUFFLE_TRANSFORM: ShuffleTransform = { x: 0, y: 0 };

// find cardId inside pairs
function isCardInPairs(pairs: Pair[], cardId: number) {
  return pairs.join(",").includes(String(cardId));
}

function getIdIfNotRemoved(pairs: Pair[], clickedId: number):number | undefined {
  // check if target is an empty slot
  const isRemoved = isCardInPairs(pairs, clickedId);
  if (isRemoved) return undefined;
  return clickedId;
}

function handleAddCardToSelected(selected: number[], id: number) {
  const isSameCardClicked = selected.length === 1 && id === selected[0];

  if (isSameCardClicked) return selected;

  return [...selected, id];
}

function checkMatch(cardA: Card | undefined, cardB: Card | undefined) {
  if (cardA === undefined || cardB === undefined) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
}

function findCardById(cards: Card[], id: number) {
  return cards.find((card) => card.id === id);
}

/*
 * getXYFromPosition
 * takes position (card slot index) and calculates board coordinates x and y coords
 * // e.g. 23 % 6 = 5; 16 % 6 = 4;
 * // e.g. 23 / 6 = 3.; 16 / 6 = 2.;
 * */
const getXYFromPosition = (position: number, columnCount: number) => ({
  x: position % columnCount,
  y: Math.floor(position / columnCount),
});

/*
 * generates percentage shift for moving the cards during shuffling
 * from origin:[0,0] to destination:newCoords
 * */
const generateShuffleTranslateTransformPercent = (
  cardLayout: CardLayout,
  newCoords: Coords
) => {
  const colGap =
    (1 / 2) * cardLayout.colGapPercent + newCoords.x * cardLayout.colGapPercent;
  const rowGap =
    (1 / 2) * cardLayout.rowGapPercent + newCoords.y * cardLayout.rowGapPercent;

  const x = newCoords.x * 100 + colGap;
  const y = newCoords.y * 100 + rowGap;
  return `translate(${x}%, ${y}%)`;
};

const generateScaleTransformToCenter = (
  boardLayout: BoardLayout,
  cardLayout: CardLayout
) => {
  const boardRatio = boardLayout.width / boardLayout.height;

  const isWidthTheLimitingDimension = boardRatio < CARD_RATIO;
  // console.log({ boardRatio, isWidthTheLimitingDimension, CARD_RATIO });

  if (isWidthTheLimitingDimension) {
    const targetWidthPx =
      boardLayout.width * ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION;
    return targetWidthPx / (cardLayout.width * CARD_RATIO_VS_CONTAINER);
  } else {
    const targetHeightPx =
      boardLayout.height * ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION;
    return targetHeightPx / (cardLayout.height * CARD_RATIO_VS_CONTAINER);
  }
};

const generateTranslateTransformToCenter = (
  totalSlots: number,
  currentPosition: number,
  slotWidthPx: number
) => {
  const maximumSlotsToTransverse = (totalSlots - 1) / 2;
  const slotsToTransverse = maximumSlotsToTransverse - currentPosition;
  const translatePx = slotWidthPx * slotsToTransverse;
  return translatePx;
};

/*
 * generateFlipTransform
 * uses positioning and layouts to calculate transform required to flip card over and land in the center, scaled up.
 * numOfColsToTransverseMax e.g. 6cols => 2.5, 8cols => 3.5, 7cols => 3
 * */
const generateFlipTranslateTransform = (
  boardLayout: BoardLayout,
  cardLayout: CardLayout,
  newCoords: Coords
) => {
  const isOnLeftSide = newCoords.x < boardLayout.columns / 2;

  const translateXPx = generateTranslateTransformToCenter(
    boardLayout.columns,
    newCoords.x,
    boardLayout.colWidth
  );

  const translateYPx = generateTranslateTransformToCenter(
    boardLayout.rows,
    newCoords.y,
    boardLayout.rowHeight
  );

  const scale = generateScaleTransformToCenter(boardLayout, cardLayout);

  return `translate(${translateXPx}px, ${translateYPx}px) 
      rotateY(${isOnLeftSide ? "" : "-"}180deg) 
      scale(${scale})`;
};

const v3CardUtils = {
  isCardInPairs,
  getIdIfNotRemoved,
  handleAddCardToSelected,
  checkMatch,
  findCardById,
  getXYFromPosition,
  generateShuffleTranslateTransformPercent,
  generateScaleTransformToCenter,
  generateTranslateTransformToCenter,
  generateFlipTranslateTransform,
}

export default v3CardUtils;
