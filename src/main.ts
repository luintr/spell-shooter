import "./style.scss";

import { InnerHead } from "@/helper/InnerHead";
import { _GAME_ } from "@/utils/game.ts";


class GameControl {
  constructor() {
    new InnerHead();
    this.platformReady()
  }

  platformReady() {
   _GAME_.onFindGame()
  }
}

const gameControl  = new GameControl();
