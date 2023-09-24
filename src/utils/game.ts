
import GameScreen from "@/screens/Game.ts";

export class Game {
    gameScreen?: GameScreen | null | undefined;
    seed: string;
    matchId: number | BigInt;
    DOM: { app: HTMLDivElement };

    constructor() {
        this.seed = '0';
        this.matchId = 0;
        this.DOM = { app: document.createElement("div") };

        this.DOM.app.id = "app";
        document.body.appendChild(this.DOM.app);
        this.init()
    }

    init() {
        this.gameScreen = new GameScreen();
    }

    async onFindGame() {
        this.gameScreen?.newGame();
    }

}


export const _GAME_ = new Game();
