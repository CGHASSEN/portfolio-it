import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { DatacenterWorld } from "./DatacenterWorld";
import { profile } from "../../data/profile";
import { rooms } from "../../data/rooms";
import type { Room, RoomId } from "../../data/rooms";
import { networkTopology } from "../../data/networkTopology";
import { skillGroups } from "../../data/portfolio";
import type { PortfolioProject } from "../../types/project";
import "./universe.css";

type UniverseExperienceProps = {
  onOpenPortfolio: (section?: string) => void;
  onReturnToEntrance: () => void;
  projects: PortfolioProject[];
};

type Mode = "identity" | "corridor" | "network";
type NetworkTopologyId = (typeof networkTopology)[number]["id"];

const identityMessages = [
  "INITIALIZING IDENTITY SYSTEM...",
  "IDENTITY VERIFIED",
  "LOADING PROFESSIONAL PROFILE...",
  "SYSTEM READY",
];

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return context !== null;
  } catch {
    return false;
  }
}

function IdentityTerminal({
  ready,
  countdown,
  onEnter,
}: {
  ready: boolean;
  countdown: number | null;
  onEnter: () => void;
}) {
  const [messageCount, setMessageCount] = useState(0);
  const [status, setStatus] = useState("IDENTITY CHECK");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setMessageCount(identityMessages.length);
      return;
    }
    const timer = window.setInterval(() => {
      setMessageCount((count) => {
        if (count >= identityMessages.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 540);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setStatus("ACCESS AUTHORIZED · DEMO"), 380);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div className="identity-console">
      <div className="identity-console__top">
        <span><i /> IDENTITY TERMINAL / 01</span>
        <span className="identity-console__secure">PROFILE ACCESS</span>
      </div>
      <div aria-live="polite" className="identity-console__sequence">
        {identityMessages.slice(0, messageCount).map((message, index) => (
          <p className={index === messageCount - 1 ? "identity-console__line--active" : ""} key={message}>
            <span aria-hidden="true">&gt;</span> {message}
          </p>
        ))}
        {messageCount < identityMessages.length && <span className="identity-console__cursor" />}
      </div>
      <div className="identity-console__body">
        <div className="identity-console__portrait">
          <img alt="Photo de Ghassen Chihaoui" src="/images/ghassen-profile.jpeg" />
          <i />
        </div>
        <div className="identity-console__profile">
          <p className="eyebrow">TECHNICIAN / INFRASTRUCTURE</p>
          <h1>{profile.name || "Nom à renseigner"}</h1>
          <h2>{profile.role}</h2>
          <p className="identity-console__bio">{profile.introduction || "Présentation professionnelle à renseigner."}</p>
          {skillGroups.some((group) => group.skills.length > 0) ? (
            <div className="identity-console__skills">
              {skillGroups.slice(0, 3).flatMap((group) => group.skills.slice(0, 3)).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className="identity-console__cv-note">COMPÉTENCES À RENSEIGNER</p>
          )}
        </div>
      </div>
      <div className="identity-console__footer">
        <div className="identity-console__status"><i /> {status}</div>
        <div className="identity-console__actions">
          {profile.cvUrl ? (
            <a className="universe-button universe-button--quiet" href={profile.cvUrl} rel="noreferrer" target="_blank">
              VIEW MY CV <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <button
              aria-label="CV indiqué comme disponible, mais aucun fichier PDF n’est intégré au projet"
              className="universe-button universe-button--quiet"
              disabled
              type="button"
            >
              VIEW MY CV · FICHIER À INTÉGRER
            </button>
          )}
          <button className="universe-button universe-button--primary" disabled={!ready} onClick={onEnter} type="button">
            {ready ? "ENTER THE DATACENTER" : "INITIALIZING..."} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      {countdown !== null && (
        <p aria-live="polite" className="identity-console__countdown">
          ENTRÉE AUTOMATIQUE DANS <b>00:{String(countdown).padStart(2, "0")}</b> · CLIQUEZ POUR ENTRER MAINTENANT
        </p>
      )}
      <p className="identity-console__disclaimer">SÉQUENCE ET INDICATEURS FICTIFS · PROFIL FOURNI PAR LE CANDIDAT</p>
    </div>
  );
}

function DoorPanel({
  room,
  onClose,
  onEnter,
  onOpenPortfolio,
  projects,
}: {
  room: Room;
  onClose: () => void;
  onEnter: () => void;
  onOpenPortfolio: (section?: string) => void;
  projects: PortfolioProject[];
}) {
  return (
    <section aria-labelledby="door-panel-title" aria-modal="true" className="room-panel" role="dialog">
      <button aria-label="Fermer le panneau" className="room-panel__close" onClick={onClose} type="button">×</button>
      <p className="eyebrow">DESTINATION / {room.number}</p>
      <h2 id="door-panel-title">{room.label}</h2>
      <p className="room-panel__subtitle">{room.subtitle}</p>
      <p className="room-panel__description">{room.description}</p>
      {room.id === "projects" ? (
        <>
          <div className="room-panel__projects">
            {projects.filter((project) => project.status === "published").map((project) => (
              <details className="archive-project" key={project.id}>
                <summary>
                  <span>{project.category}{project.isExample ? " · DÉMO FICTIVE" : ""}</span>
                  <strong>{project.title}</strong>
                </summary>
                <p>{project.description}</p>
                <b>OBJECTIF</b><p>{project.objective || "À compléter."}</p>
                <b>TECHNOLOGIES</b>
                <p className="archive-project__tags">{project.technologies.join(" · ") || "À compléter."}</p>
                <b>ÉTAPES</b>
                {project.steps.length > 0
                  ? <ol>{project.steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ol>
                  : <p>À compléter.</p>}
                <b>RÉSULTATS</b><p>{project.results || "À compléter."}</p>
                {project.coverImage && <img alt={`Illustration du projet ${project.title}`} loading="lazy" src={project.coverImage} />}
                {project.screenshots.map((image, index) => (
                  <a className="archive-project__image" href={image} key={image} rel="noreferrer" target="_blank">
                    <img alt={`Capture ${index + 1} du projet ${project.title}`} loading="lazy" src={image} />
                  </a>
                ))}
                <div className="archive-project__links">
                  {project.repositoryUrl && <a href={project.repositoryUrl} rel="noreferrer" target="_blank">DÉPÔT ↗</a>}
                  {project.demoUrl && <a href={project.demoUrl} rel="noreferrer" target="_blank">DÉMONSTRATION ↗</a>}
                  {project.date && <span>{project.date}</span>}
                </div>
              </details>
            ))}
          </div>
          {projects.filter((project) => project.status === "published").length === 0 && (
            <p className="room-panel__pending">Aucun projet publié pour le moment.</p>
          )}
          <button className="universe-button universe-button--quiet" onClick={() => onOpenPortfolio("projets")} type="button">
            OUVRIR LE CATALOGUE COMPLET <span aria-hidden="true">↗</span>
          </button>
        </>
      ) : room.id === "network" ? (
        <button className="universe-button universe-button--primary" onClick={onEnter} type="button">
          OUVRIR LA SALLE RÉSEAU <span aria-hidden="true">↗</span>
        </button>
      ) : (
        <>
          <p className="room-panel__pending">Espace préparé — contenu détaillé à compléter avec des éléments vérifiables.</p>
          <button className="universe-button universe-button--quiet" onClick={() => onOpenPortfolio(sectionForRoom(room.id))} type="button">
            CONSULTER LE PORTFOLIO <span aria-hidden="true">↗</span>
          </button>
        </>
      )}
    </section>
  );
}

function sectionForRoom(id: RoomId) {
  switch (id) {
    case "server": return "competences";
    case "network": return "competences";
    case "virtualization": return "homelab";
    case "cybersecurity": return "competences";
    case "projects": return "projets";
    case "certifications": return "certifications";
    case "contact": return "contact";
  }
}

export function UniverseExperience({ onOpenPortfolio, onReturnToEntrance, projects }: UniverseExperienceProps) {
  const [webglAvailable] = useState(canUseWebGL);
  const [mode, setMode] = useState<Mode>("identity");
  const [transition, setTransition] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomId | null>(null);
  const [nearRoom, setNearRoom] = useState<Room | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [identityReady, setIdentityReady] = useState(false);
  const [identityCountdown, setIdentityCountdown] = useState<number | null>(null);
  const [activeNetworkNode, setActiveNetworkNode] = useState<NetworkTopologyId>(networkTopology[0].id);
  const [fallbackMode, setFallbackMode] = useState(false);
  const transitionLock = useRef(false);
  const fallbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (identityReady || fallbackMode) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2400;
    const timer = window.setTimeout(() => setIdentityReady(true), duration);
    return () => window.clearTimeout(timer);
  }, [identityReady, fallbackMode]);

  useEffect(() => {
    if (mode !== "identity" || !webglAvailable) return;
    fallbackTimer.current = window.setTimeout(() => setFallbackMode(true), 8000);
    return () => {
      if (fallbackTimer.current !== undefined) window.clearTimeout(fallbackTimer.current);
    };
  }, [mode, webglAvailable]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRoom(null);
        setMenuOpen(false);
        setMove(null);
        if (mode === "network" && !transitionLock.current) {
          transitionLock.current = true;
          setMode("corridor");
          window.setTimeout(() => {
            transitionLock.current = false;
          }, 600);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode]);

  const startCorridor = useCallback(() => {
    if (transitionLock.current || mode !== "identity") return;
    transitionLock.current = true;
    setIdentityCountdown(null);
    setIdentityReady(true);
    if (
      !webglAvailable ||
      fallbackMode ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMode("corridor");
      transitionLock.current = false;
      return;
    }
    setTransition(true);
  }, [fallbackMode, mode, webglAvailable]);

  useEffect(() => {
    if (mode !== "identity" || !identityReady || transition || menuOpen) {
      setIdentityCountdown(null);
      return;
    }

    const endTime = Date.now() + 10_000;
    setIdentityCountdown(10);
    const interval = window.setInterval(() => {
      setIdentityCountdown(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    }, 1000);
    const timer = window.setTimeout(() => startCorridor(), 10_000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [identityReady, menuOpen, mode, startCorridor, transition]);

  const arriveInCorridor = useCallback(() => {
    setMode("corridor");
    setTransition(false);
    transitionLock.current = false;
  }, []);

  const enterRoom = useCallback((room: Room) => {
    setSelectedRoom(room.id);
    setMenuOpen(false);
  }, []);

  const openNetwork = useCallback(() => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setMode("network");
    window.setTimeout(() => {
      transitionLock.current = false;
    }, 2000);
  }, []);

  const goToRoom = (room: Room) => {
    setSelectedRoom(room.id);
    setNearRoom(room);
    setMenuOpen(false);
    if (room.id === "network") openNetwork();
  };

  const backToCorridor = () => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setMode("corridor");
    setSelectedRoom(null);
    window.setTimeout(() => {
      transitionLock.current = false;
    }, 600);
  };

  const returnToIdentity = () => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setSelectedRoom(null);
    setMode("identity");
    setMenuOpen(false);
    window.setTimeout(() => {
      transitionLock.current = false;
    }, 1900);
  };

  const setMove = (key: string | null) => {
    window.dispatchEvent(new CustomEvent("universe-move", { detail: key }));
  };

  const selectRoom = (room: Room) => setSelectedRoom(room.id);

  return (
    <div className={`universe${mode === "identity" ? " universe--identity" : ""}${mode === "corridor" ? " universe--corridor" : ""}${transition ? " universe--transitioning" : ""}`}>
      {webglAvailable && !fallbackMode ? (
        <Canvas
          aria-label="Scène 3D interactive du datacenter"
          camera={{ fov: 56, near: 0.1, far: 90, position: [0, 2.3, 8] }}
          className="universe__canvas"
          dpr={[1, 1.35]}
          frameloop="always"
          gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
          onCreated={() => {
            if (fallbackTimer.current !== undefined) window.clearTimeout(fallbackTimer.current);
          }}
        >
          <DatacenterWorld
            activeNetworkNode={activeNetworkNode}
            mode={mode}
            onCorridorReady={arriveInCorridor}
            onEnterRoom={enterRoom}
            onProximity={setNearRoom}
            onSelectRoom={selectRoom}
            selectedRoom={selectedRoom}
            transition={transition}
          />
        </Canvas>
      ) : (
        <>
          <div className="universe__fallback-art" aria-hidden="true">
            <div className="universe__fallback-rack universe__fallback-rack--left" />
            <div className="universe__fallback-rack universe__fallback-rack--right" />
            <div className="universe__fallback-perspective" />
          </div>
          {fallbackMode && mode !== "identity" && (
            <div className="universe__fallback-notice" role="status">
              Navigation 3D indisponible — utilisez le plan du site pour ouvrir les salles.
            </div>
          )}
        </>
      )}

      <div aria-hidden="true" className="universe__shade" />
      <header className="universe__header">
        <span className="universe__brand"><b>SYS</b><i>/</i>NET</span>
        <span className="universe__location">{mode === "identity" ? "ENTRY TERMINAL / 01" : mode === "network" ? "NETWORK OPERATIONS / ROOM 02" : "DATACENTER / MAIN CORRIDOR"}</span>
        <span className="universe__system-status"><i /> {transition ? "ACCÈS EN COURS" : "SYSTÈME EN LIGNE"}</span>
        <button className="universe__menu-trigger" onClick={() => setMenuOpen((open) => !open)} type="button">
          {menuOpen ? "FERMER" : "PLAN DU SITE"} <span aria-hidden="true">{menuOpen ? "×" : "☷"}</span>
        </button>
      </header>

      {mode === "identity" && !transition && (
        <div className="universe__identity-anchor">
          <IdentityTerminal
            countdown={identityCountdown}
            onEnter={startCorridor}
            ready={identityReady}
          />
        </div>
      )}

      {transition && (
        <div aria-live="polite" className="universe__transition-status" role="status">
          <span>ACCÈS AUTORISÉ</span>
          <b>OUVERTURE DU COULOIR PRINCIPAL</b>
          <i />
        </div>
      )}

      {mode === "corridor" && (
        <>
          <div className="universe__corridor-heading">
            <p className="eyebrow">FACILITY / LEVEL 01</p>
            <h1>DATACENTER <span>OPERATIONS</span></h1>
            <p>Explore les salles ou choisis directement une destination.</p>
          </div>
          <div className="universe__controls">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> SE DÉPLACER</span>
            <span><kbd>CLIC + GLISSER</kbd> ORIENTER</span>
            <span><kbd>E</kbd> INTERAGIR <kbd>ÉCHAP</kbd> FERMER</span>
          </div>
          {nearRoom && !selectedRoom && (
            <button className="universe__near-prompt" onClick={() => enterRoom(nearRoom)} type="button">
              <i /> {nearRoom.number} / {nearRoom.label} <kbd>E</kbd> OU CLIQUER
            </button>
          )}
          <div className="universe__mobile-controls" aria-label="Commandes tactiles">
            <button aria-label="Avancer" onPointerDown={() => setMove("w")} onPointerUp={() => setMove(null)} onPointerLeave={() => setMove(null)} type="button">↑</button>
            <div>
              <button aria-label="Aller à gauche" onPointerDown={() => setMove("a")} onPointerUp={() => setMove(null)} onPointerLeave={() => setMove(null)} type="button">←</button>
              <button aria-label="Reculer" onPointerDown={() => setMove("s")} onPointerUp={() => setMove(null)} onPointerLeave={() => setMove(null)} type="button">↓</button>
              <button aria-label="Aller à droite" onPointerDown={() => setMove("d")} onPointerUp={() => setMove(null)} onPointerLeave={() => setMove(null)} type="button">→</button>
            </div>
          </div>
          <button className="universe__leave" onClick={() => onOpenPortfolio("accueil")} type="button">
            PORTFOLIO <span aria-hidden="true">↗</span>
          </button>
        </>
      )}

      {mode === "network" && (
        <section aria-labelledby="network-room-title" className="network-room-panel">
          <p className="eyebrow">SALLE 02 / NETWORK OPERATIONS</p>
          <h1 id="network-room-title">Network <span>operations</span></h1>
          <p className="network-room-panel__intro">Compétences réseau — niveau et réalisations à compléter selon votre parcours réel.</p>
          <div aria-label="Topologie réseau de démonstration" className="network-topology">
            <p className="network-topology__heading">TOPOLOGIE LOGIQUE / DÉMONSTRATION</p>
            <div className="network-topology__core">
              {networkTopology.slice(0, 2).map((node) => (
                <button
                  aria-pressed={activeNetworkNode === node.id}
                  className={`network-topology__node${activeNetworkNode === node.id ? " is-active" : ""}`}
                  key={node.id}
                  onClick={() => setActiveNetworkNode(node.id)}
                  type="button"
                >
                  <span>{node.kind}</span>
                  <b>{node.label}</b>
                  <small>{node.address}</small>
                </button>
              ))}
            </div>
            <div className="network-topology__branches">
              {networkTopology.slice(2).map((node) => (
                <button
                  aria-pressed={activeNetworkNode === node.id}
                  className={`network-topology__node${activeNetworkNode === node.id ? " is-active" : ""}`}
                  key={node.id}
                  onClick={() => setActiveNetworkNode(node.id)}
                  type="button"
                >
                  <span>{node.kind}</span>
                  <b>{node.label}</b>
                  <small>{node.address}</small>
                </button>
              ))}
            </div>
            <p aria-live="polite" className="network-topology__detail">
              {networkTopology.find((node) => node.id === activeNetworkNode)?.detail}
            </p>
          </div>
          <div className="network-room-panel__grid">
            {["VLAN & segmentation", "Routage & commutation", "Adressage IP", "DNS & DHCP", "Architecture réseau", "Supervision", "Diagnostic & dépannage", "Journalisation réseau"].map((skill, index) => (
              <article key={skill}><span>0{index + 1}</span><strong>{skill}</strong><i /></article>
            ))}
          </div>
          <p className="network-room-panel__note">MAQUETTE FICTIVE · ADRESSES TEST-NET RÉSERVÉES AUX EXEMPLES · PARCOURS À PERSONNALISER</p>
          <button className="universe-button universe-button--primary" onClick={() => onOpenPortfolio("competences")} type="button">
            EXPLORER LES COMPÉTENCES <span aria-hidden="true">↗</span>
          </button>
          <button className="universe-button universe-button--quiet" onClick={backToCorridor} type="button">
            ← RETOUR AU COULOIR
          </button>
        </section>
      )}

      {selectedRoom && mode === "corridor" && (
        <DoorPanel
          onClose={() => setSelectedRoom(null)}
          onEnter={openNetwork}
          onOpenPortfolio={onOpenPortfolio}
          projects={projects}
          room={rooms.find((room) => room.id === selectedRoom) ?? rooms[0]}
        />
      )}

      {menuOpen && (
        <nav aria-label="Navigation rapide dans l’univers" className="universe-map">
          <p className="eyebrow">ACCÈS RAPIDE / CHOISIR UNE DESTINATION</p>
          <div className="universe-map__rooms">
            {rooms.map((room) => (
              <button key={room.id} onClick={() => goToRoom(room)} type="button">
                <span>{room.number}</span><b>{room.label}</b><i>↗</i>
              </button>
            ))}
          </div>
          <div className="universe-map__footer">
            <button onClick={returnToIdentity} type="button">IDENTITÉ / TERMINAL</button>
            <button onClick={() => onOpenPortfolio("apropos")} type="button">PROFIL / PORTFOLIO</button>
            <button onClick={() => onOpenPortfolio("projets")} type="button">PORTFOLIO COMPLET ↗</button>
            <button onClick={onReturnToEntrance} type="button">RETOUR À L’ENTRÉE</button>
          </div>
        </nav>
      )}

      {mode === "identity" && (
        <button className="universe__portfolio-shortcut" onClick={() => onOpenPortfolio("apropos")} type="button">
          ACCÈS DIRECT AU PORTFOLIO <span aria-hidden="true">↗</span>
        </button>
      )}
      <span className="universe__simulation-label">ENVIRONNEMENT 3D DE DÉMONSTRATION</span>
    </div>
  );
}
