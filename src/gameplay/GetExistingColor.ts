import { findColors } from "./FindColors";
import { randRange } from "@/helper/RandomRange";

// Get a random existing color
export function getExistingColor(bubblecolors: any, level: any) {
  let existingcolors = findColors(bubblecolors, level);

  let bubbletype = 0;
  if (existingcolors.length > 0) {
    bubbletype = existingcolors[randRange(0, existingcolors.length - 1)];
  }

  return bubbletype;
}