"use client";

import { useRef, useState } from "react";
import {
  Center,
  ContactShadows,
  Environment,
  Float,
  PerspectiveCamera,
  Trail,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BARRIER_RADIUS = 3.8;

export type IntroPhase = "INIT" | "ATTACK" | "DEFEND" | "SHOW_TITLE";

/**
 * 攻撃ビーム（単体）
 */
function SingleBeam({
  isActive,
  onHit,
  delay = 0,
}: {
  isActive: boolean;
  onHit: () => void;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const params = useRef({
    dir: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    speed: 0,
    fired: false,
    startTime: 0,
  });

  useFrame((state) => {
    if (isActive && !params.current.fired) {
      if (params.current.startTime === 0) {
        params.current.startTime = state.clock.elapsedTime + delay;
      }
      if (state.clock.elapsedTime < params.current.startTime) return;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );

      const startDist = 18;
      const startPos = dir.clone().multiplyScalar(startDist);

      params.current = {
        ...params.current,
        dir,
        pos: startPos,
        speed: 0.7 + Math.random() * 0.2,
        fired: true,
      };

      if (meshRef.current) {
        meshRef.current.position.copy(startPos);
        meshRef.current.visible = true;
      }
    }

    if (isActive && params.current.fired && meshRef.current) {
      const p = params.current;
      p.pos.sub(p.dir.clone().multiplyScalar(p.speed));
      meshRef.current.position.copy(p.pos);

      if (p.pos.length() <= BARRIER_RADIUS) {
        onHit();
        p.fired = false;
        meshRef.current.visible = false;
        params.current.startTime = 0;
      }
    }
  });

  return (
    <Trail width={0.6} length={4} color="#ef4444" attenuation={(t) => t * t}>
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ef4444" toneMapped={false} />
      </mesh>
    </Trail>
  );
}

/**
 * ビーム管理
 */
function BeamManager({
  triggerCount,
  isIntroAttack,
  onBeamHit,
}: {
  triggerCount: number;
  isIntroAttack: boolean;
  onBeamHit: () => void;
}) {
  const POOL_SIZE = 12;
  const [beams, setBeams] = useState(
    Array(POOL_SIZE).fill({ active: false, id: 0 })
  );
  const lastTriggerRef = useRef(0);
  const introFiredRef = useRef(false);

  const fireBeam = (delay = 0) => {
    setBeams((prev) => {
      const next = [...prev];
      const index = next.findIndex((b) => !b.active);
      if (index !== -1) {
        next[index] = { active: true, id: Date.now() + Math.random(), delay };
      }
      return next;
    });
  };

  useFrame(() => {
    if (triggerCount > lastTriggerRef.current) {
      fireBeam(0);
      lastTriggerRef.current = triggerCount;
    }
  });

  useFrame(() => {
    if (isIntroAttack && !introFiredRef.current) {
      fireBeam(0);
      fireBeam(0.1);
      fireBeam(0.25);
      fireBeam(0.4);
      fireBeam(0.5);
      introFiredRef.current = true;
    }
  });

  const handleHit = (index: number) => {
    setBeams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], active: false };
      return next;
    });
    onBeamHit();
  };

  return (
    <>
      {beams.map((beam, i) => (
        <SingleBeam
          key={i}
          isActive={beam.active}
          onHit={() => handleHit(i)}
          delay={beam.delay}
        />
      ))}
    </>
  );
}

/**
 * バリア
 */
function SphereBarrier({
  hitTrigger,
  phase,
}: {
  hitTrigger: number;
  phase: IntroPhase;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const lastHitRef = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.z -= delta * 0.05;

      const targetScale = phase === "DEFEND" || phase === "SHOW_TITLE" ? 1 : 0;
      const currentScale = meshRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(
        currentScale,
        targetScale,
        delta * 8
      );
      meshRef.current.scale.setScalar(nextScale);
    }

    if (materialRef.current) {
      if (hitTrigger > lastHitRef.current) {
        materialRef.current.emissive.setHex(0xffaaaa);
        materialRef.current.emissiveIntensity = 2.0;
        lastHitRef.current = hitTrigger;
      } else {
        materialRef.current.emissive.lerp(
          new THREE.Color("#a855f7"),
          delta * 5
        );
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          materialRef.current.emissiveIntensity,
          0.2,
          delta * 5
        );
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[0, 0, 0]}>
      <sphereGeometry args={[BARRIER_RADIUS, 64, 64]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#e9d5ff"
        emissive="#a855f7"
        emissiveIntensity={0.2}
        roughness={0.0}
        metalness={0.2}
        transmission={0.9}
        thickness={0.5}
        ior={1.5}
        clearcoat={1.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * コア
 */
function TetrahedronCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.3;
      const scale = 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[2.8, 3.5, 3]} />
      <meshPhysicalMaterial
        color="#c0f0ff"
        emissive="#00ddff"
        emissiveIntensity={1.0}
        roughness={0.2}
        metalness={1}
        clearcoat={1.0}
        sheen={1.5}
        sheenColor="#dd00ff"
        flatShading={true}
      />
    </mesh>
  );
}

/**
 * Main Component
 */
export default function ThreeTitleLogo({
  phase,
  onHit,
}: {
  phase: IntroPhase;
  onHit?: () => void;
}) {
  const [triggerCount, setTriggerCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const isIntroAttack = phase === "ATTACK";

  const handleBeamHit = () => {
    setHitCount((c) => c + 1);
    onHit?.();
  };

  const handleClick = () => {
    setTriggerCount((p) => p + 1);
  };

  return (
    <div className="w-full h-full cursor-pointer" onClick={handleClick}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 17]} />
        <Environment preset="city" environmentIntensity={0.5} />

        <ambientLight intensity={0.4} color="#ffffff" />
        <spotLight
          position={[0, 0, 15]}
          angle={0.4}
          penumbra={1}
          intensity={25}
          color="#fb09ff"
        />
        <pointLight
          position={[-6, 3, 5]}
          intensity={80}
          color="#d946ef"
          distance={20}
        />
        <pointLight
          position={[6, -3, 5]}
          intensity={80}
          color="#a855f7"
          distance={20}
        />
        <pointLight
          position={[0, 0, -10]}
          intensity={50}
          color="#22d3ee"
          distance={20}
        />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Center position={[0, 1.2, 0]}>
            <BeamManager
              triggerCount={triggerCount}
              isIntroAttack={isIntroAttack}
              onBeamHit={handleBeamHit}
            />
            <SphereBarrier hitTrigger={hitCount} phase={phase} />
            <TetrahedronCore />
          </Center>
        </Float>

        <ContactShadows
          position={[0, -3.5, 0]}
          opacity={0.6}
          scale={20}
          blur={5}
          far={10}
          color="#7e22ce"
        />
      </Canvas>
    </div>
  );
}
