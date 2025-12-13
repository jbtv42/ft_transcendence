import { WIDTH, HEIGHT } from "./constants.js";

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  const px = clamp(cx, rx, rx + rw);
  const py = clamp(cy, ry, ry + rh);
  const dx = cx - px;
  const dy = cy - py;
  return dx * dx + dy * dy <= r * r;
}

export function resetBall(match, dir) {
  match.ballX = WIDTH / 2;
  match.ballY = HEIGHT / 2;
  const base = 4;
  match.vx = base * dir;
  match.vy = (Math.random() * 2 - 1) * 2.5;
}

export function speedUp(match) {
  const cap = 9;
  const s = Math.hypot(match.vx, match.vy);
  if (s < cap) {
    match.vx *= 1.03;
    match.vy *= 1.03;
  }
}
