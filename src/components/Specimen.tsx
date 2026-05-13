import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, Points } from 'three';

export interface SpecimenParams {
  family: 'sphere' | 'polyhedron' | 'torus' | 'cylinder' | 'generic';
  density: number;
  rotationRate: number;
  jitter: [number, number, number];
  scale: number;
}

function Mesh3D({ p }: { p: SpecimenParams }) {
  const ref = useRef<Mesh & Points>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * p.rotationRate * 0.6;
    ref.current.rotation.y += dt * p.rotationRate;
  });

  const segments = Math.max(10, Math.round(28 * p.density));

  switch (p.family) {
    case 'sphere':
      return (
        <mesh ref={ref as React.RefObject<Mesh>} scale={p.scale}>
          <sphereGeometry args={[1, segments, segments]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'polyhedron':
      return (
        <mesh ref={ref as React.RefObject<Mesh>} scale={p.scale}>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'torus':
      return (
        <mesh ref={ref as React.RefObject<Mesh>} scale={p.scale}>
          <torusGeometry args={[0.8, 0.3, 16, segments]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    case 'cylinder':
      return (
        <mesh ref={ref as React.RefObject<Mesh>} scale={p.scale}>
          <cylinderGeometry args={[0.7, 0.7, 1.6, segments]} />
          <meshBasicMaterial color="currentColor" wireframe />
        </mesh>
      );
    default:
      return (
        <points ref={ref as React.RefObject<Points>} scale={p.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <pointsMaterial size={0.05} color="currentColor" />
        </points>
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
        camera={{ position: [0, 0, 3], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Mesh3D p={params} />
      </Canvas>
    </div>
  );
}
