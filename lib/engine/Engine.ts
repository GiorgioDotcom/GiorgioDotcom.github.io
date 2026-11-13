import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { buildChip, type Chip } from "./chip";
import { buildStudio } from "./studio";
import { ChipAudio } from "./audio";

// ---------------------------------------------------------------------------
// Camera script. Each cue is pinned to a page section (data-cue="id").
// "frame" is how many millimetres must fit on screen, so the same cue works
// on a phone and on a monitor.
// ---------------------------------------------------------------------------
type Shot = {
  frame: number;
  polar: number; // elevation, degrees
  azimuth: number; // degrees
  offsetX: number; // fraction of the viewport, + pushes the object right
  target: [number, number, number];
  explode: number;
  timeScale: number;
  labels: number;
  mobileY: number; // vertical frame shift on narrow screens, + lifts the object
};

const CUES: Record<string, Shot> = {
  hero: { frame: 70, polar: 32, azimuth: -32, offsetX: 0.21, target: [0, 0, 0], explode: 0, timeScale: 1, labels: 0, mobileY: 0.17 },
  about: { frame: 30, polar: 56, azimuth: 16, offsetX: -0.2, target: [-5, 1.8, -3], explode: 0, timeScale: 1 / 12, labels: 0, mobileY: 0.17 },
  stack: { frame: 96, polar: 18, azimuth: -38, offsetX: 0, target: [0, 9, 0], explode: 1, timeScale: 1, labels: 1, mobileY: -0.16 },
  projects: { frame: 76, polar: 36, azimuth: 138, offsetX: 0.25, target: [0, 3, 0], explode: 0.3, timeScale: 1, labels: 0, mobileY: 0.17 },
  contact: { frame: 64, polar: 78, azimuth: 0, offsetX: 0.22, target: [0, 0, 0], explode: 0, timeScale: 1, labels: 0, mobileY: 0.17 },
};

const KEYS: (keyof Shot)[] = ["frame", "polar", "azimuth", "offsetX", "explode", "timeScale", "labels", "mobileY"];

const GrainShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmount: { value: 0.045 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uAmount; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float n = h(vUv * 1000.) - .5;
      float v = smoothstep(1.15, .35, length(vUv - .5));
      c.rgb = c.rgb * mix(.82, 1., v) + n * uAmount;
      gl_FragColor = c;
    }`,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
  lineSvg: SVGSVGElement;
  onReady: () => void;
};

export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grain: ShaderPass;
  private chip: Chip;
  readonly audio = new ChipAudio();

  private cur: Shot = { ...CUES.hero, target: [...CUES.hero.target] };
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private time = 0;
  private lastBeat = -1;
  private power = 0;
  private powerTarget = 0;
  private raf = 0;
  private last = performance.now();
  private disposed = false;

  private pixelRatio: number;
  private touch = window.matchMedia("(pointer: coarse)").matches;
  private lastTilt = 0;
  private lastScroll = window.scrollY;
  private sweep = 0; // light sweep on touch screens, where there is no cursor
  private w = 1;
  private h = 1;
  private fpsFrames = 0;
  private fpsStart = performance.now();
  private warm = 0;

  private sections: { id: string; el: HTMLElement }[] = [];
  private reveals: HTMLElement[] = [];
  private labelEls = new Map<string, HTMLElement>();
  private linePaths = new Map<string, SVGPathElement>();

  constructor(private opts: EngineOptions) {
    const { canvas } = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    const phone = this.touch || Math.min(window.innerWidth, window.innerHeight) < 700;
    // phones: fewer pixels and samples, the panel is small and dense anyway
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color("#09080d");
    this.scene.environment = buildStudio(this.renderer);
    this.scene.environmentIntensity = 1.35;

    this.chip = buildChip();
    this.scene.add(this.chip.root);

    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: phone ? 2 : 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.4, 0.96); // high threshold: glints only
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grain = new ShaderPass(GrainShader);
    this.composer.addPass(this.grain);

    this.collectDom();
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });

    void this.boot();
  }

  private async boot() {
    performance.mark("engine-boot");
    this.applyShot(this.targetShot(), 1e3);
    try {
      // never hold the page hostage: slow GPUs get the site after 2.5 s anyway
      await Promise.race([
        this.renderer.compileAsync(this.scene, this.camera),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      /* older browsers: compile lazily */
    }
    if (this.disposed) return;
    this.composer.render();
    performance.mark("engine-ready");
    this.opts.onReady();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  collectDom() {
    this.sections = Array.from(document.querySelectorAll<HTMLElement>("[data-cue]")).map((el) => ({
      id: el.dataset.cue!,
      el,
    }));
    this.reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    this.labelEls.clear();
    this.opts.labelLayer.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => this.labelEls.set(el.dataset.part!, el));
    this.linePaths.clear();
    this.opts.lineSvg.querySelectorAll<SVGPathElement>("[data-line]").forEach((el) => this.linePaths.set(el.dataset.line!, el));
  }

  // ---------------------------------------------------------------- input
  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return; // a finger scrolling is not a cursor
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    this.lastTilt = performance.now();
    this.pointer.tx = Math.max(-1, Math.min(1, e.gamma / 30));
    this.pointer.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  };

  /** Called from the hold gesture: unlocks audio and phone tilt. */
  async enableSensors() {
    this.audio.unlock();
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (DOE && typeof DOE.requestPermission === "function") {
        if ((await DOE.requestPermission()) !== "granted") return;
      }
      window.addEventListener("deviceorientation", this.onTilt);
    } catch {
      /* permission denied: cursor still works */
    }
  }

  setPower(on: boolean) {
    if (on === this.powerTarget > 0.5) return;
    this.powerTarget = on ? 1 : 0;
    if (on) this.audio.powerOn();
    else this.audio.powerOff();
  }

  setBlueprint(on: boolean) {
    this.chip.setBlueprint(on);
  }

  // ---------------------------------------------------------------- camera
  private targetShot(): Shot {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (!this.sections.length) return CUES.hero;
    const at = this.sections.map((s) => Math.max(0, s.el.getBoundingClientRect().top + y - vh * 0.35));
    let i = 0;
    while (i < at.length - 1 && y >= at[i + 1]) i++;
    const a = CUES[this.sections[i].id] ?? CUES.hero;
    const bIdx = Math.min(i + 1, at.length - 1);
    const b = CUES[this.sections[bIdx].id] ?? a;
    const span = at[bIdx] - at[i];
    // hold each shot for the first part of its section, then travel
    const t = span > 0 ? smooth(clamp01(((y - at[i]) / span - 0.35) / 0.65)) : 0;
    const out = { ...a, target: [0, 0, 0] as [number, number, number] };
    for (const k of KEYS) (out[k] as number) = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
    for (let j = 0; j < 3; j++) out.target[j] = a.target[j] + (b.target[j] - a.target[j]) * t;
    return out;
  }

  private applyShot(target: Shot, dt: number) {
    for (const k of KEYS) {
      const rate = k === "timeScale" ? 6 : 3.2;
      (this.cur[k] as number) = damp(this.cur[k] as number, target[k] as number, rate, dt);
    }
    for (let j = 0; j < 3; j++) this.cur.target[j] = damp(this.cur.target[j], target.target[j], 3.2, dt);

    const { w, h } = this;
    const aspect = w / h;
    const narrow = aspect < 0.9;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const frame = this.cur.frame * (narrow ? 0.9 : 1);
    const dist = frame / (2 * Math.tan(fov / 2) * Math.min(1, aspect));

    const pol = THREE.MathUtils.degToRad(this.cur.polar + this.pointer.y * 3);
    const az = THREE.MathUtils.degToRad(this.cur.azimuth + this.pointer.x * 4);
    const tgt = new THREE.Vector3(...this.cur.target);
    this.camera.position.set(
      tgt.x + dist * Math.cos(pol) * Math.sin(az),
      tgt.y + dist * Math.sin(pol),
      tgt.z + dist * Math.cos(pol) * Math.cos(az),
    );
    this.camera.lookAt(tgt);

    // shift the frame instead of the object, so the subject sits beside the copy
    const ox = narrow ? 0 : this.cur.offsetX;
    const oy = narrow ? this.cur.mobileY : 0;
    this.camera.setViewOffset(w, h, -ox * w, oy * h, w, h);
  }

  // ---------------------------------------------------------------- frame
  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.touch && now - this.lastTilt > 1500) {
      // no cursor and no tilt: the studio drifts on its own, scrolling pushes it
      const sy = window.scrollY;
      this.sweep += dt * 0.35 + Math.max(-0.4, Math.min(0.4, (sy - this.lastScroll) * 0.004));
      this.lastScroll = sy;
      this.pointer.tx = Math.sin(this.sweep) * 0.9;
      this.pointer.ty = Math.cos(this.sweep * 0.7) * 0.4;
    }
    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 3, dt);
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 3, dt);

    this.applyShot(this.targetShot(), dt);

    // one clock drives everything that moves
    this.time += dt * this.cur.timeScale;
    const beatPos = this.time * 2;
    const beat = Math.floor(beatPos);
    const env = Math.exp(-(beatPos - beat) * 6);
    this.power = damp(this.power, this.powerTarget, 2.5, dt);
    if (beat !== this.lastBeat) {
      this.lastBeat = beat;
      if (this.powerTarget > 0.5) this.audio.tick(beat % 4 === 0);
    }
    this.chip.setPower(this.power, env);

    // environment follows the cursor: the studio rotates, the chip stays put
    this.scene.environmentRotation.set(this.pointer.y * 0.45, -this.pointer.x * 0.8, 0);

    const root = this.chip.root;
    root.rotation.y = Math.sin(this.time * 0.35) * 0.06;
    root.position.y = -1.8 + Math.sin(this.time * 0.8) * 0.25;

    // exploded view: top parts leave first and come back last
    const e = this.cur.explode + this.power * env * 0.02;
    for (const p of this.chip.parts) {
      const delay = (1 - p.order) * 0.42;
      const t = easeInOut(clamp01((e - delay) / 0.58));
      p.obj.position.copy(p.base).addScaledVector(p.lift, t);
    }

    this.updateLabels();
    this.updateReveals();

    (this.grain.uniforms.uTime as { value: number }).value = now * 0.001;
    this.composer.render(dt);
    this.adaptQuality(now);
  };

  private tmp = new THREE.Vector3();
  private updateLabels() {
    const alpha = smooth(clamp01((this.cur.labels - 0.6) / 0.4));
    const layer = this.opts.labelLayer;
    layer.style.opacity = String(alpha);
    this.opts.lineSvg.style.opacity = String(alpha);
    if (alpha < 0.01) return;

    const { w, h } = this;
    const narrow = w < 760;
    const colL = w * (narrow ? 0.04 : 0.18);
    const colR = w * (narrow ? 0.96 : 0.82);
    type L = { id: string; ax: number; ay: number; y: number; side: number };
    const items: L[] = [];
    for (const p of this.chip.parts) {
      this.tmp.copy(p.anchor);
      p.obj.localToWorld(this.tmp);
      this.tmp.project(this.camera);
      const ax = (this.tmp.x * 0.5 + 0.5) * w;
      const ay = (-this.tmp.y * 0.5 + 0.5) * h;
      items.push({ id: p.id, ax, ay, y: ay, side: p.anchor.x < 0 ? -1 : 1 });
    }
    const gap = narrow ? 44 : 64;
    for (const side of [-1, 1]) {
      const col = items.filter((i) => i.side === side).sort((a, b) => a.y - b.y);
      for (let i = 1; i < col.length; i++) col[i].y = Math.max(col[i].y, col[i - 1].y + gap);
    }
    for (const it of items) {
      const el = this.labelEls.get(it.id);
      const line = this.linePaths.get(it.id);
      if (!el || !line) continue;
      const lw = el.offsetWidth;
      const x = it.side < 0 ? Math.max(colL, lw + 12) : Math.min(colR, w - lw - 12);
      el.style.transform = `translate(${x}px, ${it.y}px) translate(${it.side < 0 ? "-100%" : "0"}, -50%)`;
      const knee = x + (it.side < 0 ? 18 : -18);
      line.setAttribute("d", `M${it.ax.toFixed(1)},${it.ay.toFixed(1)} L${knee.toFixed(1)},${it.y.toFixed(1)} L${x.toFixed(1)},${it.y.toFixed(1)}`);
    }
  }

  // text reveals are driven by scroll position, not observers (they skip beats)
  private updateReveals() {
    const vh = window.innerHeight;
    for (const el of this.reveals) {
      const r = el.getBoundingClientRect();
      const p = clamp01((vh - r.top) / (vh * 0.45));
      el.style.setProperty("--r", p.toFixed(3));
    }
  }

  // adaptive quality: step resolution down under 40 fps, then turn bloom off
  private adaptQuality(now: number) {
    this.fpsFrames++;
    if (now - this.fpsStart < 1000) return;
    const fps = (this.fpsFrames * 1000) / (now - this.fpsStart);
    this.fpsFrames = 0;
    this.fpsStart = now;
    if (++this.warm < 3 || document.hidden) return;
    if (fps < 40) {
      if (this.pixelRatio > 1) {
        this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.resize(true);
      } else if (this.bloom.enabled) {
        this.bloom.enabled = false;
      }
    }
  }

  // sized from the canvas box (100lvh), not innerHeight: the mobile address
  // bar showing and hiding must neither stretch the image nor reallocate buffers
  resize = (force?: unknown) => {
    const c = this.opts.canvas;
    const w = c.clientWidth || window.innerWidth;
    const h = c.clientHeight || window.innerHeight;
    if (force !== true && w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
    const bloomScale = this.touch ? 0.5 : 1; // bloom is blurry by nature
    this.bloom.setSize(w * this.pixelRatio * bloomScale, h * this.pixelRatio * bloomScale);
    this.opts.lineSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("deviceorientation", this.onTilt);
    this.composer.dispose();
    this.renderer.dispose();
  }
}
