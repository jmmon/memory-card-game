## URGENT: game-settings is using context but is rendered inside home page
- homepage doesn't set up context!
- homepage should be able to get the settings and then pass in to the game via params
- perhaps conditional rendering for gamecontext:
> 1. check in game-settings for the location, if '/' then don't render any context
> 2. isHomePage or something like that to hide all context items
> > - need to make sure children don't use context


## End game modal: card changer instead of card slider

## selected card glow: try green? need something more pronounced

## revisit "inverse modal"?
### and/or game homepage flip up/forward to reveal game



## TODO: also show Mismatches and Pairs, even if game isn't over yet
> - e.g. if game has started, show the stats
> - having trouble with context for some reason...


## TODO: add dark mode? (darker mode)
- added options in interface object
> - brightness (number) slider e.g. 100%-10%
> - invert toggle (to invert and hue shift 180* to fix red)


## TODO: lock board / etc
- after saving game, if board is locked, do not let layout recalculate
- seems like after saving, it triggers a recalculation

## TODO: challenge modes
- implement the challenge modes in the game context!

## [Soon(TM)] TODO: finish scores!!!
- cloudflare D1 sql server


## hotfixes css:
### mobile:
#### gameplay: LOW PRIORITY
1. scroll down on mobile to adjust settings
> the top and bottom browser bar hide, making the content show on fullscreen
2. select 10 cards, hit play
> the top and bottom browser bar are still hidden, and cards leave a large gap at the bottom of the screen
> if I scroll back up in the game, the bars reappear, taking up that space so it looks normal
> - and can no longer scroll since the size is 100% height

##### low priority
- Memory Card Game link flows over the timer
> - maybe change "Settings" to hamburger? 
> - Maybe move hamburger to left? move timer to middle?
> - maybe use left carrot for "Back", with (or replacing) "Memory Card Game" 
> > I like having "Memory Card Game" showing though


## low priority: developer settings:
- Cancel button inside dropdown
> - to reset checkbox states to previous settings

