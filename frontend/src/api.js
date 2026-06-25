// Client API — avec gestion JWT
async function call(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res  = await fetch(`/api${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    // Session invalide (token expiré, utilisateur supprimé après seed, etc.)
    if (res.status === 401 || (res.status === 404 && path.startsWith("/auth/"))) {
      localStorage.removeItem("token");
      // Pas de toast au démarrage (vérification silencieuse via /auth/me)
      if (!path.startsWith("/auth/me")) {
        window.dispatchEvent(new Event("auth-expired"));
      }
    }
    throw new Error(data.erreur || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  login:    (body) => call("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => call("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me:       ()     => call("/auth/me"),

  // ── Ouvrages ─────────────────────────────────────────────────────────────
  ouvrages: (params = {}) => {
    const q = new URLSearchParams();
    if (params.q)          q.set("q",          params.q);
    if (params.categorie)  q.set("categorie",  params.categorie);
    if (params.disponible) q.set("disponible", "true");
    const qs = q.toString();
    return call(`/ouvrages${qs ? `?${qs}` : ""}`);
  },
  ouvrage:          (id)   => call(`/ouvrages/${id}`),
  categories:       ()     => call("/ouvrages/categories"),
  creerOuvrage:     (body) => call("/ouvrages", { method: "POST", body: JSON.stringify(body) }),
  majOuvrage:       (id, body) => call(`/ouvrages/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  supprimerOuvrage: (id)   => call(`/ouvrages/${id}`, { method: "DELETE" }),

  ajouterExemplaire: (id, body) =>
    call(`/ouvrages/${id}/exemplaires`, { method: "POST", body: JSON.stringify(body) }),
  supprimerExemplaire: (id, code) =>
    call(`/ouvrages/${id}/exemplaires/${code}`, { method: "DELETE" }),

  reserver: (id, code, adherentId) =>
    call(`/ouvrages/${id}/exemplaires/${code}/reserver`, {
      method: "POST",
      body: JSON.stringify({ adherentId }),
    }),
  annulerReservation: (id, code, adherentId) =>
    call(`/ouvrages/${id}/exemplaires/${code}/annuler-reservation`, {
      method: "POST",
      body: JSON.stringify({ adherentId }),
    }),

  // ── Adhérents ────────────────────────────────────────────────────────────
  adherents:        (params = {}) => {
    const q = new URLSearchParams();
    if (params.q)    q.set("q",    params.q);
    if (params.type) q.set("type", params.type);
    const qs = q.toString();
    return call(`/adherents${qs ? `?${qs}` : ""}`);
  },
  adherent:         (id)   => call(`/adherents/${id}`),
  empruntsAdherent: (id, params = {}) => {
    const q = new URLSearchParams();
    if (params.statut) q.set("statut", params.statut);
    if (params.page)   q.set("page",   params.page);
    const qs = q.toString();
    return call(`/adherents/${id}/emprunts${qs ? `?${qs}` : ""}`);
  },
  creerAdherent:     (body) => call("/adherents", { method: "POST", body: JSON.stringify(body) }),
  majAdherent:       (id, body) => call(`/adherents/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  validerAdherent:   (id)   => call(`/adherents/${id}/valider`, { method: "PUT" }),
  refuserAdherent:   (id, motif) => call(`/adherents/${id}/refuser`, { method: "PUT", body: JSON.stringify({ motif }) }),
  supprimerAdherent: (id)   => call(`/adherents/${id}`, { method: "DELETE" }),

  // ── Emprunts ─────────────────────────────────────────────────────────────
  emprunts: (params = {}) => {
    const q = new URLSearchParams();
    if (params.statut)   q.set("statut",   params.statut);
    if (params.adherent) q.set("adherent", params.adherent);
    if (params.retard)   q.set("retard",   "true");
    if (params.q)        q.set("q",        params.q);
    if (params.page)     q.set("page",     params.page);
    if (params.limit)    q.set("limit",    params.limit);
    const qs = q.toString();
    return call(`/emprunts${qs ? `?${qs}` : ""}`);
  },
  emprunter: (ouvrageId, adherentId, exemplaireCode) =>
    call("/emprunts", {
      method: "POST",
      body: JSON.stringify({ ouvrageId, adherentId, exemplaireCode }),
    }),
  rendre: (id) => call(`/emprunts/${id}/retour`, { method: "POST" }),

  // ── Stats ─────────────────────────────────────────────────────────────────
  topOuvrages:     () => call("/stats/top-ouvrages"),
  topCategories:   () => call("/stats/top-categories"),
  dashboard:       () => call("/stats/dashboard"),
  health:          () => call("/health"),
};
