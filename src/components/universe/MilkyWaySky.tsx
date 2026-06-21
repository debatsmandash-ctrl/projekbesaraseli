import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * MilkyWaySky — galaksi realistis full-procedural shader.
 *  - 7 oktaf FBM + ridge noise → struktur awan & dust lane tajam
 *  - Pusat galaksi (bulge) ASYMMETRIC — terang di SATU sisi saja (sisi kanan kamera awal)
 *  - 3 lapis bintang dipanggang langsung di shader (haze, mid, foreground bright)
 *  - Palet: deep navy → blue-white → cream → amber/emas core (TANPA pink/magenta)
 *  - 2 PointLight aksen warna core (amber + cool blue) untuk rim-light node
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

// ─── Noise primitives ───
float hash13(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float hash12(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i+vec3(0,0,0)),hash13(i+vec3(1,0,0)),f.x),
                 mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
                 mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm7(vec3 p){
  float a=0.0, w=0.5;
  for(int i=0;i<7;i++){ a+=w*vnoise(p); p=p*2.07+vec3(11.7,3.2,7.9); w*=0.5; }
  return a;
}
float ridge(vec3 p){ return 1.0 - abs(vnoise(p)*2.0 - 1.0); }
float ridgeFbm6(vec3 p){
  float a=0.0, w=0.55;
  for(int i=0;i<6;i++){ a+=w*ridge(p); p=p*2.13+vec3(5.0,9.1,2.3); w*=0.5; }
  return a;
}

// Bintang procedural: cell-based hash, threshold tinggi → titik tajam
float starsLayer(vec3 d, float density, float threshold, float sharpness){
  // proyeksi ke sphere ke grid pseudo-uv
  vec2 uv = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
  vec2 cell = uv * density;
  vec2 fcell = fract(cell);
  vec2 icell = floor(cell);
  float h = hash12(icell);
  if (h < threshold) return 0.0;
  // jarak ke titik bintang dalam sel
  vec2 starPos = vec2(hash12(icell+1.7), hash12(icell+5.3));
  float dStar = length(fcell - starPos);
  float br = (h - threshold) / (1.0 - threshold);
  return pow(max(0.0, 1.0 - dStar * sharpness), 4.0) * br;
}

void main(){
  vec3 d = normalize(vDir);

  float lat = d.y;
  float lon = atan(d.z, d.x);

  // ─── Pita disc (gaussian sempit + halo lebar) ───
  float band = exp(-pow(lat / 0.20, 2.0));
  float halo = exp(-pow(lat / 0.55, 2.0)) * 0.35;

  // ─── Struktur awan: FBM + ridge ───
  vec3 q = d * 2.6;
  float clouds = fbm7(q * 1.5);
  float ridges = ridgeFbm6(q * 2.2);
  float structure = mix(clouds, ridges, 0.55);
  // detail awan kedua (lebih halus)
  float fineCloud = fbm7(q * 5.2 + vec3(13.0));

  // ─── Dust lanes GELAP (tajam, mengikuti pita) ───
  float dustLane = exp(-pow(lat / 0.05, 2.0));
  float dustNoise = fbm7(q * 3.6 + vec3(7.0));
  float dust = dustLane * smoothstep(0.30, 0.78, dustNoise) * 1.0;

  // ─── ASYMMETRIC CORE BULGE: terang di SATU sisi (longitude ~ 0.7 rad) ───
  // bulge utama + bulge sekunder lebih lebar & redup
  float coreAng = exp(-pow((lon - 0.7) / 0.55, 2.0));
  float coreLat = exp(-pow(lat / 0.13, 2.0));
  float bulge = coreAng * coreLat;
  float coreGlow = bulge * (0.85 + 0.35 * fineCloud);
  // hotspot inti (sangat kecil & sangat terang)
  float coreHot = exp(-pow((lon - 0.72) / 0.18, 2.0)) * exp(-pow(lat / 0.06, 2.0));

  // ─── Intensitas pita ───
  float intensity = (band * structure * 1.15 + halo * clouds * 0.55) - dust * 0.85;
  intensity = clamp(intensity, 0.0, 1.6);

  // ─── Palet (no pink/magenta) ───
  vec3 colDark   = vec3(0.006, 0.010, 0.028);   // langit gelap
  vec3 colBlue   = vec3(0.14, 0.22, 0.38);      // pinggir pita
  vec3 colWhite  = vec3(0.78, 0.80, 0.86);      // bagian terang netral
  vec3 colCream  = vec3(0.82, 0.70, 0.52);      // tengah pita
  vec3 colAmber  = vec3(0.95, 0.72, 0.40);      // core
  vec3 colAmberHot = vec3(1.10, 0.85, 0.55);    // hotspot
  vec3 colDust   = vec3(0.015, 0.012, 0.022);

  vec3 col = colDark;
  col = mix(col, colBlue,  smoothstep(0.05, 0.40, intensity));
  col = mix(col, colWhite, smoothstep(0.40, 0.80, intensity));
  col = mix(col, colCream, smoothstep(0.55, 0.95, intensity));
  col = mix(col, colAmber, clamp(coreGlow, 0.0, 1.0));
  col = mix(col, colAmberHot, clamp(coreHot * 1.2, 0.0, 1.0));
  col = mix(col, colDust, dust);

  // ─── 3 lapis bintang langsung di shader ───
  // background haze: padat, lemah, lebih banyak di dalam pita
  float bgStars = starsLayer(d, 320.0, 0.90, 14.0) * (0.6 + band * 0.8);
  // mid stars: medium
  float midStars = starsLayer(d, 180.0, 0.94, 9.0) * (0.7 + band * 0.6);
  // foreground bright stars: jarang tapi besar & terang
  float fgStars = starsLayer(d, 60.0, 0.985, 5.0) * 1.4;

  // warna bintang: bias biru-putih di luar pita, krem-amber di dalam pita
  vec3 starColCool = vec3(0.88, 0.92, 1.10);
  vec3 starColWarm = vec3(1.10, 0.92, 0.70);
  vec3 starCol = mix(starColCool, starColWarm, smoothstep(0.0, 0.6, band));

  vec3 starsAdd = starCol * (bgStars * 0.55 + midStars * 1.0 + fgStars * 1.8);

  // fade ke gelap pekat di kutub (bintang tetap kelihatan)
  float poleFade = smoothstep(0.95, 0.55, abs(lat));
  col *= mix(0.30, 1.0, poleFade);

  // tambahkan bintang (additive)
  col += starsAdd;

  // alpha tetap solid (skybox), additive blend di renderer
  gl_FragColor = vec4(col * uOpacity, 1.0);
}
`;

export function MilkyWaySky({ opacity = 0.95 }: { opacity?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
    }),
    [opacity]
  );

  useFrame((_, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      matRef.current.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <group
      ref={groupRef}
      rotation={[0, THREE.MathUtils.degToRad(35), THREE.MathUtils.degToRad(14)]}
    >
      {/* Skybox sphere — kamera berada di dalam disc */}
      <mesh frustumCulled={false}>
        <sphereGeometry args={[900, 96, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          transparent={false}
        />
      </mesh>

      {/* Rim-light dari arah core galaksi (amber) + opposite (cool blue) */}
      <pointLight position={[300, 30, 80]} intensity={0.55} color="#ffb070" distance={620} decay={1.6} />
      <pointLight position={[-280, -20, -60]} intensity={0.32} color="#8aa6d8" distance={520} decay={1.8} />
      <pointLight position={[40, 220, -40]} intensity={0.18} color="#d8b27a" distance={500} decay={2} />
    </group>
  );
}
