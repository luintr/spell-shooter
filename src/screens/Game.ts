import { GamePlay } from "@/gameplay/GamePlay";
import './style.scss'
import { _GAME_ } from "@/utils/game.ts";

export default class GameScreen {

  DOM: { main?: HTMLDivElement, btnSound?: HTMLButtonElement, btnHistory?: HTMLButtonElement }

  constructor() {
    this.DOM = {};
    this.create()
  }

  newGame() {
    this.show()
    new GamePlay();
  }

  create(): void {
    const logoImg = GAME_ASSETS.logo
    const historyIcon = GAME_ASSETS.historyIcon
    const soundIcon = GAME_ASSETS.soundIcon
    this.DOM.main = document.createElement('div');
    this.DOM.main.id = "gamePlay";
    this.DOM.main.classList.add('gamePlay')
    this.DOM.main.innerHTML = `
    <div class="container flex ">
      <audio id="audio" src="src/assets/audio/shoot.mp3"></audio>
      <div class="playField">
        <div class="wrap-canvas js-canvas">
          <canvas id="viewport" width="349" height="545"></canvas>
        </div>

        <div class="notiOverlay js-notiOverlay">
          <div class="notiOverlay-score">
            <span class="notiOverlay-score_label">Score</span>
            <span class="notiOverlay-score_score js-notiOverlay-score_score">0</span>
          </div>
          <button class="notiOverlay-btn custom-btn js-notiOverlay-btn">Play again</button>
        </div>
      </div>

      <div class="wrap-boardGame">
        <img src=${logoImg} class="logo">
        <div class="boardGame">
          <div class="boardGame-block js-score">
            <span class="js-score_label">Score</span>
            <span class="js-score_score">0</span>
          </div>
        </div>
        <div class="gameBoard-btns">
          <button class="gameBoard-btn js-history-btn"><img src=${historyIcon} alt=""></button>
          <button class="gameBoard-btn js-sound-btn"><img src=${soundIcon} alt=""></button>
        </div>
      </div>
    </div>
    `;

    this.DOM.btnHistory = this.DOM.main.querySelector('.js-history-btn') as HTMLButtonElement;
    this.DOM.btnSound = this.DOM.main.querySelector('.js-sound-btn') as HTMLButtonElement;
  }

  show() {
    this.DOM.main && _GAME_.DOM.app.append(this.DOM.main);
  }

  hide() {
    try {
      this.DOM.main && _GAME_.DOM.app.removeChild(this.DOM.main);
    } catch (err) {
      throw err
    }
  }

  onSound() {
    //logic sound;
  }

  handleEvent() {
    this.DOM.btnSound?.addEventListener('click', this.onSound.bind(this));
  }
}
