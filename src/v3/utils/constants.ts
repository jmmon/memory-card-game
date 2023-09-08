const CONSTANTS = {
  animations: {
    cardFlip: 600,
    cardShake: 600,
    cardShuffle: 350,
    cardShufflePause: 50,
    cardViewTimeMin: 500,
    cardViewTimeMax: 500,
    cardHideUndersideAfterTimeRatio: 0.9,
    cardEndGameDisplayTimeMin: 250,
    autoShuffleInterval: 10 * 1000,
    autoShuffleDelay: 10 * 1000,
    cardShakeEagerStartMs: 150,
    cardShakeStartAtFlipDownCompleteness: 0.8,
  },

  card: {
    ratio: 2.5 / 3.5,
    cornersWidthRatio: 1 / 20,
    shuffleRounds: 5,
  },

  game: {
    autoPauseDelayMs: 10 * 1000,
    defaultDeckSize: 18,
  },
}

export { CONSTANTS };
