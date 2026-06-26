import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import des routes
import authRoutes from './src/routes/auth.js';
import adherentsRoutes from './src/routes/adherents.js';
import ouvragesRoutes from './src/routes/ouvrages.js';
import empruntsRoutes from './src/routes/emprunts.js';
import statsRoutes from './src/routes/stats.js';

// Import des utilitaires
import { demarrerBalayageReservations } from './src/utils/reservations.js';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs des requêtes en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/adherents', adherentsRoutes);
app.use('/api/ouvrages', ouvragesRoutes);
app.use('/api/emprunts', empruntsRoutes);
app.use('/api/stats', statsRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Bibliothèque UOB opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à MongoDB et démarrage du serveur
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB (biblio_uob)');
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 API démarrée sur http://localhost:${PORT}`);
      console.log(`📚 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });

    // Démarrer le balayage automatique des réservations expirées
    demarrerBalayageReservations();
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  });

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  console.log('\n⏹️  Arrêt du serveur...');
  await mongoose.connection.close();
  console.log('✅ Connexion MongoDB fermée');
  process.exit(0);
});
