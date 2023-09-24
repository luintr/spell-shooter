import { degToRad, radToDeg } from "@/helper/ConvertVariable";
import { getMousePos } from "@/gameplay/GetMousePos";
import { loadImages, preloaded } from "@/helper/LoadImages";
import { animationstate, gamestate, gamestates, setAnimationState, setGameState } from "@/helper/SetGameState";
import { getGridPosition } from "./GetGridPos";
import { getExistingColor } from "./GetExistingColor";
import { _GAME_ } from "@/utils/game";
import { randRange } from "@/helper/RandomRange";

class Tile {
    x: number;
    y: number;
    type: number;
    removed: boolean;
    shift: number;
    velocity: number;
    alpha: number;
    processed: boolean;

    constructor(x: number, y: number, type: number, shift: number) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.removed = false;
        this.shift = shift;
        this.velocity = 0;
        this.alpha = 1;
        this.processed = false;
    }
}

type Level = {
    x: number;
    y: number;
    width: number;
    height: number;
    columns: number;
    rows: number;
    tilewidth: number;
    tileheight: number;
    rowheight: number;
    radius: number;
    tiles: Tile[][];
}

type Player = {
    x: number;
    y: number;
    angle: number;
    tiletype: number;
    bubble: {
        x: number;
        y: number;
        angle: number;
        speed: number;
        dropspeed: number;
        tiletype: number;
        visible: boolean;
    };
    nextbubble: {
        x: number;
        y: number;
        tiletype: number;
    };
};

export class GamePlay {
    private DOM: {
        canvas?: HTMLCanvasElement | null,
        playField?: HTMLDivElement | null,
        overlayBtn?: HTMLButtonElement | null,
        notiOverlay?: HTMLDivElement | null,
        audioElement?: HTMLAudioElement | null,
    }
    context: any;
    lastframe: number;
    fpstime: number;
    framecount: number;
    fps: number;
    initialized: boolean;
    level: Level;
    player: Player;
    neighborsoffsets: any[];
    bubblecolors: number = 5;
    score: number = 0;
    turncounter: number = 0;
    rowoffset: number = 0;
    showcluster: boolean = false;
    cluster: any[] = [];
    floatingclusters: any[] = [];
    images: any[] = [];
    bubbleimage: any;
    currentBall: any;
    nextBall: any;
    angleLineImage: any;
    interval: number;

    constructor() {
        this.DOM = {}
        this.DOM.canvas = document.getElementById("viewport") as HTMLCanvasElement | null;
        this.DOM.playField = document.querySelector(".js-canvas") as HTMLDivElement | null;
        this.DOM.notiOverlay = document.querySelector('.js-notiOverlay') as HTMLDivElement | null
        this.context = this.DOM.canvas?.getContext("2d");
        this.DOM.audioElement = document.getElementById('audio') as HTMLAudioElement | null;
        this.DOM.overlayBtn = document.querySelector('.js-notiOverlay-btn') as HTMLButtonElement | null;
        this.lastframe = 0;
        this.fpstime = 0;
        this.framecount = 0;
        this.fps = 0;
        this.initialized = false;
        this.interval = 0;

        this.level = {
            x: 4,
            y: 0,
            width: 0,
            height: 0,
            columns: 8,
            rows: 14,
            tilewidth: 40,
            tileheight: 40,
            rowheight: 34,
            radius: 20,
            tiles: []
        }

        this.player = {
            x: 0,
            y: 0,
            angle: 0,
            tiletype: 0,
            bubble: {
                x: 0,
                y: 0,
                angle: 0,
                speed: 800,
                dropspeed: 300,
                tiletype: 0,
                visible: false
            },
            nextbubble: {
                x: 0,
                y: 0,
                tiletype: 0
            }
        };

        this.neighborsoffsets = [[[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]], // Even row tiles
        [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]];  // Odd row tiles

        this.currentBall = new Image();
        this.currentBall.src = GAME_ASSETS.currentBall;
        this.nextBall = new Image();
        this.nextBall.src = GAME_ASSETS.nextBall;
        this.angleLineImage = new Image();
        this.angleLineImage.src = GAME_ASSETS.angleLine;
        //random Seed
        this.init()
    }

