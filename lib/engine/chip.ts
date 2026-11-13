import * as THREE from "three";
import type { PartId } from "../content";
import {
  anisotropyMap,
  brushedRoughness,
  dieMaps,
  engravingBump,
  substrateMaps,
} from "./textures";

// A 40 mm flip-chip package, built in real millimetres, entirely from code.
// Y is up. The substrate sits on y = 0, the solder balls hang below it.

export type Part = {
  id: PartId;
  obj: THREE.Group;
  base: THREE.Vector3;
  lift: THREE.Vector3;
  order: number; // 1 leaves first, comes back last
  anchor: THREE.Vector3; // label anchor, in part-local space
};

export type Chip = {
  root: THREE.Group;
  parts: Part[];
  setPower: (p: number, beat: number) => void;
  setBlueprint: (on: boolean) => void;
};

const VIOLET = new THREE.Color("#8b5cf6");

function roundedRect(w: number, h: number, r: number, path: THREE.Path = new THREE.Shape()) {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/** Outline with a half-round notch in the middle of each side (IHS flange). */
function notchedRect(w: number, r: number, notch: number) {
  const s = new THREE.Shape();
  const h = w / 2;
  s.moveTo(-h + r, -h);
  s.lineTo(-notch, -h);
  s.absarc(0, -h, notch, Math.PI, 0, true);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, -notch);
  s.absarc(h, 0, notch, -Math.PI / 2, Math.PI / 2, true);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(notch, h);
  s.absarc(0, h, notch, 0, Math.PI, true);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, notch);
  s.absarc(-h, 0, notch, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}

/**
 * Extrude a flat outline into a slab with a polished bevel, then lay it flat:
 * thickness along +Y, bottom at y = 0, cap UVs normalised to (w, h).
 */
function slab(shape: THREE.Shape, thickness: number, bevel: number, w: number, h: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(thickness - bevel * 2, 0.01),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 24,
  });
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox!.min.y, 0);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, 0.5 - pos.getZ(i) / h);
  }
  uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function withEdges(mesh: THREE.Mesh, edgeMat: THREE.LineBasicMaterial) {
  const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 12), edgeMat);
  lines.visible = false;
  lines.position.copy(mesh.position);
  lines.userData.blueprintEdges = true;
  return lines;
}

