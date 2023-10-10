import { GAME } from "~/v3/constants/game";
import {z} from "zod";

export const schema_userSettings = z.object({
  /* ===================
   * NOT IMPLEMENTED
   * =================== */
  maxAllowableMismatches: z.number().min(-1).default(-1),

  /* shuffle board after x mismatches
   *  0 = off
   *  1+ = every n mismatches
   * */
  shuffleBoardAfterMismatches: z.number().min(0).default(0),
  /* shuffle board after successful pair */
  shuffleBoardAfterPair: z.boolean().default(false),
  /* shuffle board after success OR mismatch */
  shuffleBoardAfterRound: z.boolean().default(false),

  /* shuffle picked cards after placed back down after mismatch */
  shufflePickedAfterMismatch:z.boolean().default(false), 

  /* recalculate board dimensions (eliminate empty spaces) on pair, on mismatch
   * */
  reorgnanizeBoardOnPair: z.boolean().default(false),
  reorgnanizeBoardOnMismatch: z.boolean().default(false),
  /* ===================
   * end NOT IMPLEMENTED
   * =================== */

  deck: z.object({
    size: z.number().min(GAME.MIN_CARD_COUNT).max(GAME.MAX_CARD_COUNT).default(GAME.DEFAULT_CARD_COUNT),
    isLocked: z.boolean().default(false),
  }),

  board: z.object({
    isLocked: z.boolean().default(false), // prevent recalculation of board layout
    resize: z.boolean().default(false),
  }),

  interface: z.object({
    showSelectedIds: z.boolean().default(false),
    showDimensions: z.boolean().default(false),
  }),
});
