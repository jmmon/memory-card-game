## Scores - 
### Mobile:
- page buttons are pretty small, maybe make bigger and limit to -2 count vs desktop

- settings button blur not working for the Button Hover effect!!! stays a light color until tapping elsewhere
- modal footer buttons into a slot? so they are always present instead of scrolling

- after saving score, only disable the save button, but let people play with the initials and identifier!
> - next time they play it should keep those same ones they ended on, and they could always replace iwth their initials and email again.

- maybe put percentiles in parenthesis, and 0.9em

- scores modal should pause game timer!

## extra: save initials and identifier in localstorage? (or hash of identifier!)

## perf: if rowcount reduces and is on first page, don't bother fetching? just truncate the list?
> - kind of a special case but common
- if only filtering 1 deck size then don't bother sorting by decksize?
- if query params are exactly the same, don't fetch again?
> - but then if others play, you will have stale scores, so maybe update once per game?
> > - or e.g. update if 10 seconds has elapsed since last fetch

## deck size slider tooltip: (Hint: you can type a number in the box!)
debounce slightly less? from 500 to 400? 420!

### Help:
- clicking => clicking/tapping
- **(Your selected card gets a green border)**

- dark mode: maybe increase brightness of green border, it's a bit hard to see

- cards should have an aria-label={isCardFlipped.value ? "Ace of Spades" : "backside" }


## hotfixes css:
## Settings button, header: [low priority]
- Maybe move hamburger to left? move timer to middle?
> "Memory Card Game" on game is not really readable on mobile... timer covers it!
> - timer opacity for background??? increase lightness but add opacity


## check pair ids, make sure they are random (enough)


## TODO: deck size change slider dropdown! e.g. carot button (somewhere) to reveal slider
- can use the whole width, easier on mobile
- (also keep the buttons)
> - slider dark mode! darker bg/fill


## Challenge modes:
- save for later... next phase...
- it will be set up as a brand new table, completely separate scorekeeping since they are not comparable to regular scores
> then I can have the modal with a couple tabs (or something)


## sticky table header? so you can always see the labels and sort?


## chore: params to start game doesn't need to send the invert_cards, can pull from localstorage

- less extra work for dark mode.
- dark mode theme loading happens late, look into examples from qwik website
> - insert script into head to load on startup immediately;
> - could also check computer preferences...

## perf: change all cards into hidden SVG defs? then can load entire cards upfront like the symbol defs

## perf: some sort of master timer? game clock? could hopefully handle multiple tasks
- deck dealing timer,
- shuffle timer,
- flip timer,
- shake timer,
- header scores animation timer?

- could do a signal and track when it changes, to adjust the interval?
- have to turn the timer on, and off when it's not needed (if no action)
- probably would need some small clock rate and then extrapolate ticks from that

> e.g. playing, flip, unflip, then it counts the downtime and after 10 seconds 
>   shows the settings modal pause feature




## excited for qwik 1.14!


## TODO: make an about page


## TODO: darkmode brightness adjust: dim the brightness of cards via another filter?
 brightness (number) slider e.g. 100%-10%
> - also save in localstorage

## TODO: Invert Dark Mode customization
> - make it affect the svg symbols rather than the entire card
> - then can customise how each card or symbol or color looks instead of a blanket filter



## developer settings: [low priority]
- Cancel button inside dropdown
> - to reset checkbox states to previous settings
## TODO: lock board / etc [low priority]
- after saving game, if board is locked, do not let layout recalculate
- seems like after saving, it triggers a recalculation


## TODO: investigate perf improvements [low priority]
- see if I can change around loading of functions
> e.g. maybe load dummy cards first while shuffling then load in actual cards later
> e.g. preload game during homepage? in background, see through transparent layer?
> - like render the game on home as well, and home will simply be an overlay
> > - this would let game load on startup, would need to delay shuffling though
> > - could shuffle in background, homepage opacity
> - single source of truth for gamestate, to initialize deck etc after switching states?

## revisit "inverse modal"?
### and/or game homepage flip up/forward to reveal game
> this could be used to pre-render the game, reducing loading times for game?
> - e.g. game is loaded on homepage, while user is reading content or clicking Play
### make the main page transparent and the app loads behind the main page
- so the homescreen is an overlay which moves out of the way to start the game
> - can see the deck dealt in the backround on app load and the cards shuffling
> - allow user to hit Play, but it would be in the loading state until done shuffling
> > only show "Loading" after homescreen was moved out of the way
- homescreen swings up out of the way when starting,
> - and game re-deals if settings change
> > - (for visual effect)
