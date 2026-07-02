var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_http = __toESM(require("http"), 1);
var import_socket = require("socket.io");

// src/utils/terrain.ts
var import_simplex_noise = require("simplex-noise");

// src/store.ts
var Store = class {
  constructor() {
    this.seed = 0;
    this.players = /* @__PURE__ */ new Map();
    this.modifiedBlocks = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    // Local active block selection
    this.selectedBlockType = 1;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
  setSeed(seed) {
    this.seed = seed;
  }
  setPlayer(id, state) {
    this.players.set(id, state);
    this.emit();
  }
  removePlayer(id) {
    this.players.delete(id);
    this.emit();
  }
  setModifiedBlock(x, y, z, type) {
    this.modifiedBlocks.set(`${x},${y},${z}`, type);
    this.emit();
  }
};
var gameStore = new Store();

// src/utils/terrain.ts
function alea(seed) {
  let s = seed;
  return function() {
    s = Math.sin(s) * 1e4;
    return s - Math.floor(s);
  };
}
var noise2D;
var noise3D;
var globalSeed = 0;
function initTerrainGenerator(seed) {
  globalSeed = seed;
  const prng = alea(seed);
  noise2D = (0, import_simplex_noise.createNoise2D)(prng);
  noise3D = (0, import_simplex_noise.createNoise3D)(prng);
}
function getTerrainHeightAndType(x, z) {
  if (!noise2D) return { height: 10, biome: "forest" };
  const elNoise = noise2D(x * 0.015, z * 0.015);
  const detailNoise = noise2D(x * 0.05, z * 0.05) * 0.2;
  const height = Math.floor((elNoise + detailNoise + 1) * 8) + 5;
  const moisture = (noise2D(x * 0.02, z * 0.02) + 1) * 0.5;
  let biome = "forest";
  if (height >= 15) {
    biome = "mountain";
  } else if (moisture < 0.38) {
    biome = "desert";
  }
  return { height, biome };
}

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const server = import_http.default.createServer(app);
  const io = new import_socket.Server(server, {
    cors: { origin: "*" }
  });
  const players = /* @__PURE__ */ new Map();
  const modifiedBlocks = /* @__PURE__ */ new Map();
  const seed = Math.random();
  initTerrainGenerator(seed);
  const getGroundHeight = (x, z) => {
    const rx = Math.round(x);
    const rz = Math.round(z);
    for (let y = 30; y >= 0; y--) {
      const key = `${rx},${y},${rz}`;
      if (modifiedBlocks.has(key)) {
        if (modifiedBlocks.get(key) !== 0) return y + 1;
        continue;
      }
      const { height } = getTerrainHeightAndType(rx, rz);
      if (y <= height) {
        return y + 1;
      }
    }
    return 1;
  };
  const mobs = [];
  const mobTypes = ["pig", "creeper", "zombie"];
  for (let i = 0; i < 12; i++) {
    const type = mobTypes[i % mobTypes.length];
    const x = 16 + Math.random() * 32;
    const z = 16 + Math.random() * 32;
    const groundY = getGroundHeight(x, z);
    mobs.push({
      id: `mob_${i}`,
      type,
      position: [x, groundY, z],
      rotation: [0, Math.random() * Math.PI * 2, 0]
    });
  }
  setInterval(() => {
    const delta = 0.1;
    const GRAVITY = 15;
    mobs.forEach((mob) => {
      if (!mob.targetPos || Math.random() < 0.05) {
        mob.targetPos = [
          mob.position[0] + (Math.random() - 0.5) * 12,
          mob.position[2] + (Math.random() - 0.5) * 12
        ];
      }
      const dx = mob.targetPos[0] - mob.position[0];
      const dz = mob.targetPos[1] - mob.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        const speed = mob.type === "pig" ? 1.5 : mob.type === "zombie" ? 1 : 1.2;
        mob.position[0] += dx / dist * speed * delta;
        mob.position[2] += dz / dist * speed * delta;
        mob.rotation[1] = Math.atan2(dx, dz);
      } else {
        mob.targetPos = void 0;
      }
      mob.position[1] -= GRAVITY * delta;
      const groundY = getGroundHeight(mob.position[0], mob.position[2]);
      if (mob.position[1] < groundY) {
        mob.position[1] = groundY;
      }
    });
    io.emit("mobsUpdate", mobs);
  }, 100);
  io.on("connection", (socket) => {
    players.set(socket.id, { id: socket.id, position: [0, 50, 0], rotation: [0, 0, 0] });
    socket.emit("init", {
      seed,
      players: Array.from(players.values()),
      modifiedBlocks: Array.from(modifiedBlocks.entries()),
      mobs
    });
    socket.broadcast.emit("playerJoin", players.get(socket.id));
    socket.on("move", (data) => {
      if (players.has(socket.id)) {
        const p = players.get(socket.id);
        p.position = data.position;
        p.rotation = data.rotation;
        socket.broadcast.emit("playerMove", { id: socket.id, position: data.position, rotation: data.rotation });
      }
    });
    socket.on("setBlock", (data) => {
      const key = `${data.x},${data.y},${data.z}`;
      modifiedBlocks.set(key, data.type);
      socket.broadcast.emit("blockChanged", data);
    });
    socket.on("disconnect", () => {
      players.delete(socket.id);
      socket.broadcast.emit("playerLeave", socket.id);
    });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
