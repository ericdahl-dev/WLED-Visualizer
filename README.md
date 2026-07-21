# WLED Visualizer

A browser based [WLED](https://github.com/wled/WLED) simulator for mapping displays similar to more advanced apps like xLights/Vixen. In effect, this is to help hobbyists design LED displays (especially external ones) without having to sit in sweltering/freezing/snowy/rainy or otherwise less than ideal outdoor conditions to get their display just right.

## Project Goals

- Draw and define vector LED strip/string runs
- Import reference photo(s) to draw over
- Connect, import and export to live controllers
- Multiple controller support
- Export / Save projects locally
- Implement and maintain as many WLED effects, palettes and options (segmentation, layering, matrices, blending) as possible

## Current Features

- Click-to-create multiple runs as vector segments
- Show/Hide vector guides
- Run length/count definition
- Photo reference import
- Project import/export
- 118 simulated WLED effects
- 72 pre-defined color palettes scraped from palettes.cpp

## User interface

<img src="/images/interface_001.jpg" width="50%">

## Installation

Download the HTML folder and open index.html. That's pretty much it.

## What's lacking

A lot, actually. There's a lot I'd like to do here, but my JS skills aren't super strong and vibe coding can only go so far. This v0.01 hopefully acts as a solid jumping off point to someone more knowledgeable than I in translating (maybe even interfacing) the arduino libraries from the actual WLED repo into a web interface. I'd like this to be a more robust, feature rich version of WLED's native Peek function.

## Everything else

Credit especially to all WLED [contributors](https://kno.wled.ge/about/contributors/)!
And a super special thanks to [Aircookie's incredible firmware](https://github.com/wled/WLED). WLED has single handedly allowed me to up my holiday decorating game.

You can occasionally find me on the Discord server.

<a href="https://discord.gg/QAh7wJHrRM"><img src="https://discordapp.com/api/guilds/473448917040758787/widget.png?style=banner2" width="25%"></a>