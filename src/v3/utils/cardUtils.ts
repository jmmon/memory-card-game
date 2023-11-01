import { BOARD } from "~/v3/constants/board";
import type {
  BoardLayout,
  CardLayout,
  Coords,
  Pair,
  ShuffleTransform,
  Card,
} from "~/v3/types/types";

/*
 * compared to board, how big will the enlarged card (flipped card) be?
 * range: 0-1
 * */
export const ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION = 0.8;
export const DEFAULT_SHUFFLE_TRANSFORM: ShuffleTransform = { x: 0, y: 0 };

// find cardId inside pairs
const isCardInPairs = (pairs: Pair[], cardId: number) =>
  pairs.join(",").includes(String(cardId));

function getIdIfNotRemoved(
  pairs: Pair[],
  clickedId: number
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

function checkMatch(cardA: Card | undefined, cardB: Card | undefined) {
  if (cardA === undefined || cardB === undefined) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
}

const findCardById = (cards: Card[], id: number) =>
  cards.find((card) => card.id === id);

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
  const colGap = (newCoords.x + 0.5) * cardLayout.colGapPercent;
  const rowGap = (newCoords.y + 0.5) * cardLayout.rowGapPercent;

  const x = newCoords.x * 100 + colGap;
  const y = newCoords.y * 100 + rowGap;
  return `translate(${x}%, ${y}%)`;
};

const getScaleFromDimensions = (
  boardDimension: number,
  cardDimension: number
) =>
  (boardDimension * ENLARGED_CARD__SCALE_RATIO_VS_LIMITING_DIMENSION) /
  (cardDimension * BOARD.CARD_RATIO_VS_CONTAINER);

const generateScaleTransformPercentToCenter = (
  boardLayout: BoardLayout,
  cardLayout: CardLayout
) => {
  const boardRatio = boardLayout.width / boardLayout.height;

  const isWidthTheLimitingDimension = boardRatio < BOARD.CARD_RATIO;
  // console.log({ boardRatio, isWidthTheLimitingDimension, CARD_RATIO });

  if (isWidthTheLimitingDimension) {
    return getScaleFromDimensions(boardLayout.width, cardLayout.width);
  } else {
    return getScaleFromDimensions(boardLayout.height, cardLayout.height);
  }
};

const generateTranslateTransformPercentToCenter = (
  totalSlots: number,
  currentPosition: number
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
  boardLayout: BoardLayout,
  cardLayout: CardLayout,
  newCoords: Coords
) => {
  const isOnLeftSide = newCoords.x < boardLayout.columns / 2;

  const translateX = generateTranslateTransformPercentToCenter(
    boardLayout.columns,
    newCoords.x
  );

  const translateY = generateTranslateTransformPercentToCenter(
    boardLayout.rows,
    newCoords.y
  );

  const scale = generateScaleTransformPercentToCenter(boardLayout, cardLayout);

  return {
    translateX,
    translateY,
    rotateY: isOnLeftSide ? "180deg" : "-180deg",
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
};

export default cardUtils;
