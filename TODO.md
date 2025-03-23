## TODO: try useGameContext hook to fix not-found error with shuffle?
- useGameStateProvider() => {
    set up Store for state;
    define functions;

    create Service object with state and functions

    useContextProvider(GameContext, service);
    return Service;
}
> - use in parent Game.tsx
- useGameState() => () => useContext(GameContext); // aka Service object
> - use everywhere else needed

## TODO: add dark mode? (darker mode)
- added options in interface object
> - brightness (number) slider e.g. 100%-10%
> - invert toggle (to invert and hue shift 180* to fix red)
> > localstorage
> > - consumeParams => when game with params is loaded, consume them and refresh without params, but save the params into the settings
> > - ensure darkmode settings changes later are also stored to localStorage


## TODO: challenge modes
- implement the challenge modes in the game context!



## revisit "inverse modal"?
### and/or game homepage flip up/forward to reveal game
> this could be used to pre-render the game, reducing loading times for game?
> - e.g. game is loaded on homepage, while user is reading content or clicking Play

## [Soon(TM)] TODO: finish scores!!!
- cloudflare D1 sql server with drizzle to save scores


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
> - e.g. maybe load dummy cards first while shuffling then load in actual cards later
> - e.g. preload game during homepage? in background
> > - like render the game on home as well, and home will simply be an overlay
> > > - this would let game load on startup, would need to delay shuffling though

