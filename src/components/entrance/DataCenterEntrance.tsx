import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { DataCenterScene } from "./DataCenterScene";
import { EntranceFallback } from "./EntranceFallback";
import "./entrance.css";

type DataCenterEntranceProps = {
  isLeaving: boolean;
  onComplete: () => void;
};

function supportsWebGL() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return context !== null;
}

export function DataCenterEntrance({
  isLeaving,
  onComplete,
}: DataCenterEntranceProps) {
  const [webglAvailable] = useState(supportsWebGL);
  const [entering, setEntering] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [status, setStatus] = useState("SECURE FACILITY");
  const started = useRef(false);

  useEffect(() => {
    if (!entering) return;
    const unlocked = window.setTimeout(() => setStatus("LOCK RELEASED"), 720);
    const cleared = window.setTimeout(() => setStatus("ACCESS GRANTED"), 1500);
    const fallbackComplete = sceneReady
      ? undefined
      : window.setTimeout(onComplete, 2800);
    return () => {
      window.clearTimeout(unlocked);
      window.clearTimeout(cleared);
      if (fallbackComplete !== undefined) window.clearTimeout(fallbackComplete);
    };
  }, [entering, onComplete, sceneReady]);

  const beginEntry = () => {
    if (started.current) return;
    started.current = true;
    setEntering(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
    }
  };

  return (
    <div className={`entrance${entering ? " entrance--entering" : ""}${isLeaving ? " entrance--leaving" : ""}`}>
      <div className="entrance__canvas" aria-hidden="true">
        {webglAvailable ? (
          <Canvas
            camera={{ fov: 40, near: 0.1, far: 70, position: [0, 2.8, 11.5] }}
            dpr={[1, 1.5]}
            frameloop="demand"
            fallback={<EntranceFallback unlocked={entering} />}
            gl={{ alpha: false, antialias: true, powerPreference: "low-power" }}
            onCreated={() => setSceneReady(true)}
          >
            <DataCenterScene entering={entering} onEnter={beginEntry} onComplete={onComplete} />
          </Canvas>
        ) : (
          <EntranceFallback unlocked={entering} />
        )}
      </div>
      <div className="entrance__vignette" aria-hidden="true" />
      <div className="entrance__topline">
        <div aria-label="SYS/NET" className="brand">
          <span className="brand__mark" aria-hidden="true"><span /><span /><span /></span>
          <span>SYS<span className="brand__accent">/</span>NET</span>
        </div>
        <span className="entrance__coordinates">INFRASTRUCTURE ACCESS / 01</span>
      </div>
      <div className="entrance__facility">
        <span className={`entrance__state${entering ? " entrance__state--active" : ""}`}>
          <i /> {status}
        </span>
        <span className="entrance__facility-name">SYSTEMS · NETWORKS · SECURITY</span>
      </div>
      <div className="entrance__prompt">
        <h1>Welcome to <span>My Universe</span></h1>
        <p className="entrance__welcome-fr" lang="fr">Bienvenue dans mon univers</p>
        <p className="entrance__welcome-ar" dir="rtl" lang="ar">مرحباً بكم في عالمي</p>
        <p className="entrance__instruction">
          {entering ? "ACCESS SEQUENCE INITIATED" : "DOUBLE-CLICK TO ENTER"}
        </p>
        <button
          className="entrance__button"
          disabled={entering}
          onClick={beginEntry}
          type="button"
        >
          {entering ? "OUVERTURE EN COURS…" : "Entrer dans mon univers"}
          <span aria-hidden="true">{entering ? "···" : "↗"}</span>
        </button>
        <span className="entrance__hint">
          Double-clic sur la porte · Entrée ou Espace · Bouton tactile
        </span>
      </div>
      <div className="entrance__bottomline" aria-hidden="true">
        <span>SCÈNE DE DÉMONSTRATION</span>
        <span><i /> STATUS SIMULÉ</span>
      </div>
    </div>
  );
}
