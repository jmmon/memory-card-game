Calculating max card dimensions based on board dimensions
===

examples:

130 / (130 + 53) * 100 = 71.038%

so total cols = 183
183 - 50 = 133 cols old width

60% * 183 = 109.8 cols 

new width: max(109.8, 133) === 133 (same as currently)


if total cols = 300 (really wide)
then:
300 - 50 = 250 cols old width
60% * 300 = 180 cols

new width: max(250, 180) === 250 (same as currently)


if total cols = 100 (skinny)
100 - 50 = 50 cols old width
60% * 100 = 60 cols 
max(60, 50) === 60 (larger than currently)