    init() {
        this.images = loadImages(["src/assets/images/image.png"]);
        this.bubbleimage = this.images[0];

        // Add mouse events
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.DOM.playField?.addEventListener("mousemove", this.onMouseMove);
        this.DOM.playField?.addEventListener("mousedown", this.onMouseDown);
        this.DOM.overlayBtn?.addEventListener('click', this.handleOverlayBtn);

        // Initialize the two-dimensional tile array
        for (let i = 0; i < this.level.columns; i++) {
            this.level.tiles[i] = [];
            for (let j = 0; j < this.level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                this.level.tiles[i][j] = new Tile(i, j, 0, 0);
            }
        }

        this.level.width = this.level.columns * this.level.tilewidth + this.level.tilewidth / 2;
        this.level.height = (this.level.rows - 1) * this.level.rowheight + this.level.tileheight;
        // Init the player
        this.player.x = this.level.x + this.level.width / 2 - this.level.tilewidth / 2;
        this.player.y = this.level.y + this.level.height;
        this.player.angle = 90;
        this.player.tiletype = 0;

        this.player.nextbubble.x = this.player.x - 2 * this.level.tilewidth;
        this.player.nextbubble.y = this.player.y;

        this.newGame();
        this.main(0);
    }

    // Main loop
    main = (tframe: any) => {
        window.requestAnimationFrame(this.main);
        if (!this.initialized) {
            if (this.DOM.canvas) {
                this.context?.clearRect(0, 0, this.DOM.canvas.width, this.DOM.canvas.height);
            }

            if (preloaded) {
                setTimeout(() => {
                    this.initialized = true;
                }, 500);
            }
        } else {
            this.update(tframe);
            this.render();
        }
    }

    update = (tframe: any) => {
        let dt = (tframe - this.lastframe) / 1000;
        this.lastframe = tframe;

        this.updateFps(dt);

        if (gamestate === gamestates.ready) {

        } else if (gamestate === gamestates.shootbubble) {
            this.stateShootBubble(dt);
        } else if (gamestate === gamestates.removecluster) {
            this.stateRemoveCluster(dt);
        }
    }

