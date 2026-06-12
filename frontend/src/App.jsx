import { useEffect, useState } from "react";
import { api } from "./api.js";
import { Toast, toast } from "./components/Toast.jsx";
import Auth       from "./pages/Auth.jsx";
import Dashboard  from "./pages/Dashboard.jsx";
import Catalogue  from "./pages/Catalogue.jsx";
import Emprunts   from "./pages/Emprunts.jsx";
import Adherents  from "./pages/Adherents.jsx";
import Stats      from "./pages/Stats.jsx";
import "./styles.css";

const ALL_NAV = [
  { id: "dashboard",  label: "Tableau de bord",  icon: "dashboard",  subtitle: "Vue d'ensemble",      adminOnly: true },
  { id: "catalogue",  label: "Catalogue",         icon: "auto_stories", subtitle: "Ouvrages & exemplaires", adminOnly: false },
  { id: "emprunts",   label: "Mes emprunts",      icon: "import_contacts", subtitle: "Prêts & historique",     adminOnly: false },
  { id: "adherents",  label: "Adhérents",          icon: "school", subtitle: "Étudiants & enseignants", adminOnly: true },
  { id: "stats",      label: "Statistiques",       icon: "bar_chart", subtitle: "Top 10 & agrégations",  adminOnly: true },
];

const PAGE_META = {
  dashboard:  { title: "Tableau de bord",          sub: "Vue synthétique de la bibliothèque" },
  catalogue:  { title: "Catalogue documentaire",   sub: "Parcourez les ouvrages" },
  emprunts:   { title: "Registre des emprunts",    sub: "Suivi des prêts en cours et historique" },
  adherents:  { title: "Gestion des adhérents",    sub: "Étudiants (14 j) et enseignants (30 j)" },
  stats:      { title: "Statistiques",             sub: "Métriques et Top 10" },
};

export default function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [page, setPage]               = useState("catalogue");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retards, setRetards]         = useState(0);

  // Vérifier la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    api.me()
      .then((u) => {
        setUser(u);
        setPage(u.role === "admin" ? "dashboard" : "catalogue");
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Déconnexion auto si token expiré
  useEffect(() => {
    const onLogout = () => { setUser(null); toast("Session expirée, veuillez vous reconnecter", "erreur"); };
    window.addEventListener("auth-expired", onLogout);
    return () => window.removeEventListener("auth-expired", onLogout);
  }, []);

  const chargerRetards = () => {
    if (!user || user.role !== "admin") return;
    api.emprunts({ retard: true, limit: 1 })
      .then((res) => setRetards(Array.isArray(res) ? res.length : res.total ?? 0))
      .catch(() => setRetards(0));
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      chargerRetards();
      const t = setInterval(chargerRetards, 60_000);
      return () => clearInterval(t);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setPage("catalogue");
  };

  if (authLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><span className="spinner" /></div>;
  }

  if (!user) {
    return (
      <>
        <Auth onLogin={(u) => {
          setUser(u);
          setPage(u.role === "admin" ? "dashboard" : "catalogue");
        }} />
        <Toast />
      </>
    );
  }

  const navigate = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  const navItems = ALL_NAV.filter(item => !item.adminOnly || user.role === "admin");
  if (user.role === "admin") {
    const emp = navItems.find(i => i.id === "emprunts");
    if (emp) emp.label = "Tous les emprunts";
  }

  const meta = PAGE_META[page] || { title: "Biblio", sub: "" };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Ouvrir le menu">
        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>{sidebarOpen ? "close" : "menu"}</span>
      </button>

      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99, backdropFilter: "blur(2px)" }} onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app-layout">
        {/* ══ SIDEBAR ══════════════════════════════════════════ */}
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`} role="navigation">
          <div className="sidebar-logo">
            <div className="sidebar-logo-badge"><span className="material-symbols-rounded" style={{ fontSize: 24, color: "var(--bleu-nuit)" }}>local_library</span></div>
            <div className="sidebar-logo-title">Bibliothèque</div>
            <div className="sidebar-logo-sub">Université Omar Bongo</div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item${page === item.id ? " active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon"><span className="material-symbols-rounded" style={{ fontSize: 20 }}>{item.icon}</span></span>
                <span>{item.label}</span>
                {item.id === "emprunts" && user.role === "admin" && retards > 0 && (
                  <span className="nav-badge">{retards > 99 ? "99+" : retards}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-label">Compte actif</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: user.role === "admin"
                    ? "linear-gradient(135deg, var(--or), var(--or-clair))"
                    : "linear-gradient(135deg, var(--bleu-clair), var(--bleu-accent))",
                  color: user.role === "admin" ? "var(--bleu-nuit)" : "var(--blanc)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}
              >
                {(user.prenom[0] ?? "") + (user.nom[0] ?? "")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ivoire)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.prenom} {user.nom}
                </div>
                <div style={{ fontSize: 11, color: user.role === "admin" ? "var(--or)" : "var(--gris-doux)", fontWeight: 600 }}>
                  {user.role === "admin" ? "Bibliothécaire" : "Membre"}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", color: "var(--rouge-clair)", gap: 6 }} onClick={handleLogout}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>logout</span>
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* ══ CONTENU PRINCIPAL ════════════════════════════════ */}
        <div className="main-content">
          <header className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">{meta.title}</h1>
              <p className="page-subtitle">{meta.sub}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gris-doux)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--vert)", boxShadow: "0 0 6px var(--vert)", animation: "pulse-dot 2s infinite" }} />
              API connectée
            </div>
          </header>

          <main className="page-body">
            {page === "dashboard" && user.role === "admin" && <Dashboard onNavigate={navigate} />}
            {page === "catalogue" && <Catalogue user={user} />}
            {page === "emprunts"  && <Emprunts user={user} />}
            {page === "adherents" && user.role === "admin" && <Adherents adherents={[]} onChange={() => {}} />}
            {page === "stats"     && user.role === "admin" && <Stats />}
          </main>
        </div>
      </div>
      <Toast />
    </>
  );
}
