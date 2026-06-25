import { useState } from "react";
import { api } from "../api.js";
import { toast } from "../components/Toast.jsx";

// Redimensionne et compresse une image en data URL base64 (JPEG) côté client,
// pour rester sous la limite d'envoi et alléger le stockage de la carte.
function compresserImage(file, maxDim = 1100, qualite = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualite));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    matricule: "", mot_de_passe: "", nom: "", prenom: "", email: "", type: "etudiant", carte: "",
  });
  const [carteNom, setCarteNom] = useState("");

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleCarte = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Veuillez sélectionner un fichier image (JPG, PNG…).", "erreur");
      return;
    }
    try {
      const base64 = await compresserImage(file);
      setForm((f) => ({ ...f, carte: base64 }));
      setCarteNom(file.name);
    } catch {
      toast("Impossible de lire cette image.", "erreur");
    }
  };

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
        if (!form.carte) {
          toast(
            `Veuillez joindre votre ${form.type === "enseignant" ? "carte professionnelle" : "carte étudiant"}.`,
            "erreur"
          );
          setLoading(false);
          return;
        }
        const data = await api.register({
          matricule: form.matricule,
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          mot_de_passe: form.mot_de_passe,
          type: form.type,
          carte: form.carte,
        });
        // Pas de connexion auto (le compte est inactif)
        toast(data.message || "Inscription réussie, attendez la validation d'un admin.", "succes");
        setForm({ matricule: "", mot_de_passe: "", nom: "", prenom: "", email: "", type: "etudiant", carte: "" });
        setCarteNom("");
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
            {isLogin ? "Connectez-vous à votre compte" : "Demande d'inscription"}
          </p>
        </div>

        <form onSubmit={soumettre} className="form-grid" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Matricule</label>
            <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "100%" }}>
              <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>badge</span>
              <input className="form-input" style={{ paddingLeft: 38 }} required value={form.matricule} onChange={maj("matricule")} placeholder={isLogin ? "Ex: UOB-ET-2024-101" : form.type === "enseignant" ? "Ex: UOB-EN-2019-007" : "Ex: UOB-ET-2024-101"} />
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
                <label className="form-label">Profil</label>
                <div className="type-switch" role="group" aria-label="Type d'adhérent">
                  <button
                    type="button"
                    className={`type-switch-option${form.type === "etudiant" ? " active" : ""}`}
                    onClick={() => setForm({ ...form, type: "etudiant" })}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>school</span>
                    Étudiant
                    <span className="type-switch-hint">14 jours</span>
                  </button>
                  <button
                    type="button"
                    className={`type-switch-option${form.type === "enseignant" ? " active" : ""}`}
                    onClick={() => setForm({ ...form, type: "enseignant" })}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>co_present</span>
                    Enseignant
                    <span className="type-switch-hint">30 jours</span>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <div className="search-input-wrapper" style={{ width: "100%", maxWidth: "100%" }}>
                  <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>mail</span>
                  <input className="form-input" style={{ paddingLeft: 38 }} type="email" value={form.email} onChange={maj("email")} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {form.type === "enseignant" ? "Carte professionnelle" : "Carte étudiant"} (justificatif)
                </label>
                <label className={`carte-upload${form.carte ? " has-file" : ""}`}>
                  <input type="file" accept="image/*" onChange={handleCarte} hidden />
                  {form.carte ? (
                    <>
                      <img src={form.carte} alt="Aperçu de la carte" className="carte-preview" />
                      <div className="carte-upload-info">
                        <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--vert-clair)" }}>check_circle</span>
                        <span className="carte-upload-name">{carteNom || "Carte ajoutée"}</span>
                        <span className="carte-upload-hint">Cliquez pour changer</span>
                      </div>
                    </>
                  ) : (
                    <div className="carte-upload-empty">
                      <span className="material-symbols-rounded" style={{ fontSize: 28, color: "var(--bleu-accent)" }}>add_photo_alternate</span>
                      <span className="carte-upload-text">
                        Téléverser votre {form.type === "enseignant" ? "carte professionnelle" : "carte étudiant"}
                      </span>
                      <span className="carte-upload-hint">JPG, PNG — preuve de votre statut</span>
                    </div>
                  )}
                </label>
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
          {isLogin ? "Étudiant ou enseignant non inscrit ?" : "Déjà un compte ?"}
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
