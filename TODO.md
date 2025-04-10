## end game:
3. [low priority] replace the text in the initials box, e.g. start typing and it fills in x dashes in front and adjusts as you type

## scores modal:
4. [low priority] save score button: loading indicator? 
- it already turns green after but can go disabled while pending

## scores button padding - make size similar to the hamburger on smaller screens
## modal control ?
- when opening scores, do I want the settings to open? 
> I guess only if game is not in progress, so it pauses the game
> or have scores also pause the game just like settings does

## bug:
- seems like settings modal is closed after dealing deck, when starting shuffling?
- should be closed at start of deck dealing, or not closed at all, rather than "halfway" through

## modal full width on smaller screens e.g. max-width:640px
- or only for scores modal? 
> - or smaller breakpoint for skinnier modals

## new deck size selector, maybe <dropdown> 
- clear all
- button selects for each







## figure out sorting for scores!
## sticky table header? so you can always see the labels and sort?
## definitely needs style improvements...
1. chevron up/down for sorting


## chore: params to start game doesn't need to send the invert_cards, can pull from localstorage



## [Soon(TM)] TODO: finish scores!!!
- cloudflare D1 sql server with drizzle to save scores


## TODO: deck size changer with slide as well?
- maybe hidden under dropdown so it can use the whole width, easier on mobile
  - also keep the buttons
  - or try a press and hold for the buttons, debounced timer to make it easier


## bug:
- dark mode theme loading happens late, look into examples from qwik website
  - insert script into head to load on startup immediately;
  - could also check computer preferences...

## perf: deck dealing/fan-out interval instead of timeouts

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

## TODO: less extra work for dark mode.
- break up single hook into multiple
> - only need one onLoad and one onShow per route
- seems like onShow is needed for the settings modal for switching tabs back and forth

## TODO: invert dark mode: more customization
- make it affect the svg symbols rather than the entire card
> - then can customise how each card or symbol or color looks instead of a blanket filter

## TODO: challenge modes
- implement the challenge modes in the game context!



## revisit "inverse modal"?
### and/or game homepage flip up/forward to reveal game
> this could be used to pre-render the game, reducing loading times for game?
> - e.g. game is loaded on homepage, while user is reading content or clicking Play



## hotfixes css:
## Settings button, header: [low priority]
- Memory Card Game link flows over the timer
> - maybe change "Settings" to hamburger? 
> - Maybe move hamburger to left? move timer to middle?
> - maybe use left carrot for "Back", with (or replacing) "Memory Card Game" 
> > I like having "Memory Card Game" showing though

### mobile:
#### gameplay - browser auto hide top/bottom bars: [low priority]
1. scroll down on mobile to adjust settings
> the top and bottom browser bar hide, making the content show on fullscreen
2. select 10 cards, hit play
> the top and bottom browser bar are still hidden, and cards leave a large gap at the bottom of the screen
> if I scroll back up in the game, the bars reappear, taking up that space so it looks normal
> - and can no longer scroll since the size is 100% height


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
> - single source of truth for gamestate, to initialize deck etc after switching states?

### make the main page transparent and the app loads behind the main page
- so the homescreen is an overlay which moves out of the way to start the game
> - can see the deck dealt in the backround on app load and the cards shuffling
- homescreen swings up out of the way when starting,
> - and game re-deals if settings change
> > - (for visual effect)
