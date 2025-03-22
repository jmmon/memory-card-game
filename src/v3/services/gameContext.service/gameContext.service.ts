import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import INITIAL_STATE from "./initialState";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export const useGameContextProvider = () => {
  // state
  const state = useStore(INITIAL_STATE);

  // functions
  const handleFunction = $(() => {
    console.log("handleFunction", state);
  });

  // hold the state, and the functions
  const service = {
    state,
    handleFunction,
  };

  // provide the service
  useContextProvider(GameContext, service);
  // return for immediate use
  return service;
};

// use the service
export const useGameContextService = () => useContext<GameService>(GameContext);
