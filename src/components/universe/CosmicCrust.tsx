import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Cosmic Crust — nebula sebagai kulit raksasa yang menyelimuti seluruh scene.
 * Kamera berada DI DALAM shell (side: BackSide). Shader 3D dengan:
 *  - FBM noise (3D, multi-oktaf) → struktur awan
 *  - Hole mask (domain warp + ridge) → lubang/kawah tak beraturan
 *  - Dust lane gelap pekat
 *  - Hotspot/filamen → titik-titik internal yang berpendar
 *  - Pseudo-normal lighting → highlight & shadow 3D di permukaan kerak
 */
const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform float uTime;
uniform float uOpacity;
uniform float uHoleBias;     // 0..1, lebih tinggi = lebih banyak lubang
uniform float uSeed;
uniform vec3  uColorA;       // cerulean
uniform vec3  uColorB;       // magenta
uniform vec3  uColorC;       // orange
uniform vec3  uColorDust;    // dark dust

float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p, int oct){
  float a=0.0; float w=0.55;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    a+=w*vnoise(p); p=p*2.07 + vec3(11.7,3.2,7.9); w*=0.5;
  }
  return a;
}
float ridge(vec3 p){ return 1.0 - abs(vnoise(p)*2.0 - 1.0); }
float ridgeFbm(vec3 p){
  float a=0.0, w=0.55;
  for(int i=0;i<5;i++){ a+=w*ridge(p); p=p*2.13+vec3(5.0,9.1,2.3); w*=0.5; }
  return a;
}

void main(){
  vec3 d = normalize(vDir);
  vec3 q = d * (3.4 + uSeed*0.7);
  // domain warp
  vec3 warp = vec3(
    fbm(q + vec3(uTime*0.012, 0.0, 0.0), 3),
    fbm(q + vec3(0.0, uTime*0.010, 5.2), 3),
    fbm(q + vec3(7.7, 0.0, uTime*0.014), 3)
  );
  vec3 p = q + (warp - 0.5) * 1.6;

  // base cloud
  float n  = fbm(p, OCTAVES_REPLACE);
  // sharper detail
  float n2 = fbm(p * 2.4 + vec3(uTime*0.02), 3);

  // hole mask: ridge noise threshold tinggi → lubang yang bergerigi tidak beraturan
  float r  = ridgeFbm(p * 1.2);
  float holeStrength = smoothstep(0.55 - uHoleBias*0.20, 0.80 - uHoleBias*0.20, r);

  // dust lane (band gelap pekat)
  float dust = smoothstep(0.18, 0.36, n) * smoothstep(0.62, 0.38, n);

  // base density
  float dens = smoothstep(0.30, 0.78, n*0.7 + n2*0.3);

  // hotspots — power curve → titik-titik super terang
  float hot = pow(smoothstep(0.55, 0.95, n2), 4.0);

  // pseudo lighting: gradient noise = normal proxy
  float e = 0.04;
  float nx = fbm(p+vec3(e,0,0), 3) - fbm(p-vec3(e,0,0), 3);
  float ny = fbm(p+vec3(0,e,0), 3) - fbm(p-vec3(0,e,0), 3);
  float nz = fbm(p+vec3(0,0,e), 3) - fbm(p-vec3(0,0,e), 3);
  vec3 nrm = normalize(vec3(nx, ny, nz) + 1e-4);
  vec3 lightDir = normalize(vec3(0.4, 0.5, 0.7));
  float diff = clamp(dot(nrm, lightDir) * 0.5 + 0.5, 0.0, 1.0);

  // warna: campur antara cerulean, magenta, orange berdasarkan noise
  float mixAB = smoothstep(0.20, 0.85, n);
  float mixBC = smoothstep(0.45, 0.90, n2);
  vec3 col = mix(uColorA, uColorB, mixAB);
  col = mix(col, uColorC, mixBC * 0.55);

  // dust lane gelap
  col = mix(col, uColorDust, dust * 0.65);

  // hotspot — boost emissive
  col += (uColorA*0.4 + uColorC*0.6) * hot * 2.2;

  // shading 3D
  col *= (0.55 + diff * 0.9);

  // alpha: padat di sebagian besar area, bolong di hole
  float alpha = dens;
  alpha *= (1.0 - holeStrength);          // lubang transparan → starfield terlihat
  alpha = clamp(alpha, 0.0, 1.0);
  alpha *= uOpacity;

  // hotspot tetap terlihat sedikit walau di area tipis
  alpha = max(alpha, hot * 0.55 * uOpacity);

  if(alpha < 0.004) discard;

  // tone — sedikit gamma agar gak silau
  col = pow(col, vec3(1.0/1.18));
  gl_FragColor = vec4(col, alpha);
}
`;

interface ShellProps {
  radius: number;
  octaves: number;
  opacity: number;
  seed: number;
  holeBias: number;
}

function CrustShell({ radius, octaves, opacity, seed, holeBias }: ShellProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const material = useMemo(() => {
    const frag = fragmentShader.replace("OCTAVES_REPLACE", String(Math.max(2, Math.min(7, octaves | 0))));
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: frag,
      uniforms: {
        uTime:      { value: 0 },
        uOpacity:   { value: opacity },
        uHoleBias:  { value: holeBias },
        uSeed:      { value: seed },
        uColorA:    { value: new THREE.Color("#1ec8ff") }, // cerulean
        uColorB:    { value: new THREE.Color("#d946ef") }, // magenta
        uColorC:    { value: new THREE.Color("#ff7a18") }, // orange
        uColorDust: { value: new THREE.Color("#06070d") }, // near-black dust
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [octaves]);
  matRef.current = material;

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uHoleBias.value = holeBias;
  });

  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <icosahedronGeometry args={[radius, 5]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export function CosmicCrust({ shells, octaves, opacity }: { shells: number; octaves: number; opacity: number }) {
  const layers = useMemo(() => {
    const arr: ShellProps[] = [];
    const N = Math.max(1, Math.min(3, shells));
    for (let i = 0; i < N; i++) {
      arr.push({
        radius: 820 - i * 70,
        octaves: Math.max(3, octaves - i),
        opacity: opacity * (i === 0 ? 1.0 : 0.62),
        seed: i * 1.37,
        holeBias: i === 0 ? 0.0 : 0.4,
      });
    }
    return arr;
  }, [shells, octaves, opacity]);

  return (
    <group>
      {layers.map((l, i) => <CrustShell key={i} {...l} />)}
    </group>
  );
}