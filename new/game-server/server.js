import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

import { createProfileService } from "./src/service/profileService.js";
import { createFriendsService } from "./src/service/friendsService.js";

import { registerProfileRoutes } from "./src/routes/profileRoutes.js";
import { registerFriendsRoutes } from "./src/routes/friendsRoutes.js";


import { config } from "./src/infra/config.js";
import { initDb } from "./src/infra/db.js";

import { ensureSchema } from "./src/repo/schema.js";

import { createAuthService } from "./src/service/authService.js";
import { createGameService } from "./src/service/gameService.js";

import { registerAuthRoutes } from "./src/routes/authRoutes.js";
import { registerGameRoutes } from "./src/routes/gameRoutes.js";
import { registerGameWsRoutes } from "./src/routes/gameWsRoutes.js";
import { createChatService } from "./src/service/chatService.js";
import { registerChatRoutes } from "./src/routes/chatRoutes.js";



import { TICK_HZ } from "./src/domain/game/constants.js";

const app = Fastify({ logger: true });

await app.register(cookie, { secret: config.COOKIE_SECRET });
await app.register(websocket);
await app.register(multipart);


const dbCtx = initDb(config.DB_PATH);
ensureSchema(dbCtx.db);

const chatService = createChatService(dbCtx);
const authService = createAuthService(dbCtx);
const gameService = createGameService(dbCtx);
const profileService = createProfileService(dbCtx);
const friendsService = createFriendsService(dbCtx);


app.get("/api/health", async () => ({ ok: true }));

registerAuthRoutes(app, { authService });
registerGameRoutes(app, { authService, gameService });
registerGameWsRoutes(app, { authService, gameService });
registerProfileRoutes(app, { authService, profileService });
registerFriendsRoutes(app, { authService, friendsService });
registerChatRoutes(app, { authService, chatService });


setInterval(() => {
  try {
    gameService.tickAll();
  } catch (e) {
    app.log.error(e);
  }
}, 1000 / TICK_HZ);

app.listen({ port: config.API_PORT, host: "0.0.0.0" });

/*
repo structure :
  - domain : Game rules/structures/architecture
  - infra : Fastify plugin, DB connections ...
  - repo : DB queries
  - routes : Api links
  - service : App rt response
*/
