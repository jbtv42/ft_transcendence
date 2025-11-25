export type Place = {
  left: boolean;
  right: boolean;
};

export type Player = {
  name: string;
  rank: number;
  id: number;
  place: Place;
};

export type Platform = {
  x_up: number;
  y_up: number;
  width: number;
  height: number;
  delta_move: number;
};

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
};

export type GameState = {
  solo: boolean;
  mp: boolean;
  on: boolean;
  lScore: number;
  rScore: number;
  mScore: number;
  winner: Player | null;
};

export type KeysState = {
  w: boolean;
  s: boolean;
  up: boolean;
  down: boolean;
};

export type AI = {
  paddle: Platform,
  ball: Ball,
  dt: number
};

export type AiMove = -1 | 1 | 0;


class Timer {
    constructor(public counter = 3) {

        let intervalId = setInterval(() => {
            this.counter = this.counter - 1;
            console.log(this.counter)
            if(this.counter === 0) clearInterval(intervalId)
        }, 1000)
    }
}