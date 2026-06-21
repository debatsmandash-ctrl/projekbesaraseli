import { useMemo } from "react";

export type DeviceTier = "desktop" | "mobile";

export interface DeviceProfile {
  tier: DeviceTier;
  dpr: [number, number];
  nebulaSteps: number;
  bloomIntensity: number;
  bloomRadius: number;
  chromaticAberration: boolean;
  starSegments: number;
  haloLayers: 1 | 2;
  damping: number;
  rotateSpeed: number;
  crustShells: number;
  crustOctaves: number;
}

export function useDeviceProfile(): DeviceProfile {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        tier: "desktop", dpr: [1.5, 2.5], nebulaSteps: 64,
        bloomIntensity: 1.7, bloomRadius: 1.05, chromaticAberration: true,
        starSegments: 24, haloLayers: 2, damping: 0.1, rotateSpeed: 0.5,
        crustShells: 2, crustOctaves: 5,
      };
    }
    const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
    if (isMobile) {
      return {
        tier: "mobile", dpr: [1, 1.5], nebulaSteps: 22,
        bloomIntensity: 1.5, bloomRadius: 0.9, chromaticAberration: false,
        starSegments: 14, haloLayers: 1, damping: 0.12, rotateSpeed: 0.75,
        crustShells: 1, crustOctaves: 3,
      };
    }
    return {
      tier: "desktop", dpr: [1.5, 2.5], nebulaSteps: 64,
      bloomIntensity: 1.7, bloomRadius: 1.05, chromaticAberration: true,
      starSegments: 28, haloLayers: 2, damping: 0.1, rotateSpeed: 0.5,
      crustShells: 2, crustOctaves: 5,
    };
  }, []);
}