export function buildChip(): Chip {
  const root = new THREE.Group();
  const edgeMat = new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.9 });
  const wireMat = new THREE.MeshBasicMaterial({ color: VIOLET, wireframe: true, transparent: true, opacity: 0.1 });

  // ---------- materials ----------
  const lidAniso = anisotropyMap("linear");
  const lidRough = brushedRoughness();
  const engraving = engravingBump();

  const satin = new THREE.MeshPhysicalMaterial({
    color: "#b9b4ad",
    metalness: 1,
    roughness: 0.36,
    roughnessMap: lidRough,
    anisotropy: 0.8,
    anisotropyMap: lidAniso,
    bumpMap: engraving,
    bumpScale: 1.4,
  });
  const polished = new THREE.MeshPhysicalMaterial({ color: "#dcd7d0", metalness: 1, roughness: 0.07 });
  const flangeTop = new THREE.MeshPhysicalMaterial({
    color: "#bdb8b1",
    metalness: 1,
    roughness: 0.28,
    anisotropy: 0.6,
    anisotropyMap: anisotropyMap("linear"),
  });

  const sub = substrateMaps();
  const substrateTop = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    map: sub.map,
    roughness: 0.5,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    emissive: VIOLET,
    emissiveMap: sub.emissive,
    emissiveIntensity: 0,
  });
  const substrateSide = new THREE.MeshPhysicalMaterial({ color: "#100c16", roughness: 0.65 });

  const die = dieMaps();
  const dieTop = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    map: die.map,
    metalness: 0.35,
    roughness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [180, 760],
    emissive: VIOLET,
    emissiveMap: die.emissive,
    emissiveIntensity: 0,
  });
  const dieSide = new THREE.MeshPhysicalMaterial({ color: "#5d5a66", metalness: 0.7, roughness: 0.25 });

  const ceramic = new THREE.MeshPhysicalMaterial({ color: "#5b4636", roughness: 0.55, clearcoat: 0.3 });
  const terminal = new THREE.MeshPhysicalMaterial({ color: "#cfcfd4", metalness: 1, roughness: 0.18 });
  const solder = new THREE.MeshPhysicalMaterial({ color: "#b9b9be", metalness: 1, roughness: 0.16 });

  const parts: Part[] = [];
  const instanced: { mesh: THREE.InstancedMesh; mat: THREE.Material }[] = [];

  const addPart = (
    id: PartId,
    order: number,
    lift: [number, number, number],
    anchor: [number, number, number],
    build: (g: THREE.Group) => void,
  ) => {
    const g = new THREE.Group();
    build(g);
    root.add(g);
    parts.push({
      id,
      obj: g,
      base: g.position.clone(),
      lift: new THREE.Vector3(...lift),
      order,
      anchor: new THREE.Vector3(...anchor),
    });
  };

  const meshWithEdges = (g: THREE.Group, geo: THREE.BufferGeometry, mats: THREE.Material[], y = 0) => {
    const m = new THREE.Mesh(geo, mats);
    m.position.y = y;
    g.add(m, withEdges(m, edgeMat));
    return m;
  };

  // ---------- substrate: 40 x 40 x 1.2 ----------
  addPart("substrate", 0.2, [0, 0, 0], [-19, 1.2, 12], (g) => {
    meshWithEdges(g, slab(roundedRect(40, 40, 1.6) as THREE.Shape, 1.2, 0.05, 40, 40), [substrateTop, substrateSide]);
  });

  // ---------- solder balls: BGA grid, 1 mm pitch ----------
  addPart("balls", 0.1, [0, -11, 0], [17, -0.3, -14], (g) => {
    const pts: [number, number][] = [];
    for (let x = -19; x <= 19; x++) {
      for (let z = -19; z <= 19; z++) {
        const m = Math.max(Math.abs(x), Math.abs(z));
        if (m >= 7 || m <= 3) pts.push([x, z]);
      }
    }
    const geo = new THREE.SphereGeometry(0.32, 10, 8);
    const mesh = new THREE.InstancedMesh(geo, solder, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(([x, z], i) => {
      m4.makeTranslation(x, -0.22, z);
      mesh.setMatrixAt(i, m4);
    });
    g.add(mesh);
    instanced.push({ mesh, mat: solder });
  });

  // ---------- SMD capacitors on the margin ----------
  addPart("caps", 0.45, [0, 8, 0], [-18.2, 1.7, -10], (g) => {
    const spots: { x: number; z: number; rot: number }[] = [];
    for (let i = -6; i <= 6; i++) {
      if (Math.abs(i) < 1) continue;
      spots.push({ x: i * 2.4, z: 18.4, rot: 0 });
      spots.push({ x: i * 2.4, z: -18.4, rot: 0 });
      spots.push({ x: 18.4, z: i * 2.4, rot: Math.PI / 2 });
      spots.push({ x: -18.4, z: i * 2.4, rot: Math.PI / 2 });
    }
    // a cluster of decoupling caps next to the die, visible once the lid is off
    for (let i = -3; i <= 3; i++) {
      spots.push({ x: i * 1.6, z: 9.6, rot: Math.PI / 2 });
      spots.push({ x: i * 1.6, z: -9.6, rot: Math.PI / 2 });
    }
    const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), ceramic, spots.length);
    const ends = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.54, 0.54), terminal, spots.length * 2);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const up = new THREE.Vector3(0, 1, 0);
    spots.forEach((s, i) => {
      q.setFromAxisAngle(up, s.rot);
      m4.compose(new THREE.Vector3(s.x, 1.2 + 0.25, s.z), q, one);
      body.setMatrixAt(i, m4);
      for (const k of [-1, 1]) {
        const off = new THREE.Vector3(k * 0.42, 0, 0).applyQuaternion(q);
        m4.compose(new THREE.Vector3(s.x + off.x, 1.2 + 0.27, s.z + off.z), q, one);
        ends.setMatrixAt(i * 2 + (k > 0 ? 1 : 0), m4);
      }
    });
    g.add(body, ends);
    instanced.push({ mesh: body, mat: ceramic }, { mesh: ends, mat: terminal });
  });

  // ---------- die: 14 x 14 x 0.75 silicon ----------
  addPart("die", 0.7, [0, 15, 0], [7, 1.95, 7], (g) => {
    meshWithEdges(g, slab(roundedRect(14, 14, 0.25) as THREE.Shape, 0.75, 0.05, 14, 14), [dieTop, dieSide], 1.2);
  });

  // ---------- integrated heat spreader: flange + lid ----------
  addPart("ihs", 1, [0, 27, 0], [15, 3.6, -15], (g) => {
    const flange = notchedRect(34, 1.4, 1.6);
    flange.holes.push(roundedRect(27, 27, 1, new THREE.Path()));
    meshWithEdges(g, slab(flange, 0.8, 0.05, 34, 34), [flangeTop, polished], 1.2);
    meshWithEdges(g, slab(roundedRect(30, 30, 1.2) as THREE.Shape, 1.6, 0.14, 30, 30), [satin, polished], 2.0);
  });

  root.position.y = -1.8;

  const setPower = (p: number, beat: number) => {
    const pulse = 0.65 + 0.35 * beat;
    substrateTop.emissiveIntensity = p * 2.2 * pulse;
    dieTop.emissiveIntensity = p * 1.6 * pulse;
  };

  const blueprintSaved = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const setBlueprint = (on: boolean) => {
    root.traverse((o) => {
      if (o instanceof THREE.LineSegments && o.userData.blueprintEdges) o.visible = on;
      else if (o instanceof THREE.InstancedMesh) {
        if (on) {
          blueprintSaved.set(o, o.material);
          o.material = wireMat;
        } else if (blueprintSaved.has(o)) o.material = blueprintSaved.get(o)!;
      } else if (o instanceof THREE.Mesh) o.visible = !on;
    });
  };

  return { root, parts, setPower, setBlueprint };
}
