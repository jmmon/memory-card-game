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
- increase settings modal width? that will give it more room for checkboxes and slider etc

- Show Selected Card Ids - checkbox on mobile is smaller? word text takes up too much room? so box is forced to shrink

- tooltip popovers are overflowing!!!
> homescreen settings popover is also overflowing, but rest looks ok
> - card count slider - number wraps to next line when >= 20
> - homescreen button texts should change: 
> > - "Reset Game" => "Reset Settings"
> > - "Save & Reset" => "Save Settings" (or make it also start game? "Save & Play")
> > > - actually this button isn't even needed, changing the slider and hit play without save will still adopt the changed settings!!
> media query so smaller screens will restrict width of popover?
> - e.g. wrap text onto two lines

- Developer Settings dropdown padding is a bit too much on small screens
> make it based on vw?
> - on homescreen, padding looks ok...

-  test for scrollbars on game settings on shorter small screens?
> don't want the settings modal to overflow or buttons to be hidden;
> content of modal should be scrollable if it gets too large

- card count 18 - each word is on a new line on mobile! slider too wide?
> try a select??
> or move 18 to somewhere else? below?
> or a + and - button to change card count!!

- Gap between "Goal:" and "Clear the board to win!" is pretty large, reduce by 25%?

- 1. scroll down on mobile to adjust settings
  > the top and bottom browser bar hide, making the content show on fullscreen
- 2. select 10 cards, hit play
  > the top and bottom browser bar are still hidden, and cards leave a large gap at the bottom of the screen
  > if I scroll back up in the game, the bars reappear, taking up that space so it looks normal
  > - and can no longer scroll since the size is 100% height

### other:
### mobile:
- Memory Card Game link flows over the timer
> - maybe change "Settings" to hamburger? 
> - Maybe move hamburger to left? move timer to middle?
> - maybe use left carrot for "Back", with (or replacing) "Memory Card Game" 
> > I like having "Memory Card Game" showing though

### General:
- Swap "Show Developer Settings" to below the "Help" dropdown
- dropdown: remove bottom border, or change it, kinda looks funny
> - else: darker line maybe? less bright
- like a inset rounded shadow around the entire dropdown area?



