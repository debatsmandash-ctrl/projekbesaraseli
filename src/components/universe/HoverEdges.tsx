import { useMemo } from "react";
import { QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import type { Graph } from "@/lib/graph/build";

/**
 * Render link-edges hanya untuk node yang sedang dipilih/hover.
 * Warna stroke = warna node TUJUAN (bintang yang dituju), bukan static.
 */
export function HoverEdges({ graph, activeId }: { graph: Graph; activeId: string | null }) {
  const linkEdges = useMemo(() => {
    if (!activeId) return [];
    return graph.edges.filter((e) => e.kind === "link" && (e.a === activeId || e.b === activeId));
  }, [activeId, graph]);

  if (!activeId) return null;

  return (
    <group>
      {linkEdges.map((e, i) => {
        const a = graph.byId.get(e.a);
        const b = graph.byId.get(e.b);
        if (!a || !b) return null;
        const A = new THREE.Vector3(...a.pos);
        const B = new THREE.Vector3(...b.pos);
        const mid = A.clone().add(B).multiplyScalar(0.5);
        const out = mid.clone().normalize().multiplyScalar(mid.length() * 0.25);
        const ctrl = mid.add(out);
        // warna mengikuti bintang TUJUAN (ujung yang bukan active)
        const target = e.a === activeId ? b : a;
        const color = target.color || e.color || "#ffffff";
        return (
          <QuadraticBezierLine
            key={`link-${i}`}
            start={[A.x, A.y, A.z]}
            end={[B.x, B.y, B.z]}
            mid={[ctrl.x, ctrl.y, ctrl.z]}
            color={color}
            lineWidth={1.6}
            transparent
            opacity={0.7}
            dashed={false}
          />
        );
      })}
    </group>
  );
}
