export const formatTime = (timeMs: number) => {
  const minutes = Math.floor(timeMs / 1000 / 60);
  const seconds = Math.floor((timeMs / 1000) % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor(timeMs % 1000)
    .toString()
    .padStart(3, "0");
  return { minutes, seconds, ms };
};

// takes ms and limit, returns either: seconds (0), decaseconds (0.n), centaseconds (0.xy), milliseconds (0.xyz)
export const truncateMs = (ms: number, limit: number) => {
  const factor = 10 ** (3 - limit); // 0 => 1000; 3 => 1; 2 => 10; 1 => 100;

  // 999 / factor(2) = 99.9
  return limit > 0
    ? `.${Math.floor(ms / factor)
        .toString()
        .padStart(limit, "0")}`
    : "";
};

export const roundToDecimals = (number: number, decimals: number = 1) =>
  Math.round(number * 10 ** decimals) / 10 ** decimals;
