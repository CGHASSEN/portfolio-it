import { useEffect, useState } from "react";

const messages = [
  "INITIALIZING USER PROFILE...",
  "IDENTITY VERIFIED",
  "LOADING TECHNICAL SKILLS...",
  "SYSTEM READY",
];

export function ProfileTerminal() {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleMessages(messages.length);
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleMessages((visible) => {
        if (visible >= messages.length) {
          window.clearInterval(timer);
          return visible;
        }
        return visible + 1;
      });
    }, 480);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-label="Interface de démonstration : séquence fictive d'initialisation du profil"
      className="profile-terminal"
      role="img"
    >
      <span aria-hidden="true" className="profile-terminal__prompt">&gt;_</span>
      <div className="profile-terminal__lines" aria-hidden="true">
        {messages.slice(0, visibleMessages).map((message, index) => (
          <span className={index === visibleMessages - 1 ? "profile-terminal__line--active" : ""} key={message}>
            {message}
          </span>
        ))}
      </div>
      <span className="profile-terminal__disclaimer">INTERFACE FICTIVE / DÉMONSTRATION</span>
    </div>
  );
}
