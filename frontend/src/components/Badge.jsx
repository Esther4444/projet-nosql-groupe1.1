const LABELS = {
  disponible: "Disponible",
  emprunte:   "Emprunté",
  reserve:    "Réservé",
  rendu:      "Rendu",
  en_cours:   "En cours",
  retard:     "En retard",
};

/**
 * Badge de statut avec point lumineux animé.
 * statut: "disponible" | "emprunte" | "reserve" | "rendu" | "en_cours" | "retard"
 */
export default function Badge({ statut, label }) {
  return (
    <span className={`badge badge-${statut}`}>
      {label ?? LABELS[statut] ?? statut}
    </span>
  );
}
