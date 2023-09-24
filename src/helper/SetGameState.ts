export let gamestates = {
  init: 0,
  ready: 1,
  shootbubble: 2,
  removecluster: 3,
  gameover: 4,
  gamewin: 5
};

export let gamestate: any = gamestates.init;
export let animationstate: any = 0
export let animationtime: any = 0

export function setGameState(newgamestate: any) {
  gamestate = newgamestate;

  animationstate = 0;
  animationtime = 0;
}

export function setAnimationState(newAnimationState: any) {
  animationstate = newAnimationState;
}

export function setAnimationTime (newAnimationTime: any) {
  animationtime = newAnimationTime
}