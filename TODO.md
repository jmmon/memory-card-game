## TODO: add dark mode? (darker mode)
- added options in interface object
> - brightness (number) slider e.g. 100%-10%
> - invert toggle (to invert and hue shift 180* to fix red)
> > localstorage
> > - consumeParams => when game with params is loaded, consume them and refresh without params, but save the params into the settings
> > - ensure darkmode settings changes later are also stored to localStorage

## TODO: theme dark/light:
> let user toggle theme without having to save settings

- in ['/' && '/game/'] routes, need to be able to save theme to localstorage/html
> - could do this in layout
> > - e.g. load theme from localstorage and save to html/localstorage
- in '/' route, also need to be able to modify from the settings
- in '/game/' > settingsModal, also need to be able to modify from the settings

- window onLoad: initialization: (layout, or both routes)
> - get from localstorage and save into html
> > - if yes localstorage, use that value
> > - if no localstorage, set default (light) to both
> - also, need to save into state from localstorage!!!

- settings (home route and inside settings modal)
> - onChange of the signal: (task$)
> > - update both localStorage and html

## more notes on switching/updating themes:
when homepage loads, it should check for localstorage to see if a theme has been saved
- it should update the settings on the homepage to reflect this stored value
- it should also update the HTML tag to match the stored value.
- also, if the setting is changed, it should be tracked to also update the localstorage (and HTML) themes.
> - e.g. save theme should update both HTML and localstorage
- if no theme was detected upon startup, should immediately save a light theme (default)

when game page loads, it should also check for localstorage.
- even if settings were passed in, a change to dark mode should already have updated localstorage.
> - no need to use the passed-in settings to determine the theme, only use localstorage as source of truth.
> [we can ignore params for theme, if the user has a saved theme we should use that. If they want to change, they can go into settings.]

Settings Modal: When it opens, it should show the correct state (e.g. from localstorage)
- when toggling, I like having it update instantly

sources:
- primary should be localstorage, unless actively changing the settings
- use only localstorage for theme?
> - don't care about ctx, it can update later or not at all?



# TESTING DARK MODE / THEME:
1. testing toggles, make sure checkbox matches string
2. play game and it should keep the state
3. clear storage and start home and start /game/ and it should default to light
4. back/forward functionality should maintain state
5. new tab! switch in one tab and swap to other, should reflect the change
> - also open settings modal to make sure checkbox is matching and toggle is working


> so open game, switch to dark mode, then switch tabs and it works to load the state
> - then change, switch back to light, and the cards change but the checkbox is still checked in modal!!
> need to update settings modal so it detects change onShow



## TODO: darkmode brightness adjust: dim the brightness of cards via another filter?

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

