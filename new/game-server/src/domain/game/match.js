import { WIDTH, HEIGHT } from "./constants.js";

export class Match {
  constructor(code) {
    this.code = code;

    /** @type {{ socket: any, user: any, side: 'left'|'right', paddleY: number, inputDir: number }[]} */
    this.players = [];

    this.ballX = WIDTH / 2;
    this.ballY = HEIGHT / 2;
    this.vx = 4;
    this.vy = 2.5;

    this.scoreLeft = 0;
    this.scoreRight = 0;

    this.startedAt = Date.now();
    this.ended = false;

    this.status = "waiting";
    this.winner = null;
  }
}
