import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/db.js";
import authRouter from "./src/routes/auth.js";
import ouvragesRouter from "./src/routes/ouvrages.js";
import adherentsRouter from "./src/routes/adherents.js";
import empruntsRouter from "./src/routes/emprunts.js";
import statsRouter from "./src/routes/stats.js";
import { auth } from "./src/middlewares/auth.js";

dotenv.config();
const app = express();

// ── Sécurité & middleware de base ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

// ── Log simple des requêtes (sans dépendance externe) ────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ── Routes API ───────────────────────────────────────────────────────────────
app.use("/api/auth",       authRouter);
app.use("/api/ouvrages",   auth, ouvragesRouter);
app.use("/api/adherents",  auth, adherentsRouter);
app.use("/api/emprunts",   auth, empruntsRouter);
app.use("/api/stats",      auth, statsRouter);

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "biblio-uob-api" });
});

// ── Gestionnaire d'erreurs global ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERREUR]", err.message || err);
  if (err.name === "ValidationError") {
    return res.status(422).json({ erreur: "Données invalides", détail: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ erreur: "Identifiant invalide" });
  }
  res.status(500).json({ erreur: "Erreur interne du serveur" });
});

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`\n✅ API Bibliothèque UOB → http://localhost:${PORT}\n`)
  );
}).catch((err) => {
  console.error("❌ Connexion MongoDB échouée :", err.message);
  process.exit(1);
});
