export function findColors(bubblecolors: any, level: any) {
  let foundcolors = [];
  let colortable = [];
  for (let i = 0; i < bubblecolors; i++) {
    colortable.push(false);
  }

  // Check all tiles
  for (let i = 0; i < level.columns; i++) {
    for (let j = 0; j < level.rows; j++) {
      let tile = level.tiles[i][j];
      if (tile.type >= 0) {
        if (!colortable[tile.type]) {
          colortable[tile.type] = true;
          foundcolors.push(tile.type);
        }
      }
    }
  }

  return foundcolors;
}