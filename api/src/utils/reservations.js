import Ouvrage from '../models/Ouvrage.js';

const DUREE_RESERVATION_MS = 48 * 60 * 60 * 1000; // 48 heures

export const expirerReservations = async () => {
  const maintenant = new Date();
  const seuilExpiration = new Date(maintenant - DUREE_RESERVATION_MS);

  try {
    const result = await Ouvrage.updateMany(
      {
        'exemplaires.statut': 'reserve',
        'exemplaires.reserveLe': { $lt: seuilExpiration }
      },
      {
        $set: {
          'exemplaires.$[elem].statut': 'disponible',
          'exemplaires.$[elem].reservePar': null,
          'exemplaires.$[elem].reserveLe': null
        },
        $inc: { nbDisponibles: 1 }
      },
      {
        arrayFilters: [
          {
            'elem.statut': 'reserve',
            'elem.reserveLe': { $lt: seuilExpiration }
          }
        ]
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🔄 ${result.modifiedCount} réservation(s) expirée(s) libérée(s)`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'expiration des réservations:', error);
  }
};

export const demarrerBalayageReservations = () => {
  // Exécuter immédiatement
  expirerReservations();
  
  // Puis toutes les 10 minutes
  const interval = setInterval(expirerReservations, 10 * 60 * 1000);
  
  console.log('⏰ Balayage des réservations démarré (toutes les 10 min)');
  
  return () => clearInterval(interval);
};
