export type Lang = "it" | "en";

export type PartId = "ihs" | "die" | "caps" | "substrate" | "balls";

export type Copy = {
  nav: { about: string; stack: string; projects: string; contact: string };
  loading: string;
  hero: {
    eyebrow: string;
    title: [string, string];
    accent: string;
    sub: string;
    hold: string;
    holdOff: string;
    powered: string;
    scroll: string;
  };
  about: {
    eyebrow: string;
    title: [string, string];
    body: string[];
    stats: { value: string; label: string }[];
  };
  stack: {
    eyebrow: string;
    title: [string, string];
    body: string;
    blueprint: string;
    blueprintOff: string;
    labels: Record<PartId, { title: string; items: string }>;
  };
  projects: {
    eyebrow: string;
    title: [string, string];
    items: {
      name: string;
      kind: string;
      body: string;
      tags: string[];
      links: { label: string; href: string }[];
    }[];
  };
  contact: {
    eyebrow: string;
    title: [string, string];
    body: string;
    footer: string;
  };
};

const links = {
  rememori: [
    { label: "rememori.dev", href: "https://rememori.dev" },
    { label: "GitHub", href: "https://github.com/GiorgioDotcom/rememori" },
    { label: "npm", href: "https://www.npmjs.com/package/rememori" },
  ],
  flowhook: [{ label: "GitHub", href: "https://github.com/GiorgioDotcom/flowhook" }],
};

export const EMAIL = "dev@giaffredagiorgio.it";
export const GITHUB = "https://github.com/GiorgioDotcom";
export const LINKEDIN = "https://www.linkedin.com/in/giorgio-giaffreda/";

