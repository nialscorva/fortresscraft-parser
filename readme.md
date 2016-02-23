# FCE Parser

Parses the XML files for [FortressCraft Evolved](http://www.fortresscraft.com/).  No guarantees on quality of this code, it's mostly me dorking around.

To use this, you must own the game and copy the game data from ${STEAM_INSTALL_DIR}\steamapps\common\FortressCraft\64\Default\Data to "./xmlfiles".

## Building
In base directory:
```
npm install
node main.js
```
This generates `html/fceDatabase.js`.  Then:

```
cd html
npm install
bower install
```

Then view `html/index.html` in your browser of choice.  It's a single page, wiki-like list of of information about recipes, items, and such from the game.