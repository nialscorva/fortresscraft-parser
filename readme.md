# FCE Parser

Parses the XML files for [FortressCraft Evolved](http://www.fortresscraft.com/).  No guarantees on quality of this code, it's mostly me dorking around.

To use this, you must own the game and copy the game data from ${STEAM_INSTALL_DIR}\steamapps\common\FortressCraft\64\Default\Data to "./xmlfiles".

## Building
To build:
```
npm install
bower install
grunt
```

This will produce `dist\fceDatabase.html`-- a single page, self-contained database of all items & recipes in FortressCraft Evolved.

## Developing
When developing, it's faster to run `node main.js` to rebuild `html/fceDatabase.js` and browse `html/index.html` to see the updates.

## Data
The database pulls from the game XML and two additional sources-- merging JSON data in `codex.json` and spreadsheet data from `codex.csv`.  It's a direct merge.

In `codex.csv`, the columns are the dotted field path for the values.  For readability, the first row is the a category that gets prepended to the column names in the second row.  A category applies to all columns until it hits another category.