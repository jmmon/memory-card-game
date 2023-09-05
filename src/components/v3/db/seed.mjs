import {
  integer,
  interval,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
// const connectionString = 'postgresql:///mydb?host=localhost&port=5433'

// const allScores = await db.select().from(scores);
const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { withTimezone: true }),
  deckSize: integer("deckSize"),
  gameTime: interval("gameTime"),
  mismatches: integer("mismatches"),
  userId: varchar("userId", { length: 256 }), // some uuid
  initials: varchar("initials", { length: 256 }), // some optional inputted string??
});

(async function () {
  try {
    const client = postgres(connectionString);
    const db = drizzle(client);

    const createScore = (data) => db.insert(scores).values(data);
    const getAllScores = () => db.select().from(scores);

    const createManyScores = (count = 5) => {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(
          createScore({
            deckSize: 6,
            gameTime: "60000 millisecond",
            mismatches: 2,
            userId: (Math.random() * 1000000).toFixed(0),
            initials: "joe",
          })
        );
      }
      for (let i = 0; i < count; i++) {
        promises.push(
          createScore({
            deckSize: 12,
            gameTime: "60000 millisecond",
            mismatches: 2,
            userId: (Math.random() * 1000000).toFixed(0),
            initials: "joe",
          })
        );
      }
      for (let i = 0; i < count; i++) {
        promises.push(
          createScore({
            deckSize: 18,
            gameTime: "60000 millisecond",
            mismatches: 2,
            userId: (Math.random() * 1000000).toFixed(0),
            initials: "joe",
          })
        );
      }
      return Promise.all(promises);
    };

    await createManyScores(5);

    console.log(await getAllScores());
  } catch (err) {
    console.log(err);
  }
})();
