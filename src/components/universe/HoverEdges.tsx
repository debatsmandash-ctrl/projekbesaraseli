import { useMemo } from "react";
import { QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import type { Graph } from "@/lib/graph/build";

/**
 * Render link-edges hanya untuk node yang sedang dipilih/hover.
 * Garis dibuat melengkung — control point digeser 25% menjauh dari pusat
 * supaya tidak menembus cluster lain.
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
        // push control point away from world origin
        const out = mid.clone().normalize().multiplyScalar(mid.length() * 0.25);
        const ctrl = mid.add(out);
        const color = e.color || a.color;
        return (
          <QuadraticBezierLine
            key={`link-${i}`}
            start={[A.x, A.y, A.z]}
            end={[B.x, B.y, B.z]}
            mid={[ctrl.x, ctrl.y, ctrl.z]}
            color={color}
            lineWidth={1.4}
            transparent
            opacity={0.55}
            dashed={false}
          />
        );
      })}
    </group>
  );
}