export const content: Record<Lang, Copy> = {
  it: {
    nav: { about: "Chi sono", stack: "Stack", projects: "Progetti", contact: "Contatti" },
    loading: "Accendo lo studio",
    hero: {
      eyebrow: "Backend engineer · AI · Lecce",
      title: ["Backend", "che regge."],
      accent: "AI che serve.",
      sub: "Sono Giorgio Giaffreda. Progetto backend su AWS e strumenti AI che girano davvero, dal cloud fino al tuo laptop.",
      hold: "Tieni premuto per accendere",
      holdOff: "Tieni premuto per spegnere",
      powered: "Acceso",
      scroll: "Scorri",
    },
    about: {
      eyebrow: "01 · Chi sono",
      title: ["Quattro anni", "in produzione."],
      body: [
        "Dal 2022 sono backend engineer su una piattaforma multi-tenant che serve circa 30 tenant in produzione, tra settore pubblico, infrastrutture critiche e grandi aziende.",
        "In parallelo studio Computer Engineering & AI (terzo anno, laurea nel 2027) e costruisco strumenti miei, open source e non.",
      ],
      stats: [
        { value: "4+", label: "anni di backend" },
        { value: "~30", label: "tenant in produzione" },
        { value: "0", label: "dipendenze in rememori" },
      ],
    },
    stack: {
      eyebrow: "02 · Stack",
      title: ["Smontato", "pezzo per pezzo."],
      body: "Ogni strato di questo chip è un pezzo di quello che uso ogni giorno. Niente modelli scaricati: è tutto codice, anche lui.",
      blueprint: "Vista blueprint",
      blueprintOff: "Vista materiali",
      labels: {
        ihs: { title: "Architettura", items: "TypeScript · NestJS · Node" },
        die: { title: "AI", items: "LLM · pgvector · Ollama · Whisper" },
        caps: { title: "Dati", items: "Postgres · SQLite · Python" },
        substrate: { title: "Cloud", items: "Lambda · API Gateway · DynamoDB · IoT Core" },
        balls: { title: "Fondamenta", items: "Linux · Git · CI" },
      },
    },
    projects: {
      eyebrow: "03 · Progetti",
      title: ["Cose che", "girano davvero."],
      items: [
        {
          name: "rememori",
          kind: "Open source · npm",
          body: "Memoria per agenti AI in TypeScript puro, zero dipendenze. Vettori, grafo di entità e decadimento nel tempo, con un indice HNSW scritto da zero. Gira su Node, browser ed edge, con un server MCP dedicato.",
          tags: ["TypeScript", "HNSW", "MCP"],
          links: links.rememori,
        },
        {
          name: "flowhook",
          kind: "Open source",
          body: "Hub di automazione webhook: riceve, trasforma il payload e consegna in fan-out, con un log per ogni tentativo. Dashboard React per endpoint, inoltri ed eventi.",
          tags: ["NestJS", "Postgres", "React"],
          links: links.flowhook,
        },
        {
          name: "psdrop",
          kind: "Strumento personale",
          body: "Bot Telegram che segue i prezzi del PlayStation Store per ogni edizione e bundle, con una Mini App per lista, vetrina e sconti. Node 24, SQLite nativo, zero dipendenze, 170+ test.",
          tags: ["Node", "SQLite", "Telegram"],
          links: [],
        },
      ],
    },
    contact: {
      eyebrow: "04 · Contatti",
      title: ["Hai un problema", "da far girare?"],
      body: "Scrivimi. Rispondo io, non un form.",
      footer: "Costruito con three.js. Zero video, zero modelli scaricati.",
    },
  },
  en: {
    nav: { about: "About", stack: "Stack", projects: "Projects", contact: "Contact" },
    loading: "Lighting the studio",
    hero: {
      eyebrow: "Backend engineer · AI · Lecce, Italy",
      title: ["Backends", "that hold."],
      accent: "AI that ships.",
      sub: "I'm Giorgio Giaffreda. I design backends on AWS and AI tools that actually run, from the cloud down to your laptop.",
      hold: "Hold to power up",
      holdOff: "Hold to power down",
      powered: "Powered",
      scroll: "Scroll",
    },
    about: {
      eyebrow: "01 · About",
      title: ["Four years", "in production."],
      body: [
        "Since 2022 I've been a backend engineer on a multi-tenant platform serving ~30 production tenants across public sector, critical infrastructure and enterprise clients.",
        "On the side I study Computer Engineering & AI (third year, graduating 2027) and build my own tools, open source and otherwise.",
      ],
      stats: [
        { value: "4+", label: "years of backend" },
        { value: "~30", label: "production tenants" },
        { value: "0", label: "dependencies in rememori" },
      ],
    },
    stack: {
      eyebrow: "02 · Stack",
      title: ["Taken apart,", "piece by piece."],
      body: "Every layer of this chip is a piece of what I use every day. No downloaded models: it's all code, this chip included.",
      blueprint: "Blueprint view",
      blueprintOff: "Material view",
      labels: {
        ihs: { title: "Architecture", items: "TypeScript · NestJS · Node" },
        die: { title: "AI", items: "LLM · pgvector · Ollama · Whisper" },
        caps: { title: "Data", items: "Postgres · SQLite · Python" },
        substrate: { title: "Cloud", items: "Lambda · API Gateway · DynamoDB · IoT Core" },
        balls: { title: "Foundations", items: "Linux · Git · CI" },
      },
    },
    projects: {
      eyebrow: "03 · Projects",
      title: ["Things that", "actually run."],
      items: [
        {
          name: "rememori",
          kind: "Open source · npm",
          body: "Agent memory in pure TypeScript, zero dependencies. Vectors, an entity graph and temporal decay, with an HNSW index written from scratch. Runs on Node, browsers and the edge, with its own MCP server.",
          tags: ["TypeScript", "HNSW", "MCP"],
          links: links.rememori,
        },
        {
          name: "flowhook",
          kind: "Open source",
          body: "Webhook automation hub: ingests, transforms the payload and fans out deliveries, with a log for every attempt. React dashboard for endpoints, forwards and events.",
          tags: ["NestJS", "Postgres", "React"],
          links: links.flowhook,
        },
        {
          name: "psdrop",
          kind: "Personal tool",
          body: "Telegram bot that tracks PlayStation Store prices for every edition and bundle, with a Mini App for watchlist, showcase and deals. Node 24, native SQLite, zero dependencies, 170+ tests.",
          tags: ["Node", "SQLite", "Telegram"],
          links: [],
        },
      ],
    },
    contact: {
      eyebrow: "04 · Contact",
      title: ["Got a problem", "that needs to run?"],
      body: "Write to me. You'll get me, not a form.",
      footer: "Built with three.js. Zero videos, zero downloaded models.",
    },
  },
};
