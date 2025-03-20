import { GAME } from "~/v3/constants/game";
import { z } from "zod";
import { SelectCardEnum } from "~/v3/types/types";

export const schema_userSettings = z.object({

  /* TODO: ======================================
   * NOT IMPLEMENTED
   * fun ideas for challenges
   * ====================================== */

  maxAllowableMismatches: z.number().min(-1).default(-1),
  reorgnanizeBoardOnGaps: z.boolean().default(false),

  shuffleBoardAfterPair: z.boolean().default(false),
  shuffleBoardAfterMismatches: z.number().min(0).default(0),
  shuffleBoardAfterEveryRound: z.boolean().default(false),
  shufflePickedAfterMismatch: z.boolean().default(false),
  shuffleBoardOnSelectCard: z.nativeEnum(SelectCardEnum).default(SelectCardEnum.OFF),

  /* ======================================
   * end NOT IMPLEMENTED
   * ====================================== */

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
    // TODO: dark mode features
    brightness: z.number().default(100),
    // TODO: dark mode features
    invertCardColors: z.boolean().default(false),
  }),
}).strict();

export type iSchema_userSettings = z.infer<typeof schema_userSettings>;
