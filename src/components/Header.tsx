import { useState } from "react";
import { navigation } from "../data/portfolio";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <a
        aria-label="Portfolio, revenir à l’accueil"
        className="brand"
        href="#accueil"
        onClick={() => setMenuOpen(false)}
      >
        <span className="brand__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>SYS<span className="brand__accent">/</span>NET</span>
      </a>

      <button
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        className={`menu-toggle${menuOpen ? " menu-toggle--open" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span />
        <span />
      </button>

      <nav
        aria-label="Navigation principale"
        className={`navigation${menuOpen ? " navigation--open" : ""}`}
        id="site-navigation"
      >
        {navigation.map((item) => (
          <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
        <a
          className="navigation__cta"
          href="#contact"
          onClick={() => setMenuOpen(false)}
        >
          Me contacter <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
