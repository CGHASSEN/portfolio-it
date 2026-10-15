import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { projectImageBucket, supabase, supabaseConfigured } from "../../lib/supabase";
import type { ManagedProject, ProjectStatus } from "../../types/project";
import "./admin.css";

type AdminStatus = "loading" | "unconfigured" | "signed-out" | "checking" | "mfa-challenge" | "mfa-enroll" | "mfa-restart" | "not-admin" | "admin" | "error";

type ProjectRow = {
  id: string;
  sort_order: number;
  title: string;
  description: string;
  objective: string;
  technologies: string[];
  steps: string[];
  results: string;
  cover_image_path: string | null;
  screenshot_paths: string[];
  repository_url: string | null;
  demo_url: string | null;
  category: string;
  project_date: string | null;
  status: ProjectStatus;
  created_at: string;
};

const emptyProject: ManagedProject = {
  id: "",
  orderIndex: 0,
  title: "",
  description: "",
  objective: "",
  technologies: [],
  steps: [],
  results: "",
  coverImage: "",
  screenshots: [],
  coverImagePath: "",
  screenshotPaths: [],
  repositoryUrl: "",
  demoUrl: "",
  category: "PROJET IT",
  date: "",
  status: "draft",
};

function mapProject(row: ProjectRow): ManagedProject {
  return {
    id: row.id,
    orderIndex: row.sort_order,
    title: row.title,
    description: row.description,
    objective: row.objective,
    technologies: row.technologies ?? [],
    steps: row.steps ?? [],
    results: row.results,
    coverImage: "",
    screenshots: [],
    coverImagePath: row.cover_image_path ?? "",
    screenshotPaths: row.screenshot_paths ?? [],
    repositoryUrl: row.repository_url ?? "",
    demoUrl: row.demo_url ?? "",
    category: row.category,
    date: row.project_date ?? "",
    status: row.status,
  };
}

function filePath(projectId: string, file: File) {
  const safeName = file.name.replace(/[^\w.-]+/g, "-");
  return `${projectId}/${crypto.randomUUID()}-${safeName}`;
}

