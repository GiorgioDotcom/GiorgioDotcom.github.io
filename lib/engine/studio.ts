import * as THREE from "three";

// A tiny photo studio that only exists to be reflected: dark room, one
// off-axis key softbox, two strip lights for edge lines, one violet kicker.
// It is rendered once into a PMREM environment map.

function panel(
  scene: THREE.Scene,
  w: number,
  h: number,
  intensity: number,
  pos: [number, number, number],
  color = "#ffffff",
) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(...pos);
  m.lookAt(0, 0, 0);
  scene.add(m);
  return m;
}

export function buildStudio(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#050407");

  // soft gradient room so dark areas of the metal are not pure black
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying vec3 vP; void main(){ float t = vP.y*.5+.5; vec3 c = mix(vec3(.012,.010,.016), vec3(.07,.06,.08), smoothstep(.2,1.,t)); gl_FragColor = vec4(c,1.); }`,
    }),
  );
  studio.add(room);

  panel(studio, 22, 14, 2.3, [-22, 20, 20]); // key softbox
  panel(studio, 2.4, 34, 7, [30, 4, 12]); // strip light, edge line
  panel(studio, 2.4, 30, 5, [-28, 6, -16]); // strip light, opposite edge
  panel(studio, 26, 16, 1.1, [26, 17, -22]); // back softbox: the satin sheen seen from the hero camera
  panel(studio, 30, 3, 2.2, [6, 26, -24], "#a78bfa"); // violet kicker
  panel(studio, 40, 40, 0.25, [0, 40, 0]); // weak top fill

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio, 0.035).texture;
  pmrem.dispose();
  studio.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return env;
}
