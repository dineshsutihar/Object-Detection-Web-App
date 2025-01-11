"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Box,
  Sphere,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingObjects() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.001;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* Generate multiple floating cubes */}
      {Array.from({ length: 10 }).map((_, i) => {
        const position = [
          Math.sin(i * 0.5) * 3,
          Math.cos(i * 0.5) * 3,
          Math.sin(i * 0.7) * 3,
        ];
        return (
          <Box
            key={i}
            args={[0.5, 0.5, 0.5]}
            position={position as [number, number, number]}
          >
            <meshStandardMaterial
              color="#4338ca"
              opacity={0.3}
              transparent
              wireframe
            />
          </Box>
        );
      })}

      {/* Detection points */}
      {Array.from({ length: 15 }).map((_, i) => {
        const theta = (i / 15) * Math.PI * 2;
        const position = [
          Math.cos(theta) * 4,
          Math.sin(i * 0.5) * 2,
          Math.sin(theta) * 4,
        ];
        return (
          <Sphere
            key={`point-${i}`}
            args={[0.05, 16, 16]}
            position={position as [number, number, number]}
          >
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={0.5}
            />
          </Sphere>
        );
      })}
    </group>
  );
}

export function BackgroundScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <FloatingObjects />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
