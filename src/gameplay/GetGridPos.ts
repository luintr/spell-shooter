
// Get the closest grid position
export function getGridPosition(x: number, y: number, level: any, rowoffset: any) {
  let gridy = Math.floor((y - level.y) / level.rowheight);

  // Check for offset
  let xoffset = 0;
  if ((gridy + rowoffset) % 2) {
    xoffset = level.tilewidth / 2;
  }
  let gridx = Math.floor(((x - xoffset) - level.x) / level.tilewidth);

  return { x: gridx, y: gridy };
}
