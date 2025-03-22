import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export const useGameContextProvider = () => {
  // state
  const state = useStore({
    count: 0,
  });

  // functions
  const handleFunction = $(() => {
    console.log("handleFunction", state);
  });

  const handleAddToCount = $((number: number) => {
    state.count += number;
  });

  // hold the state, and the functions
  const service = {
    state,
    handleFunction,
    handleAdd: handleAddToCount,
    handleSubtract: $((number: number) => handleAddToCount(-number)),
  };

  // provide the service
  useContextProvider(GameContext, service);
  // return for immediate use
  return service;
};

// use the service
export const useGameContextService = () => useContext<GameService>(GameContext);
