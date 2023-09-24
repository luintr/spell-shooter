// Get a random int between low and high, inclusive
export function randRange(low: any, high: any) {
  return Math.floor(low + Math.random() * (high - low + 1));
}
export function randRangeSeed(min: any, max: any, seed: any) {
  const range = max - min + 1;
  const randomValue = (seed % range) + min;
  return randomValue;
}