    stateShootBubble = (dt: any) => {
        this.player.bubble.x += dt * this.player.bubble.speed * Math.cos(degToRad(this.player.bubble.angle));
        this.player.bubble.y += dt * this.player.bubble.speed * -1 * Math.sin(degToRad(this.player.bubble.angle));

        if (this.player.bubble.x <= this.level.x) {

            this.player.bubble.angle = 180 - this.player.bubble.angle;
            this.player.bubble.x = this.level.x;
        } else if (this.player.bubble.x + this.level.tilewidth >= this.level.x + this.level.width) {

            this.player.bubble.angle = 180 - this.player.bubble.angle;
            this.player.bubble.x = this.level.x + this.level.width - this.level.tilewidth;
        }

        if (this.player.bubble.y <= this.level.y) {
            this.player.bubble.y = this.level.y;
            this.snapBubble();
            return;
        }

        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                let tile = this.level.tiles[i][j];

                if (tile.type < 0) {
                    continue;
                }

                let coord = this.getTileCoordinate(i, j);
                if (this.circleIntersection(this.player.bubble.x + this.level.tilewidth / 2,
                    this.player.bubble.y + this.level.tileheight / 2,
                    this.level.radius,
                    coord.tilex + this.level.tilewidth / 2,
                    coord.tiley + this.level.tileheight / 2,
                    this.level.radius)) {

                    // Intersection with a level bubble
                    this.snapBubble();
                    return;
                }
            }
        }
    }

    stateRemoveCluster = (dt: any) => {
        if (animationstate === 0) {
            this.resetRemoved();

            for (let i = 0; i < this.cluster.length; i++) {
                this.cluster[i].removed = true;
            }

            this.score += this.cluster.length * 10;
            this.floatingclusters = this.findFloatingClusters();

            if (this.floatingclusters.length > 0) {
                for (let i = 0; i < this.floatingclusters.length; i++) {
                    for (let j = 0; j < this.floatingclusters[i].length; j++) {
                        let tile = this.floatingclusters[i][j];
                        tile.shift = 0;
                        tile.shift = 1;
                        tile.velocity = this.player.bubble.dropspeed;

                        this.score += 10;
                    }
                }
            }
            setAnimationState(1);
        }

        if (animationstate === 1) {
            // Pop bubbles
            let tilesleft = false;
            for (let i = 0; i < this.cluster.length; i++) {
                let tile = this.cluster[i];

                if (tile.type >= 0) {
                    tilesleft = true;

                    // Alpha animation
                    tile.alpha -= dt * 15;
                    if (tile.alpha < 0) {
                        tile.alpha = 0;
                    }

                    if (tile.alpha === 0) {
                        tile.type = -1;
                        tile.alpha = 1;
                    }
                }
            }


            for (let i = 0; i < this.floatingclusters.length; i++) {
                for (let j = 0; j < this.floatingclusters[i].length; j++) {
                    let tile = this.floatingclusters[i][j];

                    if (tile.type >= 0) {
                        tilesleft = true;


                        tile.velocity += dt * 700;
                        tile.shift += dt * tile.velocity;


                        tile.alpha -= dt * 8;
                        if (tile.alpha < 0) {
                            tile.alpha = 0;
                        }


                        if (tile.alpha === 0 || (tile.y * this.level.rowheight + tile.shift > (this.level.rows - 1) * this.level.rowheight + this.level.tileheight)) {
                            tile.type = -1;
                            tile.shift = 0;
                            tile.alpha = 1;
                        }
                    }

                }
            }

            if (!tilesleft) {

                this.nextBubble();
                let tilefound = false;

                for (let i = 0; i < this.level.columns; i++) {
                    for (let j = 0; j < this.level.rows; j++) {
                        if (this.level.tiles[i][j].type !== -1) {
                            tilefound = true;
                            break;
                        }
                    }
                }

                if (tilefound) {
                    setGameState(gamestates.ready);
                } else {
                    setGameState(gamestates.gamewin);
                    this.clearIntervalHandler();
                }
            }
        }
    }

    snapBubble = async () => {
        this.turncounter++;

        let centerx = this.player.bubble.x + this.level.tilewidth / 2;
        let centery = this.player.bubble.y + this.level.tileheight / 2;
        let colorBubble = this.player.tiletype;
        let gridpos = getGridPosition(centerx, centery, this.level, this.rowoffset);
        const data = { row: gridpos.y, column: gridpos.x, color: colorBubble + 1 } as {
            row: number,
            column: number,
            color: number
        };

        if (gridpos.x < 0) {
            gridpos.x = 0;
        }

        if (gridpos.x >= this.level.columns) {
            gridpos.x = this.level.columns - 1;

        }

        if (gridpos.y < 0) {
            gridpos.y = 0;
        }

        if (gridpos.y >= this.level.rows) {
            gridpos.y = this.level.rows - 1;
        }


        let addtile = false;
        if (this.level.tiles[gridpos.x][gridpos.y].type !== -1) {
            for (let newrow = gridpos.y + 1; newrow < this.level.rows; newrow++) {
                if (this.level.tiles[gridpos.x][newrow].type === -1) {
                    gridpos.y = newrow;
                    addtile = true;
                    break;
                }
            }
        } else {
            addtile = true;
        }


        if (addtile) {
            console.log('pop')
            this.player.bubble.visible = false;

            this.level.tiles[gridpos.x][gridpos.y].type = this.player.bubble.tiletype;


            if (await this.checkGameOver()) {
                return;
            }

            this.cluster = this.findCluster(gridpos.x, gridpos.y, true, true, false);

            if (this.cluster.length >= 3) {
                console.log('bloom')
                setGameState(gamestates.removecluster);
                return;
            }
        }

        // Next bubble
        this.nextBubble();
        setGameState(gamestates.ready);
    }

    // Get the closest grid position
    getGridPosition = (x: any, y: any) => {
        let gridy = Math.floor((y - this.level.y) / this.level.rowheight);

        // Check for offset
        let xoffset = 0;
        if ((gridy + this.rowoffset) % 2) {
            xoffset = this.level.tilewidth / 2;
        }
        let gridx = Math.floor(((x - xoffset) - this.level.x) / this.level.tilewidth);

        return { x: gridx, y: gridy };
    }

    checkGameOver = async () => {
        for (let i = 0; i < this.level.columns; i++) {
            if (this.level.tiles[i][this.level.rows - 1].type !== -1) {

                // Game over
                this.nextBubble();
                setGameState(gamestates.gameover);
                this.clearIntervalHandler()
                return true;
            }
        }
        return false;
    }

    clearIntervalHandler() {
        clearInterval(this.interval);
        console.log('__clear');
    }

    findCluster = (tx: any, ty: any, matchtype: any, reset: any, skipremoved: any) => {

        if (reset) {
            this.resetProcessed();
        }

        let targettile = this.level.tiles[tx][ty];
        let toprocess = [targettile];

        targettile.processed = true;
        let foundcluster = [];

        while (toprocess.length > 0) {

            let currenttile = toprocess.pop();


            if (currenttile?.type === -1) {
                continue;
            }

            if (skipremoved && currenttile?.removed) {
                continue;
            }

            if (!matchtype || (currenttile?.type === targettile.type)) {

                foundcluster.push(currenttile);
                let neighbors = this.getNeighbors(currenttile);

                for (let i = 0; i < neighbors.length; i++) {
                    if (!neighbors[i].processed) {

                        toprocess.push(neighbors[i]);
                        neighbors[i].processed = true;
                    }
                }
            }
        }

        // Return the found cluster
        return foundcluster;
    }

    // Find floating clusters
    findFloatingClusters = () => {
        // Reset the processed flags
        this.resetProcessed();

        let foundclusters = [];

        // Check all tiles
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                let tile = this.level.tiles[i][j];
                if (!tile.processed) {
                    // Find all attached tiles
                    let foundcluster = this.findCluster(i, j, false, false, true);

                    // There must be a tile in the cluster
                    if (foundcluster.length <= 0) {
                        continue;
                    }

                    // Check if the cluster is floating
                    let floating = true;
                    for (let k = 0; k < foundcluster.length; k++) {
                        if (foundcluster[k]?.y === 0) {
                            // Tile is attached to the roof
                            floating = false;
                            break;
                        }
                    }

                    if (floating) {
                        // Found a floating cluster
                        foundclusters.push(foundcluster);
                    }
                }
            }
        }

        return foundclusters;
    }

    // Reset the processed flags
    resetProcessed = () => {
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                this.level.tiles[i][j].processed = false;
            }
        }
    }

    // Reset the removed flags
    resetRemoved = () => {
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                this.level.tiles[i][j].removed = false;
            }
        }
    }

    // Get the neighbors of the specified tile
    getNeighbors = (tile: any) => {
        let tilerow = (tile.y + this.rowoffset) % 2; // Even or odd row
        let neighbors = [];

        // Get the neighbor offsets for the specified tile
        let n = this.neighborsoffsets[tilerow];

        // Get the neighbors
        for (let i = 0; i < n.length; i++) {
            // Neighbor coordinate
            let nx = tile.x + n[i][0];
            let ny = tile.y + n[i][1];

            // Make sure the tile is valid
            if (nx >= 0 && nx < this.level.columns && ny >= 0 && ny < this.level.rows) {
                neighbors.push(this.level.tiles[nx][ny]);
            }
        }

        return neighbors;
    }

    updateFps = (dt: any) => {
        if (this.fpstime > 0.25) {
            // Calculate fps
            this.fps = Math.round(this.framecount / this.fpstime);

            // Reset time and framecount
            this.fpstime = 0;
            this.framecount = 0;
        }

        // Increase time and framecount
        this.fpstime += dt;
        this.framecount++;
    }

    // Render the game
    render = () => {
        let yoffset = this.level.tileheight / 2;
        if (this.context !== null && this.context !== undefined) {
            // Draw level background
            this.context.fillStyle = "#242424";
            // context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 4 - yoffset);
            this.context.fillRect(0, 0, this.level.width + 8, this.level.height + 4 - yoffset);

            // Render tiles
            this.renderTiles();

            // Draw level bottom
            this.context.fillStyle = "#242424";
            this.context.fillRect(this.level.x - 4, this.level.y - 4 + this.level.height + 4 - yoffset, this.level.width + 8, 2 * this.level.tileheight + 3);
        }


        // Draw score
        const scoreElement = document.querySelector('.js-score .js-score_score');
        const scoreOverlay = document.querySelector('.js-notiOverlay-score_score');
        if (scoreElement !== null) scoreElement.innerHTML = this.score.toString()
        if (scoreOverlay !== null) scoreOverlay.innerHTML = this.score.toString()

        // Render cluster
        if (this.showcluster) {
            this.renderCluster(this.cluster, 255, 128, 128);

            for (let i = 0; i < this.floatingclusters.length; i++) {
                let col = Math.floor(100 + 100 * i / this.floatingclusters.length);
                this.renderCluster(this.floatingclusters[i], col, col, col);
            }
        }

        // Render player bubble
        this.renderPlayer();

        // Game Over overlay
        if (gamestate === gamestates.gameover || gamestate === gamestates.gamewin) {
            this.DOM.notiOverlay?.classList.add('noti');
        }
    }

    renderTiles = () => {
        // Top to bottom
        for (let j = 0; j < this.level.rows; j++) {
            for (let i = 0; i < this.level.columns; i++) {
                // Get the tile
                let tile = this.level.tiles[i][j];

                // Get the shift of the tile for animation
                let shift = tile.shift;

                // Calculate the tile coordinates
                let coord = this.getTileCoordinate(i, j);

                // Check if there is a tile present
                if (tile.type >= 0) {
                    if (this.context !== null && this.context !== undefined) {
                        // Support transparency
                        this.context.save();
                        this.context.globalAlpha = tile.alpha;

                        // Draw the tile using the color
                        this.drawBubble(coord.tilex, coord.tiley + shift, tile.type, false);

                        this.context.restore();
                    }
                }
            }
        }
    }

    // Render cluster
    renderCluster = (cluster: any, r: any, g: any, b: any) => {
        for (let i = 0; i < cluster.length; i++) {
            // Calculate the tile coordinates
            let coord = this.getTileCoordinate(cluster[i].x, cluster[i].y);

            if (this.context !== null && this.context !== undefined) {
                // Draw the tile using the color
                this.context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                this.context.fillRect(coord.tilex + this.level.tilewidth / 4, coord.tiley + this.level.tileheight / 4, this.level.tilewidth / 2, this.level.tileheight / 2);
            }
        }
    }

    // Render the player bubble
    renderPlayer = () => {
        let centerx = this.player.x + this.level.tilewidth / 2;
        let centery = this.player.y + this.level.tileheight / 2;

        let arrowWidth = 14; // Adjust the image width as needed
        let arrowHeight = 150; // Adjust the image height as needed

        if (this.context !== null && this.context !== undefined) {
            // Draw player background circle
            this.context.drawImage(this.currentBall, centerx - this.level.radius - 17, centery - this.level.radius - 17, 2 * (this.level.radius + 17), 2 * (this.level.radius + 17));

            // Draw the next bubble background circle
            this.context.drawImage(this.nextBall, this.player.nextbubble.x - 10, this.player.nextbubble.y - 2, 2 * (this.level.radius + 6), 2 * (this.level.radius + 5));

            let imageWidth = arrowWidth;
            let imageHeight = arrowHeight;


            let imageStartX = centerx;
            let imageStartY = centery;

            this.context.save();

            this.context.translate(imageStartX, imageStartY);
            this.context.rotate(degToRad(-this.player.angle + 85));

            this.context.drawImage(this.angleLineImage, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);

            this.context.restore();
        }

        // Draw the next bubble
        this.drawBubble(this.player.nextbubble.x + 4, this.player.nextbubble.y + 15, this.player.nextbubble.tiletype, true);

        // Draw the bubble
        if (this.player.bubble.visible) {
            this.drawBubble(this.player.bubble.x, this.player.bubble.y, this.player.bubble.tiletype, false);
        }

    }

    // Get the tile coordinate
    getTileCoordinate = (column: any, row: any) => {
        let tilex = this.level.x + column * this.level.tilewidth;

        // X offset for odd or even rows
        if ((row + this.rowoffset) % 2) {
            tilex += this.level.tilewidth / 2;
        }

        let tiley = this.level.y + row * this.level.rowheight;
        return { tilex: tilex, tiley: tiley };
    }

    // Draw the bubble
    drawBubble = (x: any, y: any, index: any, smallType: boolean) => {
        if (index < 0 || index >= this.bubblecolors)
            return;

        const bubbleWidth = this.level.tilewidth;
        const bubbleHeight = this.level.tileheight;
        const spriteWidth = 40;
        const spriteHeight = 40;

        if (this.context !== null && this.context !== undefined) {
            if (smallType === true) {
                // Draw the bubble sprite
                this.context.drawImage(this.bubbleimage, index * spriteWidth, 0, spriteWidth, spriteHeight, x, y, bubbleWidth / 1.6, bubbleHeight / 1.6);
            } else {
                // Draw the bubble sprite
                this.context.drawImage(this.bubbleimage, index * spriteWidth, 0, spriteWidth, spriteHeight, x, y, bubbleWidth, bubbleHeight);
            }
        }
    }

    // Start a new game
    newGame = () => {
        // Reset score
        this.score = 0;
        this.turncounter = 0;
        this.rowoffset = 0;

        // Set the gamestate to ready
        setGameState(gamestates.ready);

        // Create the level
        this.createLevel();

        // Init the next bubble and set the current bubble
        this.nextBubble();
        // this.startCountdown();
    }

    // Create a random level
    createLevel() {
        // Create a level with random tiles
        for (let j = 0; j < this.level.rows; j++) {
            let randomtile = randRange(0, this.bubblecolors - 1);
            let count = 0;
            for (let i = 0; i < this.level.columns; i++) {
                if (count >= 2) {
                    // Change the random tile
                    let newtile = randRange(0, this.bubblecolors - 2);

                    // Make sure the new tile is different from the previous tile
                    if (newtile === randomtile) {
                        newtile = (newtile + 1) % this.bubblecolors;
                    }
                    randomtile = newtile;
                    count = 0;
                }
                count += 2;

                if (j < this.level.rows / 2) {
                    this.level.tiles[i][j].type = randomtile;
                } else {
                    this.level.tiles[i][j].type = -1;
                }
            }
        }
    }

    generateShuffledColorPattern(length: any, seed: string, row: number) {
        const board = new Array(length);

        for (let j = 0; j < length; j++) {
            board[j] = (j % 5) + 1;
        }

        const n = board.length;
        let parity = 0;

        for (let i = n - 1; i > 0; i--) {
            let j = parseInt(((BigInt(seed) + BigInt(row.toString())) % BigInt(i + 1)).toString());
            [board[i], board[j]] = [board[j], board[i]];
            parity += i < j ? 1 : 0;
        }

        // Even Permutation Shuffle
        if (parity % 2 !== (n * n - 1) % 2) {
            let parityIdx1 = 0, parityIdx2 = 0;
            for (let i = 1; i < n - 1; i++) {
                if (board[i] === 0 || board[i + 1] === 0) {
                    continue;
                }
                parityIdx1 = i;
                parityIdx2 = i + 1;
                break;
            }
            [board[parityIdx1], board[parityIdx2]] = [
                board[parityIdx2],
                board[parityIdx1],
            ];
        }

        return board;
    }

    // Create a random bubble for the player
    nextBubble = () => {
        // Set the current bubble
        this.player.tiletype = this.player.nextbubble.tiletype;
        this.player.bubble.tiletype = this.player.nextbubble.tiletype;
        this.player.bubble.x = this.player.x;
        this.player.bubble.y = this.player.y;
        this.player.bubble.visible = true;

        // Get a random type from the existing colors
        const nextcolor = getExistingColor(this.bubblecolors, this.level);

        // Set the next bubble
        this.player.nextbubble.tiletype = nextcolor;
    }

    // Shoot the bubble
    shootBubble = () => {
        // Shoot the bubble in the direction of the mouse
        this.player.bubble.x = this.player.x;
        this.player.bubble.y = this.player.y;
        this.player.bubble.angle = this.player.angle;
        this.player.bubble.tiletype = this.player.tiletype;
        // Set the gamestate
        setGameState(gamestates.shootbubble);

    }

    // Check if two circles intersect
    circleIntersection = (x1: any, y1: any, r1: any, x2: any, y2: any, r2: any) => {
        // Calculate the distance between the centers
        let dx = x1 - x2;
        let dy = y1 - y2;
        let len = Math.sqrt(dx * dx + dy * dy);

        if (len < r1 + r2) {
            // Circles intersect
            return true;
        }

        return false;
    }

    // On mouse movement
    onMouseMove = (e: any) => {
        if (this.DOM.canvas !== null && this.DOM.canvas !== undefined) {
            // Get the mouse position
            let pos = getMousePos(this.DOM.canvas, e);

            // Get the mouse angle
            let mouseangle = radToDeg(Math.atan2((this.player.y + this.level.tileheight / 2) - pos.y, pos.x - (this.player.x + this.level.tilewidth / 2)));

            // Convert range to 0, 360 degrees
            if (mouseangle < 0) {
                mouseangle = 180 + (180 + mouseangle);
            }

            // // Restrict angle to 8, 172 degrees
            let lbound = 8;
            let ubound = 172;
            if (mouseangle > 90 && mouseangle < 270) {
                // Left
                if (mouseangle > ubound) {
                    mouseangle = ubound;
                }
            } else {
                // Right
                if (mouseangle < lbound || mouseangle >= 270) {
                    mouseangle = lbound;
                }
            }

            // Set the player angle
            this.player.angle = mouseangle;
        }

    }
    // On mouse button click
    onMouseDown = () => {

        if (gamestate === gamestates.ready) {
            this.shootBubble();
        } else if (gamestate === gamestates.gameover) {
            this.newGame();
        } else if (gamestate === gamestates.gamewin) {
            this.newGame();
        }
    }

    handleOverlayBtn =  () => {
         this.DOM.notiOverlay?.classList.remove('noti')
        this.newGame()
    }
}
