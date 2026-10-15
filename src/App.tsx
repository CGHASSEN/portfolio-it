import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { DataCenterEntrance } from "./components/entrance/DataCenterEntrance";
import { ProfileTerminal } from "./components/ProfileTerminal";
import { ProjectsCatalog } from "./components/ProjectsCatalog";
import { SectionHeading } from "./components/SectionHeading";
import {
  certifications,
  homeLab,
  skillGroups,
} from "./data/portfolio";
import { profile } from "./data/profile";
import { usePortfolioProjects } from "./hooks/usePortfolioProjects";
import type { PortfolioProject } from "./types/project";
import type { ProjectSourceStatus } from "./hooks/usePortfolioProjects";
import { AdminPage } from "./components/admin/AdminPage";

const UniverseExperience = lazy(() =>
  import("./components/universe/UniverseExperience").then((module) => ({
    default: module.UniverseExperience,
  })),
);

function App() {
  if (window.location.pathname.replace(/\/+$/, "") === "/admin") return <AdminPage />;
  return <PublicPortfolioApp />;
}

function PublicPortfolioApp() {
  const { projects, sourceStatus, sourceError } = usePortfolioProjects();
  const [stage, setStage] = useState<"entrance" | "universe" | "portfolio">("entrance");
  const [entranceLeaving, setEntranceLeaving] = useState(false);
  const [portfolioSection, setPortfolioSection] = useState<string | undefined>();
  const transitionStarted = useRef(false);

  useEffect(() => {
    if (!entranceLeaving) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 900;
    const timer = window.setTimeout(() => {
      setStage("universe");
      setEntranceLeaving(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [entranceLeaving]);

  const finishEntrance = useCallback(() => {
    if (transitionStarted.current) return;
    transitionStarted.current = true;
    setEntranceLeaving(true);
  }, []);

  const openPortfolio = useCallback((section?: string) => {
    setPortfolioSection(section);
    setStage("portfolio");
  }, []);

  const returnToEntrance = useCallback(() => {
    transitionStarted.current = false;
    setEntranceLeaving(false);
    setStage("entrance");
  }, []);

  return (
    stage === "entrance" ? (
      <DataCenterEntrance
        isLeaving={entranceLeaving}
        onComplete={finishEntrance}
      />
    ) : stage === "universe" ? (
      <Suspense fallback={<div aria-live="polite" className="universe-loading">INITIALIZING UNIVERSE…</div>}>
        <UniverseExperience
          onOpenPortfolio={openPortfolio}
          onReturnToEntrance={returnToEntrance}
          projects={projects}
        />
      </Suspense>
    ) : (
      <div className="portfolio-reveal">
        <PortfolioContent
          initialSection={portfolioSection}
          projects={projects}
          sourceError={sourceError}
          sourceStatus={sourceStatus}
        />
      </div>
    )
  );
}

function PortfolioContent({
  initialSection,
  projects,
  sourceStatus,
  sourceError,
}: {
  initialSection?: string;
  projects: PortfolioProject[];
  sourceStatus: ProjectSourceStatus;
  sourceError: string;
}) {
  useEffect(() => {
    if (!initialSection) return;
    const timer = window.setTimeout(() => {
      document.getElementById(initialSection)?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">
        <section aria-labelledby="hero-title" className="hero section-shell" id="accueil">
          <div className="hero__copy">
            <ProfileTerminal />
            <p className="eyebrow hero__eyebrow">
              <span className="status-dot" />
              {profile.role.toUpperCase()}
            </p>
            <p className="hero__profile-name">{profile.name || "Nom à renseigner"}</p>
            <h1 id="hero-title">
              Construire des systèmes <span>fiables.</span>
            </h1>
            <p className="hero__intro">
              {profile.introduction || "Présentation professionnelle à renseigner."}
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#projets">
                Découvrir mes projets <span aria-hidden="true">↗</span>
              </a>
              {profile.cvUrl ? (
                <a className="text-link" href={profile.cvUrl} target="_blank" rel="noreferrer">
                  Consulter mon CV <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="hero__cv-placeholder">CV disponible — fichier PDF à intégrer</span>
              )}
              <a className="text-link" href="#apropos">
                En savoir plus <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero__meta">
              <span>{profile.situation.toUpperCase()}</span>
              <span className="hero__meta-divider" />
              <span>{(profile.location || "LOCALISATION À RENSEIGNER").toUpperCase()}</span>
            </div>
          </div>

          <div aria-label="Illustration d’une infrastructure réseau connectée" className="network-card" role="img">
            <div className="network-card__top">
              <span>INFRASTRUCTURE / OVERVIEW</span>
              <span className="network-card__live"><span className="status-dot" /> DEMO TOPOLOGY</span>
            </div>
            <div className="network-map">
              <svg aria-hidden="true" className="network-map__lines" viewBox="0 0 440 320">
                <path d="M220 78v52M220 130H104v50M220 130h116v50M104 230h232M104 230v34M336 230v34" />
                <path d="M220 130v100" />
              </svg>
              <div className="network-node network-node--core">
                <span className="node-icon">⌘</span>
                <strong>CORE</strong>
                <small>10.0.0.1</small>
              </div>
              <div className="network-node network-node--directory">
                <span className="node-icon">▤</span>
                <strong>AD / DNS</strong>
                <small>10.0.10.10</small>
              </div>
              <div className="network-node network-node--router">
                <span className="node-icon">⌁</span>
                <strong>ROUTER</strong>
                <small>VLAN 10 · 20 · 30</small>
              </div>
              <div className="network-node network-node--linux">
                <span className="node-icon">_</span>
                <strong>LINUX</strong>
                <small>10.0.20.20</small>
              </div>
              <div className="network-node network-node--client">
                <span className="node-icon">▣</span>
                <strong>CLIENTS</strong>
                <small>DHCP · VLAN 30</small>
              </div>
            </div>
            <div className="network-card__bottom">
              <span><i className="legend-dot legend-dot--green" /> Services actifs</span>
              <span><i className="legend-dot legend-dot--blue" /> Réseau segmenté</span>
            </div>
            <span className="network-card__caption">SCHÉMA DE DÉMONSTRATION · NON CONTRACTUEL</span>
          </div>

          <a aria-label="Défiler vers la section à propos" className="scroll-cue" href="#apropos">
            <span />
          </a>
        </section>

        <section aria-labelledby="about-title" className="section-shell section-block about" id="apropos">
          <div className="about__index">01 <span>/ PROFIL</span></div>
          <div className="about__content">
            <SectionHeading
              eyebrow="À PROPOS"
              title="La technique, au service du quotidien."
              id="about-title"
            />
            <div className="about__columns">
              <p className="about__lead">
                {profile.aboutLead || "Présentation personnelle à renseigner."}
              </p>
              <div className="about__body">
                <p>{profile.about || "Parcours et expérience à renseigner."}</p>
                <p>
                  {profile.workApproach || "Méthode de travail et objectifs professionnels à renseigner."}
                </p>
                <p><strong>Objectif :</strong> {profile.objective}</p>
                <a className="text-link" href="#contact">
                  Parlons de votre besoin <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="skills-title" className="section-block section-block--muted" id="competences">
          <div className="section-shell">
            <SectionHeading
              eyebrow="BOÎTE À OUTILS"
              title="Compétences techniques"
              description="Renseignez les technologies et compétences que vous maîtrisez réellement."
              id="skills-title"
            />
            <div className="skills-grid">
              {skillGroups.map((group) => (
                <article className="skill-card" key={group.number}>
                  <div className="skill-card__top">
                    <span>{group.number}</span>
                    <span className="skill-card__symbol" aria-hidden="true">↗</span>
                  </div>
                  <h3>{group.title}</h3>
                  {group.skills.length > 0 ? (
                    <ul>
                      {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
                    </ul>
                  ) : (
                    <p className="skill-card__placeholder">Compétences à renseigner</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="projects-title" className="section-shell section-block" id="projets">
          <div className="section-heading-row">
            <SectionHeading
              eyebrow="SÉLECTION"
              title="Projets IT"
              description="Des cas pratiques conçus pour explorer des problématiques concrètes d’infrastructure."
              id="projects-title"
            />
            <span className="demo-label"><span className="status-dot" /> PROJETS PUBLIÉS & DÉMONSTRATIONS</span>
          </div>
          <ProjectsCatalog projects={projects} sourceError={sourceError} sourceStatus={sourceStatus} />
          <p className="section-note">
            Les maquettes de démonstration sont explicitement signalées. Les projets ajoutés à l’administration n’apparaissent ici qu’après publication.
          </p>
        </section>

        <section aria-labelledby="lab-title" className="section-block homelab" id="homelab">
          <div className="section-shell homelab__layout">
            <div className="homelab__copy">
              <SectionHeading
                eyebrow="LABORATOIRE PERSONNEL"
                title="Comprendre en construisant."
                description={homeLab.description}
                id="lab-title"
              />
              <ul className="lab-features">
                {homeLab.technologies.map((technology, index) => (
                  <li key={technology}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{technology}</strong><small>Technologie utilisée dans le HomeLab.</small></div>
                  </li>
                ))}
              </ul>
              <p className="lab-disclaimer">{homeLab.topologyNote}</p>
            </div>
            <div className="rack-card">
              <div className="rack-card__header"><span>LAB / TOPOLOGY</span><span>V. 01.0</span></div>
              <div className="rack">
                <div className="rack__unit rack__unit--router"><span className="rack__glyph">⌁</span><span><strong>ROUTEUR / FIREWALL</strong><small>INTER-VLAN · FILTRAGE</small></span><i /></div>
                <div className="rack__unit rack__unit--switch"><span className="rack__glyph">⠿</span><span><strong>SWITCH MANAGÉ</strong><small>VLAN 10 / 20 / 30</small></span><i /></div>
                <div className="rack__unit rack__unit--server"><span className="rack__glyph">▤</span><span><strong>HYPERVISEUR</strong><small>HÔTES VIRTUALISÉS</small></span><i /></div>
                <div className="rack__unit rack__unit--storage"><span className="rack__glyph">▥</span><span><strong>STOCKAGE / BACKUP</strong><small>SAUVEGARDE DE LAB</small></span><i /></div>
              </div>
              <div className="rack-card__footer">
                <span><i className="legend-dot legend-dot--green" /> LAB DE DÉMONSTRATION</span>
                <span>PLAN LOGIQUE</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="certifications-title" className="section-shell section-block certifications" id="certifications">
          <SectionHeading
            eyebrow="PARCOURS"
            title="Certifications & formations"
            description="Diplôme, formations et certifications communiqués."
            id="certifications-title"
          />
          <div className="certification-grid">
            {certifications.map((item) => (
              <article className="certification-card" key={item.title}>
                <span className="certification-card__icon" aria-hidden="true">↗</span>
                <div>
                  <span className="certification-card__status">{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="section-note">Les éléments dont le statut ou l’intitulé reste à confirmer sont signalés ; seuls les éléments explicitement indiqués comme obtenus sont présentés ainsi.</p>
        </section>

        <section aria-labelledby="contact-title" className="contact section-block" id="contact">
          <div className="section-shell contact__inner">
            <div className="contact__content">
              <p className="eyebrow">ET SI ON EN PARLAIT ?</p>
              <h2 id="contact-title">Un projet, une équipe,<br /><span>une prochaine étape.</span></h2>
              <p className="contact__description">
                Vous recrutez un profil systèmes et réseaux ou souhaitez
                échanger sur une opportunité ? Je serais ravi d’en discuter.
              </p>
              {profile.email ? (
                <a className="button button--primary" href={`mailto:${profile.email}?subject=Prise%20de%20contact%20-%20Portfolio`}>
                  Écrire un e-mail <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <p className="contact__placeholder">Adresse e-mail professionnelle à renseigner.</p>
              )}
              {profile.phone && (
                <p className="contact__placeholder">
                  Téléphone : <a href={`tel:${profile.phone.replace(/\s+/g, "")}`}>{profile.phone}</a>
                </p>
              )}
              {profile.professionalLinks.length > 0 && (
                <ul className="contact__links">
                  {profile.professionalLinks.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} rel="noreferrer" target="_blank">{link.label} ↗</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div aria-hidden="true" className="contact__orb">
              <span /><span /><span />
              <div>SYS<br /><b>&</b><br />NET</div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="section-shell site-footer__inner">
          <a className="brand" href="#accueil">
            <span className="brand__mark" aria-hidden="true"><span /><span /><span /></span>
            <span>SYS<span className="brand__accent">/</span>NET</span>
          </a>
          <p>Portfolio de démonstration · Informations à personnaliser</p>
          <div className="site-footer__links">
            <a href="/admin">Administration</a>
            <a className="site-footer__top" href="#accueil">Retour en haut ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
