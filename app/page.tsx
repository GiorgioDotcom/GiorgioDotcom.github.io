"use client";

import { useCallback, useEffect, useState } from "react";
import Experience from "@/components/Experience";
import HoldButton from "@/components/HoldButton";
import type { Engine } from "@/lib/engine/Engine";
import { content, EMAIL, GITHUB, LINKEDIN, type Lang } from "@/lib/content";

function Title({ lines, accentLast = true }: { lines: [string, string]; accentLast?: boolean }) {
  return (
    <>
      {lines[0]}
      <br />
      <span className={accentLast ? "accent" : undefined}>{lines[1]}</span>
    </>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("it");
  const [engine, setEngine] = useState<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [muted, setMuted] = useState(false);
  const t = content[lang];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "it" || saved === "en") setLang(saved);
      else if (!navigator.language.toLowerCase().startsWith("it")) setLang("en");
    } catch {
      /* storage blocked: keep default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => {
    setFailed(true);
    setReady(true);
  }, []);

  const toggleBlueprint = () => {
    const next = !blueprint;
    setBlueprint(next);
    engine?.setBlueprint(next);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engine?.audio.setMuted(next);
  };

  return (
    <main className={`page ${failed ? "no-webgl" : ""}`}>
      <Experience labels={t.stack.labels} onEngine={setEngine} onReady={onReady} onFail={onFail} />

      <div className={`loader ${ready ? "is-done" : ""}`} aria-hidden={ready}>
        <span className="loader-dot" />
        <span className="mono">{t.loading}</span>
      </div>

      <header className="nav">
        <a href="#top" className="brand">
          <span className="brand-dot" />
          giorgio<span className="dim">giaffreda</span>
        </a>
        <nav className="nav-links">
          <a href="#about">{t.nav.about}</a>
          <a href="#stack">{t.nav.stack}</a>
          <a href="#projects">{t.nav.projects}</a>
          <a href="#contact">{t.nav.contact}</a>
        </nav>
        <div className="nav-tools">
          <button type="button" className="chip-btn" onClick={toggleMute} aria-pressed={muted} title="Audio">
            {muted ? "SND OFF" : "SND ON"}
          </button>
          <button type="button" className="chip-btn" onClick={() => setLang(lang === "it" ? "en" : "it")}>
            {lang === "it" ? "EN" : "IT"}
          </button>
        </div>
      </header>

      <div className="story">
        {/* HERO */}
        <section id="top" data-cue="hero" className="sec sec-hero">
          <div className="copy" data-reveal>
            <p className="eyebrow">
              <span className="rule" />
              {t.hero.eyebrow}
            </p>
            <h1 className="display">
              {t.hero.title[0]}
              <br />
              {t.hero.title[1]}
              <br />
              <span className="accent">{t.hero.accent}</span>
            </h1>
            <p className="lead">{t.hero.sub}</p>
            <div className="tags">
              {["TypeScript", "NestJS", "AWS", "AI"].map((x, i) => (
                <span key={x} className={`tag ${i === 0 ? "tag-solid" : ""}`}>
                  {x}
                </span>
              ))}
            </div>
            <HoldButton engine={engine} labelOn={t.hero.hold} labelOff={t.hero.holdOff} poweredLabel={t.hero.powered} />
          </div>
          <a href="#about" className="scroll-cue mono">
            {t.hero.scroll} <span>↓</span>
          </a>
        </section>

        {/* ABOUT: close-up on the engraving, slow motion */}
        <section id="about" data-cue="about" className="sec sec-right">
          <div className="copy" data-reveal>
            <p className="eyebrow">
              <span className="rule" />
              {t.about.eyebrow}
            </p>
            <h2 className="display">
              <Title lines={t.about.title} />
            </h2>
            {t.about.body.map((p) => (
              <p key={p} className="lead">
                {p}
              </p>
            ))}
            <dl className="stats">
              {t.about.stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt>{s.value}</dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* STACK: exploded view with callouts */}
        <section id="stack" data-cue="stack" className="sec sec-stack">
          <div className="sticky">
            <div className="copy copy-top" data-reveal>
              <p className="eyebrow">
                <span className="rule" />
                {t.stack.eyebrow}
              </p>
              <h2 className="display display-sm">
                <Title lines={t.stack.title} />
              </h2>
              <p className="lead small">{t.stack.body}</p>
            </div>
            <button type="button" className="blueprint-btn" onClick={toggleBlueprint} aria-pressed={blueprint}>
              <span className={`switch ${blueprint ? "on" : ""}`} />
              {blueprint ? t.stack.blueprintOff : t.stack.blueprint}
            </button>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" data-cue="projects" className="sec sec-left">
          <div className="copy wide" data-reveal>
            <p className="eyebrow">
              <span className="rule" />
              {t.projects.eyebrow}
            </p>
            <h2 className="display">
              <Title lines={t.projects.title} />
            </h2>
            <div className="cards">
              {t.projects.items.map((p, i) => (
                <article key={p.name} className="card">
                  <header className="card-head">
                    <span className="card-num mono">0{i + 1}</span>
                    <h3>{p.name}</h3>
                    <span className="card-kind mono">{p.kind}</span>
                  </header>
                  <p>{p.body}</p>
                  <footer className="card-foot">
                    <div className="tags">
                      {p.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="card-links">
                      {p.links.map((l) => (
                        <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" data-cue="contact" className="sec sec-left sec-last">
          <div className="copy" data-reveal>
            <p className="eyebrow">
              <span className="rule" />
              {t.contact.eyebrow}
            </p>
            <h2 className="display">
              <Title lines={t.contact.title} />
            </h2>
            <p className="lead">{t.contact.body}</p>
            <a className="mail" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <div className="socials">
              <a href={GITHUB} target="_blank" rel="noreferrer" className="tag">
                GitHub ↗
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer" className="tag">
                LinkedIn ↗
              </a>
            </div>
          </div>
          <footer className="foot mono">
            <span>© 2026 Giorgio Giaffreda</span>
            <span>{t.contact.footer}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
