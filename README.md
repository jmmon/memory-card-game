# Memory Card Game

- Flip two cards by clicking on them. One click to flip, one click to unflip.
- If they match, they are cleared from the board and you get a pair!
- If they don't match, you get a mismatch.
- Clear the board to win!

## Try it live at [nomadcoder.dev](https://nomadcoder.dev)

---

## Features

- Adjustable deck size (default: 18 cards) - type in the number or use the + - buttons
- Nice CSS animations for dealing the deck, shuffling the cards, and flipping the cards
- Counts pairs and mismatches throughout the gameplay
- Game Timer with auto-pausing when opening Settings
- Auto-pause game after 10 seconds of inactivity (after starting the game)
- Auto-pause game after switching tabs
- Shuffle the board occasionally every 10 seconds (if you have not started playing yet)
- shuffle button in Settings to manually shuffle (if you have not started playing yet)
- Dark/inverted theme for cards (also syncs across tabs, and saves to localstorage to remember later)
- Fully responsive
- SVG card defs so the symbols can be preloaded and to reduce code duplication

Made with Tailwind primarily for styling, and uses Qwik-UI popover. Coming soon, the scoreboard feature is using Drizzle ORM with Cloudflare's d1 SQLite DB

## To Run

```shell
git checkout dev      # or cloudflare-master
pnpm start            # or pnpm run dev
```

OR with Wrangler, as is used when hosted on Cloudflare:
(Note: wrangler does not provide hot-module reloading, and wrangler is only required when running the `scores` branch as wrangler is also hosting the SQLite db in that case - see Features In Development below)

```shell
git checkout dev      # or cloudflare-master
pnpm run serve.clean  # lint:fix and build and serve with wrangler
```

## Features In Development

- Scoreboard (using SQLite d1 on Cloudflare) - ~80% complete - Get your initials and identicon on the scoreboard and see how you score compared others! Also calculates your percentiles for gametime and mismatches compared to others with your same deck size.
> The code is on `feature/cloudflare-scores-v1` branch - you'd need to make a local db with `pnpm wrangler d1 create` and perhaps `pnpm run drizzle:update` and then `pnpm wrangler d1 migrations apply` and set the connection inside a `wrangler.jsonc` file. Then you should be able to run the scores branch and database with `pnpm run serve.clean` - or `pnpm run build` and `pnpm run serve`. Also there is a db-seed page in the app to help with seeding dummy data into the db.
- various performance improvements, reduced doubled code and optimized timeouts and intervals 
- updated theme loading to avoid the "flash" and to respect user computer theme preferences 
- also a brightness slider as an alternative to inverting the card colors
- Challenge modes, such as:
> - reorganize layout after pairs to eliminate empty spaces
> - limited number of allowed mismatches so you have a possibility to "lose" the game
> - shuffle board after every pair, or every N mismatches, or after every pick of a card!
> Scores for these challenge games will likely be kept on a separate scoreboard, since it's hard to fairly compare a challenge game against a regular game. Will require more thought on how to show and save the challenge modes in the scoreboard.
- Eventual rebuild might happen, trying to reduce/optimize the js further and rely even more on css when possible

## Project Structure

The main code is inside the `v3` folder. There are also some prototype versions in the code. 
It's structured in the "atomic" structure. (I think I'd switch back to a feature-based structure instead as atomic can be harder to find the various components, but I wanted to give the atomic structure a try.)

## History:

I made this project a couple years ago and iterated some prototypes and different functionalities in the first week, such as basic mechanics, card flipping annimations, and responsive board layouts, and then have been working on the `v3` code. The game was pretty complete before I ran out of time, and I even built out most of the scoreboard feature but had some issues with hosting and a hidden bug with sorting, and then got busy with life.

After a couple years off, I recently started working on this project again. Switched to Cloudflare free hosting, which is fantastic and has a lot of features, and the scoreboard is now only needing some styling tweaks and finalization before it is ready.

---

## About Qwik

Qwik is the newest framework on the block, featuring resumability and lazy-loading everything. The goal of Qwik is to be fast enough for any large store or marketplace to use, and to reduce double-work required by hydration-style frameworks. 

Qwik renders first on the server, and then serializes all of the app information, specifically listener locations, so then the client does not need to download and run the entire app again on the client - it can simply read the HTML and use those instructions to know which functions are required by which interactions. Qwik also has fine-grained reactivity using Signals and attempts to only rerender when absolutely necessary. 

Code style is similar to React so it is familiar and easy to get started, but Qwik introduces new concepts for resumability. If React (or Angular or Svelte or Vue etc.) is like "download the entire movie before you can begin to watch," Qwik is like "stream the movie and you can start watching immediately, and you only download the parts that you watch." Minimal unused code should ship to the client, and the code that does ship should not involve code to rerender entire components - only rerender the view or only send a few listener functions or task functions which are necessary for the user's current (or immediate future) interactions.

This project started way back before Qwik went into Beta stage, and I've updated Qwik countless times since then! Now, the Qwik team is working on v2 which has a reworked engine and will be even more optimized and efficient. v2 is currently in alpha, but my project is still on v1 currently.

### Qwik Resources

- [Qwik Docs](https://qwik.builder.io/)
- [Discord](https://qwik.builder.io/chat)
- [Qwik GitHub](https://github.com/BuilderIO/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

