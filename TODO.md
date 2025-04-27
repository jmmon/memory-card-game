## Scores - 
### Mobile:
- limit to -2 count vs desktop ?
- how to limit other than ref to watch the width??
display: none; on two buttons, when screen is small! but then we'll hide last page or something...
- for now just reduced by 2 everywhere

## extra: save initials and identifier in localstorage? (or hash of identifier!)

## deck size slider
- debounce slightly less? from 500 to 400? 420!
- or remove debounce; make it correct the number just before saving
> - this saves the mobile screen jitter from blur removing the keyboard!


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
