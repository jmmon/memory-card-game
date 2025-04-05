import BOARD from "~/v3/constants/board";
import type {
  iBoardLayout,
  iCardLayout,
  iCoords,
  iPair,
  iCard,
} from "~/v3/types/types";
import GAME from "../constants/game";

/*
 * compared to board, how big will the enlarged card (flipped card) be?
 * range: 0-1
 * */
export const ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION = 0.8;
export const DEFAULT_SHUFFLE_TRANSFORM: iCoords = { x: 0, y: 0 };

// find cardId inside pairs
const isCardInPairs = (pairs: iPair[], cardId: number) =>
  pairs.join(",").includes(String(cardId));

function getIdIfNotRemoved(
  pairs: iPair[],
  clickedId: number,
): number | undefined {
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

function checkMatch(cardA?: iCard, cardB?: iCard) {
  if (cardA === undefined || cardB === undefined) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
}

const findCardById = (cards: iCard[], id: number) =>
  cards.find((card) => card.id === id);

/*
 *
 * for special case of -1 (center):
 *    for columnCount === 4 we have 0, 1, [1.5 center] 2, 3 for x => 1.5 is the center
 *    for columnCount === 5 we have 0, 1, [2 center], 3, 4 for x => 2 is the center
 *    for columnCount === 6 we have 0, 1, 2, [2.5 center] 3, 4, 5 for x => 2.5
 *    so simply divide (colCount - 1) by 2
 * need row count or max positions to determine height center
 *    for rowCount === 4 we have 0, 1, 2, 3 for y => 1.5 is the center
 *    ...same math!
 *    divide (rowCount - 1) by 2
 * */
const generateCenterCoords = (cols: number, rows: number) => {
  const { percentX, percentY } =
    GAME.DECK_INITIALIZATION_START_POSITION_BOARD_PERCENTS;

  return {
    x: (cols - 1) * percentX,
    y: (rows - 1) * percentY,
  };
};

/**
 * getXYFromPosition
 * takes position (card slot index) and calculates board coordinates x and y coords
 *    e.g. 23 % 6 = 5; 16 % 6 = 4;
 *    e.g. 23 / 6 = 3.; 16 / 6 = 2.;
 *
 * if position === -1 then rowCount should be defined
 * this is for initialization when dealing out cards
 * */
const getXYFromPosition = (position: number, columnCount: number) => ({
  x: position % columnCount,
  y: Math.floor(position / columnCount),
});
/*
 * generates percentage shift for moving the cards during shuffling
 * from origin:[0,0] (top left) to destination:newCoords
 * */
const generateShuffleTranslateTransformPercent = (
  cardLayout: iCardLayout,
  newCoords: iCoords,
) => {
  const colGap = (newCoords.x + 0.5) * cardLayout.colGapPercent;
  const rowGap = (newCoords.y + 0.5) * cardLayout.rowGapPercent;

  const x = newCoords.x * 100 + colGap;
  const y = newCoords.y * 100 + rowGap;
  return `translate(${x}%, ${y}%)`;
};

const getScaleFromDimensions = (
  boardDimension: number,
  cardDimension: number,
) =>
  (boardDimension * ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION) /
  (cardDimension * BOARD.CARD_RATIO_VS_CONTAINER);

const generateScaleTransformPercentToCenter = (
  boardLayout: iBoardLayout,
  cardLayout: iCardLayout,
) => {
  const boardRatio = boardLayout.width / boardLayout.height;

  const isWidthTheLimitingDimension = boardRatio < BOARD.CARD_RATIO;

  if (isWidthTheLimitingDimension) {
    return getScaleFromDimensions(boardLayout.width, cardLayout.width);
  } else {
    return getScaleFromDimensions(boardLayout.height, cardLayout.height);
  }
};

const generateTranslateTransformPercentToCenter = (
  totalSlots: number,
  currentPosition: number,
) => {
  const maximumSlotsToTransverse = (totalSlots - 1) / 2;
  const slotsToTransverse = maximumSlotsToTransverse - currentPosition;
  return 100 * slotsToTransverse;
};

/*
 * generateFlipTransform
 * uses positioning and layouts to calculate transform required to flip card over and land in the center, scaled up.
 * numOfColsToTransverseMax e.g. 6cols => 2.5, 8cols => 3.5, 7cols => 3
 * */
const generateFlipTranslateTransform = (
  boardLayout: iBoardLayout,
  cardLayout: iCardLayout,
  newCoords: iCoords,
) => {
  const isOnLeftSide = newCoords.x < boardLayout.columns / 2;

  const translateX = generateTranslateTransformPercentToCenter(
    boardLayout.columns,
    newCoords.x,
  );

  const translateY = generateTranslateTransformPercentToCenter(
    boardLayout.rows,
    newCoords.y,
  );

  const scale = generateScaleTransformPercentToCenter(boardLayout, cardLayout);

  return {
    translateX,
    translateY,
    rotateY: isOnLeftSide ? "180deg" : "-180deg", // which way to flip towards the screen
    scale,
  };
};

const cardUtils = {
  isCardInPairs,
  getIdIfNotRemoved,
  handleAddCardToSelected,
  checkMatch,
  findCardById,
  getXYFromPosition,
  generateShuffleTranslateTransformPercent,
  generateFlipTranslateTransform,
  generateCenterCoords,
};

export default cardUtils;
