export const formatTime = (timeDs: number) => {
  const minutes = Math.floor(timeDs / 10 / 60);
  const seconds = Math.floor((timeDs / 10) % 60);
  const tenths = Math.floor(timeDs % 10);
  return { minutes, seconds, tenths };
};

// takes ms and limit, returns either: seconds (0), decaseconds (0.n), centaseconds (0.xy), milliseconds (0.xyz)
// export const truncateMs = (ms: number, limit: number) => {
//   const factor = 10 ** (3 - limit); // 0 => 1000; 3 => 1; 2 => 10; 1 => 100;
//
//   // 999 / factor(2) = 99.9
//   return limit > 0
//     ? `.${Math.floor(ms / factor)
//         .toString()
//         .padStart(limit, "0")}`
//     : "";
// };

// export const timestampToMs = (time: string) => {
//   const [hours, minutes, seconds] = time.split(":").map((n) => Number(n));
//   return (
//     Number(hours) * 60 * 60 * 1000 +
//     Number(minutes) * 60 * 1000 +
//     Number(seconds) * 1000
//   );
// };