export function AdminPage() {
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<ManagedProject[]>([]);
  const [form, setForm] = useState<ManagedProject>(emptyProject);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [pendingFactorIds, setPendingFactorIds] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inspectSessionRef = useRef<(nextSession: Session | null, force?: boolean) => Promise<void>>(async () => undefined);

  const enrollTotpFactor = async () => {
    const client = supabase;
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const enrollment = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Administration du portfolio",
    });
    if (enrollment.error) throw new Error(`Enrôlement MFA impossible : ${enrollment.error.message}`);

    const challenge = await client.auth.mfa.challenge({ factorId: enrollment.data.id });
    if (challenge.error) throw new Error(`Initialisation du code MFA impossible : ${challenge.error.message}`);

    return {
      factorId: enrollment.data.id,
      challengeId: challenge.data.id,
      qrCode: enrollment.data.totp.qr_code,
    };
  };

  useEffect(() => {
    let active = true;
    setCoverPreviewUrl("");
    const client = supabase;
    if (!form.coverImagePath || !client) return () => { active = false; };

    const loadCoverPreview = async () => {
      const { data, error: previewError } = await client.storage
        .from(projectImageBucket)
        .createSignedUrl(form.coverImagePath, 60 * 60);
      if (!active) return;
      if (previewError) {
        setError(`Impossible de charger l’aperçu de la couverture : ${previewError.message}`);
        return;
      }
      setCoverPreviewUrl(data.signedUrl);
    };

    void loadCoverPreview().catch((caught: unknown) => {
      if (active) {
        setError(caught instanceof Error
          ? `Impossible de charger l’aperçu de la couverture : ${caught.message}`
          : "Impossible de charger l’aperçu de la couverture.");
      }
    });

    return () => {
      active = false;
    };
  }, [form.coverImagePath]);

  useEffect(() => {
    const client = supabase;
    if (!supabaseConfigured || !client) {
      setStatus("unconfigured");
      return;
    }
    let active = true;
    let generation = 0;
    let lastAccessToken = "";
    let hasInspectedSession = false;
    let currentUserId: string | null = null;

    const inspectSession = async (nextSession: Session | null, force = false) => {
      if (!active) return;
      const accessToken = nextSession?.access_token ?? "";
      if (!force && hasInspectedSession && accessToken === lastAccessToken) return;
      hasInspectedSession = true;
      lastAccessToken = accessToken;
      const currentGeneration = ++generation;
      const isCurrent = () => active && currentGeneration === generation;

      const nextUserId = nextSession?.user.id ?? null;
      if (nextUserId !== currentUserId) {
        currentUserId = nextUserId;
        setForm(emptyProject);
        setCoverFile(null);
        setScreenshotFiles([]);
      }
      setSession(nextSession);
      setError("");
      setMessage("");
      setMfaFactorId("");
      setMfaChallengeId("");
      setMfaQrCode("");
      setMfaCode("");
      setPendingFactorIds([]);
      if (!nextSession) {
        setRecords([]);
        setStatus("signed-out");
        return;
      }
      setStatus("checking");
      setRecords([]);

      try {
        const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!isCurrent()) return;
        if (assurance.error) throw new Error(`Vérification du niveau MFA impossible : ${assurance.error.message}`);

        if (assurance.data.currentLevel !== "aal2") {
          const factors = await client.auth.mfa.listFactors();
          if (!isCurrent()) return;
          if (factors.error) throw new Error(`Lecture des facteurs MFA impossible : ${factors.error.message}`);

          const verifiedTotp = factors.data.totp[0];
          if (verifiedTotp) {
            const challenge = await client.auth.mfa.challenge({ factorId: verifiedTotp.id });
            if (!isCurrent()) return;
            if (challenge.error) throw new Error(`Initialisation du code MFA impossible : ${challenge.error.message}`);
            setMfaFactorId(verifiedTotp.id);
            setMfaChallengeId(challenge.data.id);
            setStatus("mfa-challenge");
            return;
          }

          const unverifiedTotpIds = factors.data.all
            .filter((factor) => factor.factor_type === "totp" && factor.status === "unverified")
            .map((factor) => factor.id);
          if (unverifiedTotpIds.length > 0) {
            setPendingFactorIds(unverifiedTotpIds);
            setStatus("mfa-restart");
            return;
          }

          const enrollment = await enrollTotpFactor();
          if (!isCurrent()) return;
          setMfaFactorId(enrollment.factorId);
          setMfaChallengeId(enrollment.challengeId);
          setMfaQrCode(enrollment.qrCode);
          setStatus("mfa-enroll");
          return;
        }

        const membership = await client
          .from("admin_users")
          .select("user_id")
          .eq("user_id", nextSession.user.id)
          .maybeSingle();
        if (!isCurrent()) return;
        if (membership.error) throw new Error(`Vérification du rôle administrateur impossible : ${membership.error.message}`);
        if (!membership.data) {
          setStatus("not-admin");
          return;
        }

        const result = await client
          .from("projects")
          .select("id,sort_order,title,description,objective,technologies,steps,results,cover_image_path,screenshot_paths,repository_url,demo_url,category,project_date,status,created_at")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (!isCurrent()) return;
        if (result.error) throw new Error(`Chargement de l’administration impossible : ${result.error.message}`);
        setRecords((result.data as ProjectRow[]).map(mapProject));
        setStatus("admin");
      } catch (caught) {
        if (!isCurrent()) return;
        hasInspectedSession = false;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Une erreur est survenue pendant la vérification de l’accès.");
      }
    };
    inspectSessionRef.current = inspectSession;

    void client.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setStatus("error");
          setError(`Lecture de la session impossible : ${sessionError.message}`);
          return;
        }
        void inspectSession(data.session);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(caught instanceof Error ? `Lecture de la session impossible : ${caught.message}` : "Lecture de la session impossible.");
      });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      const nextAccessToken = nextSession?.access_token ?? "";
      if (nextAccessToken !== lastAccessToken) {
        setStatus(nextSession ? "checking" : "signed-out");
        setRecords([]);
      }
      window.setTimeout(() => void inspectSession(nextSession), 0);
    });

    return () => {
      active = false;
      inspectSessionRef.current = async () => undefined;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateForm = <K extends keyof ManagedProject>(key: K, value: ManagedProject[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyProject);
    setCoverFile(null);
    setScreenshotFiles([]);
  };

  const loadProjects = async () => {
    const client = supabase;
    if (!client || status !== "admin") return;
    const result = await client
      .from("projects")
      .select("id,sort_order,title,description,objective,technologies,steps,results,cover_image_path,screenshot_paths,repository_url,demo_url,category,project_date,status,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);
    setRecords((result.data as ProjectRow[]).map(mapProject));
  };

  const logIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await client.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(`Connexion refusée : ${result.error.message}`);
        return;
      }
      setPassword("");
      if (!result.data.session) throw new Error("La connexion n’a pas retourné de session.");
      setMessage("Identifiants acceptés ; vérification MFA en cours…");
      await inspectSessionRef.current(result.data.session, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Échec de la connexion.");
    } finally {
      setBusy(false);
    }
  };

  const verifyMfaCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = supabase;
    if (!client || !mfaFactorId || !mfaChallengeId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const verification = await client.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode.trim(),
      });
      setMfaCode("");
      if (verification.error) throw new Error(`Code MFA refusé : ${verification.error.message}`);

      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw new Error(`Confirmation du niveau MFA impossible : ${assurance.error.message}`);
      if (assurance.data.currentLevel !== "aal2") {
        throw new Error("Supabase n’a pas confirmé le niveau d’authentification AAL2.");
      }

      const current = await client.auth.getSession();
      if (current.error) throw new Error(`Lecture de la session MFA impossible : ${current.error.message}`);
      if (!current.data.session) throw new Error("La session a expiré après la vérification MFA.");
      await inspectSessionRef.current(current.data.session, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La vérification MFA a échoué.");
    } finally {
      setMfaCode("");
      setBusy(false);
    }
  };

  const resendMfaChallenge = async () => {
    const client = supabase;
    if (!client || !mfaFactorId) return;
    setBusy(true);
    setError("");
    try {
      const challenge = await client.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw new Error(`Impossible de renouveler le challenge MFA : ${challenge.error.message}`);
      setMfaChallengeId(challenge.data.id);
      setMfaCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de renouveler le challenge MFA.");
    } finally {
      setBusy(false);
    }
  };

  const restartMfaEnrollment = async () => {
    const client = supabase;
    if (!client || pendingFactorIds.length === 0 || status !== "mfa-restart") return;
    setBusy(true);
    setError("");
    try {
      for (const factorId of pendingFactorIds) {
        const result = await client.auth.mfa.unenroll({ factorId });
        if (result.error) throw new Error(`Impossible de réinitialiser un enrôlement TOTP incomplet : ${result.error.message}`);
      }
      const current = await client.auth.getSession();
      if (current.error) throw new Error(`Lecture de la session impossible : ${current.error.message}`);
      if (!current.data.session) throw new Error("La session a expiré.");
      setPendingFactorIds([]);
      await inspectSessionRef.current(current.data.session, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de reprendre l’enrôlement MFA.");
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    const client = supabase;
    if (!client) return;
    setBusy(true);
    setStatus("checking");
    setRecords([]);
    setError("");
    try {
      const result = await client.auth.signOut();
      if (result.error) throw new Error(`Déconnexion impossible : ${result.error.message}`);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Échec de la déconnexion.");
    } finally {
      setBusy(false);
    }
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = supabase;
    if (!client || status !== "admin") return;
    setBusy(true);
    setError("");
    setMessage("");
    const id = form.id || crypto.randomUUID();
    const newlyUploaded: string[] = [];
    let persisted = false;
    const upload = async (file: File) => {
      const path = filePath(id, file);
      const result = await client.storage.from(projectImageBucket).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (result.error) throw new Error(`Échec du téléversement de ${file.name} : ${result.error.message}`);
      newlyUploaded.push(path);
      return path;
    };

    try {
      const coverImagePath = coverFile ? await upload(coverFile) : form.coverImagePath;
      const newScreenshots = await Promise.all(screenshotFiles.map(upload));
      const record = {
        id,
        sort_order: form.orderIndex || records.length + 1,
        title: form.title.trim(),
        description: form.description.trim(),
        objective: form.objective.trim(),
        technologies: form.technologies,
        steps: form.steps,
        results: form.results.trim(),
        cover_image_path: coverImagePath || null,
        screenshot_paths: [...form.screenshotPaths, ...newScreenshots],
        repository_url: form.repositoryUrl.trim() || null,
        demo_url: form.demoUrl.trim() || null,
        category: form.category.trim(),
        project_date: form.date || null,
        status: form.status,
        updated_at: new Date().toISOString(),
      };
      const result = await client.from("projects").upsert(record);
      if (result.error) throw new Error(`Enregistrement du projet refusé : ${result.error.message}`);
      persisted = true;

      const previous = records.find((project) => project.id === id);
      const retained = new Set([coverImagePath, ...record.screenshot_paths].filter(Boolean));
      const removed = [
        previous?.coverImagePath,
        ...(previous?.screenshotPaths ?? []),
      ].filter((path): path is string => typeof path === "string" && !retained.has(path));
      if (removed.length > 0) {
        const cleanup = await client.storage.from(projectImageBucket).remove(removed);
        if (cleanup.error) {
          setError(`Projet enregistré, mais certaines anciennes images n’ont pas pu être supprimées : ${cleanup.error.message}`);
        }
      }

      await loadProjects();
      resetForm();
      setMessage(form.id ? "Projet mis à jour." : "Projet créé.");
    } catch (caught) {
      if (newlyUploaded.length > 0 && !persisted) {
        const cleanup = await client.storage.from(projectImageBucket).remove(newlyUploaded);
        if (cleanup.error) {
          setError(`Échec de l’enregistrement. Le nettoyage de certaines images a aussi échoué : ${cleanup.error.message}`);
          setBusy(false);
          return;
        }
      }
      setError(caught instanceof Error ? caught.message : "Une erreur inconnue est survenue.");
    }
    setBusy(false);
  };

  const togglePublication = async (project: ManagedProject) => {
    const client = supabase;
    if (!client || status !== "admin") return;
    const nextStatus: ProjectStatus = project.status === "published" ? "draft" : "published";
    const result = await client.from("projects").update({ status: nextStatus }).eq("id", project.id);
    if (result.error) {
      setError(`Modification de publication impossible : ${result.error.message}`);
      return;
    }
    await loadProjects();
    setMessage(nextStatus === "published" ? "Projet publié." : "Projet dépublié ; il n’est plus visible publiquement.");
    setError("");
  };

  const deleteProject = async (project: ManagedProject) => {
    const client = supabase;
    if (!client || status !== "admin" || !window.confirm(`Supprimer définitivement « ${project.title} » et ses images ?`)) return;
    setBusy(true);
    setError("");
    const deletion = await client.from("projects").delete().eq("id", project.id);
    if (deletion.error) {
      setError(`Suppression du projet refusée : ${deletion.error.message}`);
      setBusy(false);
      return;
    }
    const paths = [project.coverImagePath, ...project.screenshotPaths].filter(Boolean);
    if (paths.length > 0) {
      const cleanup = await client.storage.from(projectImageBucket).remove(paths);
      if (cleanup.error) setError(`Projet supprimé, mais certaines images n’ont pas pu être supprimées : ${cleanup.error.message}`);
    }
    await loadProjects();
    if (form.id === project.id) resetForm();
    if (!error) setMessage("Projet supprimé.");
    setBusy(false);
  };

  const moveProject = async (index: number, direction: -1 | 1) => {
    const client = supabase;
    if (!client || status !== "admin") return;
    const destination = index + direction;
    if (destination < 0 || destination >= records.length) return;
    const reordered = [...records];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    const sorted = reordered.map((project, position) => ({ ...project, orderIndex: position + 1 }));
    setRecords(sorted);
    const results = await Promise.all(sorted.map((project) =>
      client.from("projects").update({ sort_order: project.orderIndex }).eq("id", project.id),
    ));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(`L’ordre n’a pas pu être enregistré : ${failed.error.message}`);
      await loadProjects();
      return;
    }
    setMessage("Ordre d’affichage enregistré.");
  };

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <a className="admin-brand" href="/">SYS<span>/</span>NET <small>ADMINISTRATION</small></a>
          {session && <button className="admin-button admin-button--quiet" disabled={busy} onClick={() => void logOut()} type="button">SE DÉCONNECTER</button>}
        </header>
        <section className="admin-panel">
          <p className="admin-eyebrow">ESPACE PRIVÉ / PROJETS</p>
          <h1>Administration du portfolio</h1>

          {status === "unconfigured" && (
            <div className="admin-notice" role="status">
              <strong>Administration non configurée.</strong>
              <p>Ajoutez les variables Supabase et appliquez les instructions de <code>docs/supabase-setup.md</code>. Aucune authentification locale fictive n’est utilisée.</p>
            </div>
          )}
          {status === "signed-out" && (
            <form className="admin-login" onSubmit={(event) => void logIn(event)}>
              <label>E-mail<input autoComplete="username" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
              <label>Mot de passe<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              <button className="admin-button" disabled={busy} type="submit">{busy ? "CONNEXION…" : "SE CONNECTER"}</button>
              <p>Les comptes sont créés depuis le tableau de bord Supabase et doivent être inscrits dans la liste administrateur.</p>
            </form>
          )}
          {(status === "mfa-challenge" || status === "mfa-enroll") && (
            <div className="admin-mfa">
              <h2>{status === "mfa-enroll" ? "Configurer l’authentification TOTP" : "Vérification multifacteur"}</h2>
              {status === "mfa-enroll" && (
                <>
                  <p>Scannez ce QR code avec votre application d’authentification, puis saisissez le code généré. Le facteur sera activé uniquement après vérification.</p>
                  <img
                    alt="QR code d’enrôlement TOTP Supabase"
                    className="admin-mfa__qr"
                    src={mfaQrCode.startsWith("data:")
                      ? mfaQrCode
                      : `data:image/svg+xml;utf-8,${encodeURIComponent(mfaQrCode)}`}
                  />
                </>
              )}
              {status === "mfa-challenge" && <p>Saisissez le code temporaire de votre application d’authentification.</p>}
              <form className="admin-mfa__form" onSubmit={(event) => void verifyMfaCode(event)}>
                <label>
                  Code de vérification
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(event) => setMfaCode(event.target.value)}
                    required
                    value={mfaCode}
                  />
                </label>
                <button className="admin-button" disabled={busy || mfaCode.trim().length === 0} type="submit">
                  {busy ? "VÉRIFICATION…" : status === "mfa-enroll" ? "ACTIVER LE FACTEUR" : "VÉRIFIER LE CODE"}
                </button>
              </form>
              <button className="admin-text-button" disabled={busy} onClick={() => void resendMfaChallenge()} type="button">
                RENOUVELER LE CHALLENGE
              </button>
            </div>
          )}
          {status === "mfa-restart" && (
            <div className="admin-notice" role="status">
              <strong>Un enrôlement TOTP précédent est resté incomplet.</strong>
              <p>Il doit être réinitialisé avant de générer un nouveau QR code. Aucun facteur déjà vérifié ne sera supprimé.</p>
              <button className="admin-button" disabled={busy} onClick={() => void restartMfaEnrollment()} type="button">
                {busy ? "RÉINITIALISATION…" : "RECOMMENCER L’ENRÔLEMENT"}
              </button>
            </div>
          )}
          {status === "loading" || status === "checking" ? <p role="status">Vérification de la session et des droits…</p> : null}
          {status === "not-admin" && (
            <div className="admin-notice" role="status">
              <strong>Ce compte n’a pas le rôle administrateur.</strong>
              <p>Le contenu reste protégé par les politiques de la base de données.</p>
              <button className="admin-button admin-button--quiet" disabled={busy} onClick={() => void logOut()} type="button">SE DÉCONNECTER</button>
            </div>
          )}
          {status === "error" && <p className="admin-error" role="alert">{error}</p>}
          {status === "admin" && (
            <>
              <p className="admin-session">Session AAL2 · rôle administrateur confirmé</p>
              {(message || error) && <p className={error ? "admin-error" : "admin-success"} role={error ? "alert" : "status"}>{error || message}</p>}
              <div className="admin-layout">
                <form className="admin-form" onSubmit={(event) => void saveProject(event)}>
                  <div className="admin-form__heading">
                    <h2>{form.id ? "Modifier le projet" : "Nouveau projet"}</h2>
                    {form.id && <button className="admin-text-button" onClick={resetForm} type="button">ANNULER</button>}
                  </div>
                  <label>Titre<input maxLength={160} onChange={(event) => updateForm("title", event.target.value)} required value={form.title} /></label>
                  <label>Catégorie<input onChange={(event) => updateForm("category", event.target.value)} required value={form.category} /></label>
                  <label>Description<textarea onChange={(event) => updateForm("description", event.target.value)} required rows={3} value={form.description} /></label>
                  <label>Objectif<textarea onChange={(event) => updateForm("objective", event.target.value)} rows={2} value={form.objective} /></label>
                  <label>Technologies — une par ligne<textarea onChange={(event) => updateForm("technologies", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} rows={3} value={form.technologies.join("\n")} /></label>
                  <label>Étapes — une par ligne<textarea onChange={(event) => updateForm("steps", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} rows={4} value={form.steps.join("\n")} /></label>
                  <label>Résultats<textarea onChange={(event) => updateForm("results", event.target.value)} rows={3} value={form.results} /></label>
                  <label>URL du dépôt<input onChange={(event) => updateForm("repositoryUrl", event.target.value)} type="url" value={form.repositoryUrl} /></label>
                  <label>URL de démonstration<input onChange={(event) => updateForm("demoUrl", event.target.value)} type="url" value={form.demoUrl} /></label>
                  <div className="admin-form__row">
                    <label>Date<input onChange={(event) => updateForm("date", event.target.value)} type="date" value={form.date} /></label>
                    <label>Publication<select onChange={(event) => updateForm("status", event.target.value as ProjectStatus)} value={form.status}><option value="draft">Brouillon</option><option value="published">Publié</option></select></label>
                  </div>
                  <label>Image de couverture<input accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} type="file" /></label>
                  {coverPreviewUrl && !coverFile && <img alt={`Couverture actuelle : ${form.title}`} className="admin-cover-preview" loading="lazy" src={coverPreviewUrl} />}
                  {form.coverImagePath && <button className="admin-text-button" onClick={() => updateForm("coverImagePath", "")} type="button">RETIRER LA COUVERTURE ACTUELLE</button>}
                  <label>Captures d’écran<input accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setScreenshotFiles(Array.from(event.target.files ?? []))} type="file" /></label>
                  {form.screenshotPaths.length > 0 && (
                    <ul className="admin-image-paths">
                      {form.screenshotPaths.map((path) => <li key={path}>{path}<button aria-label={`Retirer ${path}`} onClick={() => updateForm("screenshotPaths", form.screenshotPaths.filter((item) => item !== path))} type="button">×</button></li>)}
                    </ul>
                  )}
                  <p className="admin-help">Images JPEG, PNG ou WebP · maximum 10 Mo par fichier.</p>
                  <button className="admin-button" disabled={busy} type="submit">{busy ? "ENREGISTREMENT…" : "ENREGISTRER LE PROJET"}</button>
                </form>
                <section aria-labelledby="admin-project-list" className="admin-projects">
                  <h2 id="admin-project-list">Projets ({records.length})</h2>
                  {records.length === 0 && <p>Aucun projet en base. Les fiches de démonstration statiques ne sont pas administrables ici.</p>}
                  {records.map((project, index) => (
                    <article className="admin-project" key={project.id}>
                      <span className={`admin-project__status admin-project__status--${project.status}`}>{project.status === "published" ? "PUBLIÉ" : "BROUILLON"}</span>
                      <h3>{project.title}</h3>
                      <p>{project.category}</p>
                      <div className="admin-project__actions">
                        <button aria-label={`Monter ${project.title}`} className="admin-icon-button" disabled={busy || index === 0} onClick={() => void moveProject(index, -1)} type="button">↑</button>
                        <button aria-label={`Descendre ${project.title}`} className="admin-icon-button" disabled={busy || index === records.length - 1} onClick={() => void moveProject(index, 1)} type="button">↓</button>
                        <button className="admin-text-button" onClick={() => { setForm(project); setCoverFile(null); setScreenshotFiles([]); }} type="button">MODIFIER</button>
                        <button className="admin-text-button" onClick={() => void togglePublication(project)} type="button">{project.status === "published" ? "DÉPUBLIER" : "PUBLIER"}</button>
                        <button className="admin-text-button admin-text-button--danger" disabled={busy} onClick={() => void deleteProject(project)} type="button">SUPPRIMER</button>
                      </div>
                    </article>
                  ))}
                </section>
              </div>
            </>
          )}
          {(status === "signed-out" || status === "checking" || status === "mfa-challenge" || status === "mfa-enroll" || status === "mfa-restart") && error && <p className="admin-error" role="alert">{error}</p>}
          {status === "signed-out" && message && <p className="admin-success" role="status">{message}</p>}
        </section>
        <footer className="admin-footer"><a href="/">← RETOUR AU PORTFOLIO</a><span>AUTHENTIFICATION ET AUTORISATION FOURNIES PAR SUPABASE</span></footer>
      </div>
    </main>
  );
}
