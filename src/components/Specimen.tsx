import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

export interface SpecimenParams {
  family: 'sphere' | 'polyhedron' | 'torus' | 'cylinder' | 'generic';
  density: number;
  rotationRate: number;
  jitter: [number, number, number];
  scale: number;
}

function Mesh3D({ p }: { p: SpecimenParams }) {
  const ref = useRef<Mesh>(null);
  const motion = Math.max(0.05, Math.min(0.45, p.rotationRate));
  const safeScale = Math.max(0.72, Math.min(0.98, p.scale));
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * motion * 0.45;
    ref.current.rotation.y += dt * motion;
  });

  const segments = Math.max(10, Math.round(28 * p.density));
  const [jx, jy, jz] = p.jitter;
  const position: [number, number, number] = [jx * 0.08, jy * 0.08, jz * 0.08];

  switch (p.family) {
    case 'sphere':
      return (
        <mesh ref={ref} scale={safeScale} position={position}>
          <octahedronGeometry args={[1, 2]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'polyhedron':
      return (
        <mesh ref={ref} scale={safeScale} position={position}>
          <icosahedronGeometry args={[1.02, 0]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'torus':
      return (
        <mesh ref={ref} scale={safeScale} position={position}>
          <torusKnotGeometry args={[0.64, 0.17, 96, 12]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'cylinder':
      return (
        <mesh ref={ref} scale={safeScale} position={position}>
          <cylinderGeometry args={[0.74, 0.74, 1.45, segments]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    default:
      return (
        <mesh ref={ref} scale={safeScale} position={position}>
          <boxGeometry args={[1.32, 1.32, 1.32, 2, 2, 2]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
  }
}

export default function Specimen({ params, size = 120 }: { params: SpecimenParams; size?: number }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return null;

  return (
    <div style={{ width: size, height: size, color: 'currentColor' }}>
      <Canvas
        camera={{ position: [0, 0, 3.35], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Mesh3D p={params} />
      </Canvas>
    </div>
  );
}
