import { CARD_RATIO, CORNERS_WIDTH_RATIO } from "../v3-board/v3-board";
import { CONTAINER_PADDING_PERCENT } from "../v3-game/v3-game";

export const calculateBoardDimensions = (
  container: HTMLElement,
  board: HTMLElement
) => {
  // const container = containerRef.value as HTMLElement; // or use window instead of container/game?
  // const board = boardRef.value as HTMLElement;

  const boardRect = board.getBoundingClientRect();
  const boardTop = boardRect.top;
  const boardBottomLimit =
    (container.offsetHeight * (100 - CONTAINER_PADDING_PERCENT)) / 100; // account for padding on bottom
  const boardHeight = boardBottomLimit - boardTop;

  const boardWidth =
    (container.offsetWidth * (100 - CONTAINER_PADDING_PERCENT * 2)) / 100; // account for padding on sides

  return { width: boardWidth, height: boardHeight };
};

export const calculateLayouts = (width: number, height: number, deckSize: number) => {
  const boardWidth = width || 0;
  const boardHeight = height || 0;
  const boardArea = boardWidth * boardHeight;

  const maxAreaPerCard = boardArea / deckSize; // to get approx cols/rows

  // width first approach
  const maxWidthPerCard = Math.sqrt(maxAreaPerCard * CARD_RATIO);
  const columns = Math.floor(boardWidth / maxWidthPerCard);
  const rows = Math.ceil(deckSize / columns);

  // max height per card is restricted by number of rows:
  const newCardHeight = boardHeight / rows;
  const newCardWidth = newCardHeight * CARD_RATIO;
  const cardArea = newCardWidth * newCardHeight;

  const cardLayout = {
    width: newCardWidth,
    height: newCardHeight,
    roundedCornersPx: CORNERS_WIDTH_RATIO * newCardWidth,
    area: cardArea,
    // half of this value should be on either edge, full value in the gaps
    // as percent of card width
    colGapPercent: ((boardWidth - (columns * newCardWidth)) / (columns)) / newCardWidth * 100, 
    rowGapPercent: ((boardHeight - (rows * newCardHeight)) / (rows)) / newCardHeight * 100,
  };

  // save board width/height
  const boardLayout = {
    width: boardWidth,
    height: boardHeight,
    area: boardArea,
    rows,
    columns,
    colWidth: boardWidth / columns,
    rowHeight: boardHeight / rows,
  };

  console.log({
    boardLayout,
    cardLayout,
    columns,
    rows,
  });

  return { cardLayout, boardLayout };
};
