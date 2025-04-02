import BOARD from "~/v3/constants/board";
import GAME from "~/v3/constants/game";

export const calculateBoardDimensions = (
  container: HTMLElement,
  board: HTMLElement,
) => {
  // const container = containerRef.value as HTMLElement; // or use window instead of container/game?
  // const board = boardRef.value as HTMLElement;

  const boardRect = board.getBoundingClientRect();
  const boardTop = boardRect.top;

  // account for padding on bottom
  const boardBottomLimit =
    (container.offsetHeight * (100 - GAME.CONTAINER_PADDING_PERCENT)) / 100;
  const height = boardBottomLimit - boardTop;

  // account for padding on sides
  const width =
    (container.offsetWidth * (100 - GAME.CONTAINER_PADDING_PERCENT * 2)) / 100;

  return { width, height };
};

export const calculateLayouts = (
  width: number,
  height: number,
  deckSize: number,
) => {
  const boardWidth = width || 0;
  const boardHeight = height || 0;
  const boardArea = boardWidth * boardHeight;

  const maxAreaPerCard = boardArea / deckSize; // to get approx cols/rows

  // width first approach
  const maxWidthPerCard = Math.sqrt(maxAreaPerCard * BOARD.CARD_RATIO);
  const columns = Math.floor(boardWidth / maxWidthPerCard);
  const rows = Math.ceil(deckSize / columns);

  // max height per card is restricted by number of rows:
  const newCardHeight = boardHeight / rows;
  const newCardWidth = newCardHeight * BOARD.CARD_RATIO;
  const cardArea = newCardWidth * newCardHeight;

  const cardLayout = {
    width: newCardWidth,
    height: newCardHeight,
    roundedCornersPx: BOARD.CORNERS_WIDTH_RATIO * newCardWidth,
    area: cardArea,
    // half of this value should be on either edge, full value in the gaps
    // as percent of card width
    colGapPercent:
      ((boardWidth - columns * newCardWidth) / columns / newCardWidth) * 100,
    rowGapPercent:
      ((boardHeight - rows * newCardHeight) / rows / newCardHeight) * 100,
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

  // console.log({
  //   boardLayout,
  //   cardLayout,
  //   columns,
  //   rows,
  // });

  return { cardLayout, boardLayout };
};

const boardUtils = {
  calculateBoardDimensions,
  calculateLayouts,
};
export default boardUtils;
