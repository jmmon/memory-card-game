import { useSignal, useStore } from "@builder.io/qwik";

const useGame = () => {
  const gameRef = useSignal<HTMLElement>();
  const boardRef = useSignal<HTMLElement>();
  const state = useStore({
    layouts: {
      board: {},
      card: {},
    },
    game: {
      cards: [],
      selectedIds: [],
    },
    settings: {
      deck: {
        size: 18,
      },
    }
  });

  return {
    gameRef,
    boardRef,
    state,
  };
};

export { useGame };
