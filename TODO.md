## low priority: developer settings:
- Cancel button inside dropdown
> - to reset checkbox states to previous settings


## TODO: also show Mismatches and Pairs, even if game isn't over yet
> - e.g. if game has started, show the stats
> - having trouble with context for some reason...


## TODO: add dark mode? (darker mode)
- added options in interface object
> - brightness (number) slider e.g. 100%-10%
> - invert toggle (to invert and hue shift 180* to fix red)


## TODO: lock board / etc
- after saving game, if board is locked, do not let layout recalculate

## TODO: challenge modes
- implement the challenge modes in the game context

## [eventually] TODO: finish scores!!!
- cloudflare D1 sql server


## hotfixes css:
### mobile:
#### homescreen button texts should change: 
- "Reset Game" => "Reset Settings"
- "Save & Reset" => "Save Settings" (or make it also start game? "Save & Play")
> - actually this button isn't even needed on homescreen, changing the slider and hit play without save will still adopt the changed settings!!

#### gameplay:
1. scroll down on mobile to adjust settings
> the top and bottom browser bar hide, making the content show on fullscreen
2. select 10 cards, hit play
> the top and bottom browser bar are still hidden, and cards leave a large gap at the bottom of the screen
> if I scroll back up in the game, the bars reappear, taking up that space so it looks normal
> - and can no longer scroll since the size is 100% height

##### less priority
- Memory Card Game link flows over the timer
> - maybe change "Settings" to hamburger? 
> - Maybe move hamburger to left? move timer to middle?
> - maybe use left carrot for "Back", with (or replacing) "Memory Card Game" 
> > I like having "Memory Card Game" showing though

### General:
- dropdown: remove bottom border, or change it, kinda looks funny
> - else: darker line maybe? less bright
> - like a inset rounded shadow around the entire dropdown area?



