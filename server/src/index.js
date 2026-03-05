const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
require("./config/database");
const { requireAuth } = require("./middleware/authMiddleware");

const usuarioRoutes = require("./routes/usuarioRoutes");
const datoInicialPolloRoutes = require("./routes/datoInicialPolloRoutes");
const beneficioPolloRoutes = require("./routes/beneficioPolloRoutes");
const informeFinalCamadaRoutes = require("./routes/informeFinalCamadaRoutes");

const app = express();
const configuredPort = Number(process.env.PORT || 3001);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: false,
  }),
);
app.use(helmet());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta mas tarde." },
});

app.use("/api/usuarios/login", authLimiter);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/datos-iniciales", requireAuth, datoInicialPolloRoutes);
app.use("/api/beneficios-pollo", requireAuth, beneficioPolloRoutes);
app.use("/api/informes-finales-camada", requireAuth, informeFinalCamadaRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

const startServer = (initialPort) => {
  const maxAttempts = 20;
  let attempt = 0;
  let currentPort = initialPort;

  const tryListen = () => {
    const server = app.listen(currentPort, () => {
      if (attempt > 0) {
        console.warn(
          `Puerto original ocupado. Servidor iniciado en puerto alterno ${currentPort}.`,
        );
      }
      console.log(`Server listening at http://localhost:${currentPort}`);
    });

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE" && attempt < maxAttempts) {
        attempt += 1;
        currentPort += 1;
        console.warn(
          `Puerto en uso detectado. Reintentando en ${currentPort}...`,
        );
        tryListen();
        return;
      }

      console.error("No se pudo iniciar el servidor:", err);
      process.exit(1);
    });
  };

  tryListen();
};

startServer(configuredPort);
