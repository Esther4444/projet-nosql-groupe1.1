import { useState } from "react";
import { api } from "../api.js";
import { toast } from "../components/Toast.jsx";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ matricule: "", mot_de_passe: "", nom: "", prenom: "", email: "" });

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const soumettre = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login({ matricule: form.matricule, mot_de_passe: form.mot_de_passe });
        localStorage.setItem("token", data.token);
        toast("Connexion réussie", "succes");
        onLogin(data.user);
      } else {
        const data = await api.register({ ...form, type: "etudiant" }); // Forcé côté front aussi par sécurité/cohérence
        // Pas de connexion auto (le compte est inactif)
        toast(data.message || "Inscription réussie, attendez la validation d'un admin.", "succes");
        setIsLogin(true); // Redirige vers le login
      }
    } catch (err) {
      toast(err.message, "erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--fond)", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", background: "var(--surface-3)", padding: 12, borderRadius: 16, marginBottom: 16 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40, color: "var(--or)" }}>menu_book</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ivoire)", marginBottom: 8 }}>
            Bibliothèque UOB
          </h1>
          <p style={{ fontSize: 14, color: "var(--gris-doux)" }}>
            {isLogin ? "Connectez-vous à votre compte" : "Demande d'inscription étudiante"}
          </p>
        </div>

        <form onSubmit={soumettre} className="form-grid" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Matricule</label>
            <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "100%" }}>
              <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>badge</span>
              <input className="form-input" style={{ paddingLeft: 38 }} required value={form.matricule} onChange={maj("matricule")} placeholder="Ex: UOB-ET-2024-101" />
            </div>
          </div>

          {!isLogin && (
            <>
              <div style={{ display: "flex", gap: 14 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nom</label>
                  <input className="form-input" required value={form.nom} onChange={maj("nom")} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Prénom</label>
                  <input className="form-input" required value={form.prenom} onChange={maj("prenom")} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "100%" }}>
                  <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>mail</span>
                  <input className="form-input" style={{ paddingLeft: 38 }} type="email" value={form.email} onChange={maj("email")} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "100%" }}>
              <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>lock</span>
              <input className="form-input" style={{ paddingLeft: 38 }} type="password" required value={form.mot_de_passe} onChange={maj("mot_de_passe")} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 12, height: 48, fontSize: 15, width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? <span className="spinner" /> : isLogin ? "Se connecter" : "Soumettre la demande"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--gris-doux)" }}>
          {isLogin ? "Étudiant non inscrit ?" : "Déjà un compte ?"}
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: "inline-block", padding: "0 6px", color: "var(--bleu-accent)", fontWeight: 700 }}
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin ? "Demander une inscription" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
