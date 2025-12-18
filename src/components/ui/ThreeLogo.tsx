"use client";

import { useState, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Environment,
  Float,
  PerspectiveCamera,
  ContactShadows,
  Trail,
} from "@react-three/drei";
import * as THREE from "three";

// バリアの半径
const BARRIER_RADIUS = 3.8;

// --- 画像保存用のヘルパー関数は削除し、コンポーネント内に移動します ---

/**
 * 攻撃ビーム（単体）
 * activeな時だけ飛んでいき、バリアに当たると消滅する
 */
function SingleBeam({
  isActive,
  onHit,
}: {
  isActive: boolean;
  onHit: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 発射パラメータを保持するRef
  const params = useRef({
    dir: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    speed: 0,
    fired: false, // 発射済みフラグ
  });

  useFrame(() => {
    // アクティブになった瞬間に初期化
    if (isActive && !params.current.fired) {
      // ランダムな方向から
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );

      const startDist = 15; // 画面外から
      const startPos = dir.clone().multiplyScalar(startDist);

      params.current = {
        dir,
        pos: startPos,
        speed: 0.8 + Math.random() * 0.4, // かなり高速に
        fired: true,
      };

      if (meshRef.current) {
        meshRef.current.position.copy(startPos);
        meshRef.current.visible = true;
      }
    }

    if (isActive && params.current.fired && meshRef.current) {
      const p = params.current;

      // 移動
      p.pos.sub(p.dir.clone().multiplyScalar(p.speed));
      meshRef.current.position.copy(p.pos);

      // 向き調整
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.rotateX(Math.PI / 2);

      // バリア到達判定
      if (p.pos.length() <= BARRIER_RADIUS) {
        // ヒットしたら親に通知して非アクティブにする
        onHit();
        p.fired = false;
        meshRef.current.visible = false;
      }
    }
  });

  return (
    <Trail
      width={1.2} // 太く
      length={6} // 長く
      color="#ef4444"
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} visible={false}>
        <capsuleGeometry args={[0.15, 2, 4, 8]} />
        <meshBasicMaterial color="#ef4444" toneMapped={false} />
      </mesh>
    </Trail>
  );
}

/**
 * ビーム管理マネージャー
 * クリックされるたびにビームを生成・発射する
 */
function BeamManager({ triggerCount }: { triggerCount: number }) {
  // 同時に表示できる最大ビーム数（プールしておく）
  const POOL_SIZE = 10;
  const [beams, setBeams] = useState(
    Array(POOL_SIZE).fill({ active: false, id: 0 })
  );

  // triggerCountが増えたら、空いているビームを発射
  const lastTriggerRef = useRef(0);

  useFrame(() => {
    if (triggerCount > lastTriggerRef.current) {
      // 未使用のビームを探して発射
      setBeams((prev) => {
        const next = [...prev];
        const index = next.findIndex((b) => !b.active);
        if (index !== -1) {
          next[index] = { active: true, id: Date.now() };
        }
        return next;
      });
      lastTriggerRef.current = triggerCount;
    }
  });

  const handleHit = (index: number) => {
    setBeams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], active: false };
      return next;
    });
  };

  return (
    <>
      {beams.map((beam, i) => (
        <SingleBeam key={i} isActive={beam.active} onHit={() => handleHit(i)} />
      ))}
    </>
  );
}

/**
 * バリア（球体）
 * 攻撃を受けると一瞬赤く光る演出を追加
 */
function SphereBarrier({ hitTrigger }: { hitTrigger: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  // const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  // const lastHitRef = useRef(0);

  // useFrame((state, delta) => {
  //   if (meshRef.current) {
  //     meshRef.current.rotation.y += delta * 0.1;
  //     meshRef.current.rotation.z -= delta * 0.05;
  //   }

  //   // ヒット時の発光アニメーション
  //   if (materialRef.current) {
  //     if (hitTrigger > lastHitRef.current) {
  //       // ヒットした瞬間: 発光色を赤にする
  //       materialRef.current.emissive.setHex(0xffaaaa);
  //       materialRef.current.emissiveIntensity = 2.0;
  //       lastHitRef.current = hitTrigger;
  //     } else {
  //       // 通常時: 徐々に紫に戻る
  //       materialRef.current.emissive.lerp(
  //         new THREE.Color("#a855f7"),
  //         delta * 5
  //       );
  //       // 強度も戻る
  //       materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
  //         materialRef.current.emissiveIntensity,
  //         0.2,
  //         delta * 5
  //       );
  //     }
  //   }
  // });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[BARRIER_RADIUS, 64, 64]} />
      <meshPhysicalMaterial
        // ref={materialRef}
        color="#e9d5ff"
        emissive="#a855f7"
        emissiveIntensity={0.2}
        roughness={0.05}
        metalness={0.05}
        transmission={0.9}
        thickness={0.5}
        ior={1.5}
        clearcoat={1.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ... TetrahedronCore は変更なしなので省略 (前のコードをそのまま使ってください) ...
function TetrahedronCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  // const [hovered, setHover] = useState(false);
  // useFrame((state, delta) => {
  //   if (meshRef.current) {
  //     meshRef.current.rotation.y += delta * 0.5;
  //     meshRef.current.rotation.x += delta * 0.3;
  //     meshRef.current.rotation.z += delta * 0.1;
  //     const scale = 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
  //     const hoverScale = hovered ? 1.2 : 1.0;
  //     meshRef.current.scale.set(
  //       scale * hoverScale,
  //       scale * hoverScale,
  //       scale * hoverScale
  //     );
  //   }
  // });
  return (
    <mesh
      ref={meshRef}
      // onPointerOver={() => setHover(true)}
      // onPointerOut={() => setHover(false)}
      rotation={[0, 0, 0]}
      scale={[1.1, 1.1, 1.1]}
    >
      {/* <tetrahedronGeometry args={[3.0, 0]} /> */}
      <coneGeometry args={[3.2, 3.5, 3]} />
      <meshPhysicalMaterial
        color="#c0f0ff"
        emissive="#00ddff"
        emissiveIntensity={1.0}
        roughness={0.2}
        metalness={1}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        sheen={1.5}
        sheenColor="#dd00ff"
        sheenRoughness={0.5}
        flatShading={true}
      />
    </mesh>
  );
}

export default function ThreeSvgLogo({ url }: { url?: string }) {
  const [triggerCount, setTriggerCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas要素への参照

  // 画像保存ハンドラー
  const handleDownload = () => {
    if (canvasRef.current) {
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "3d-logo.png";
        link.href = dataUrl;
        link.click();
      } catch (e) {
        console.error("Failed to capture image:", e);
      }
    }
  };

  // キャンバス全体をクリックしたときの処理
  const handleClick = () => {
    // ビーム発射トリガー
    setTriggerCount((prev) => prev + 1);

    // ヒット時の演出（少し遅れて発生させるのがリアルだが、今回は簡易的に同期）
    setTimeout(() => {
      setHitCount((prev) => prev + 1);
    }, 400); // ビームが届くまでの大体の時間
  };

  return (
    <div
      className="w-[500px] h-[500px] relative flex items-center justify-center rounded-xl overflow-hidden border border-gray-200 cursor-pointer group"
      // ★ 背景色を削除しました（透明にするため）
      // bg-gray-50 を削除
      style={{ background: "transparent" }}
      onClick={handleClick}
    >
      <Canvas
        // ★ 画像保存のために必須の設定
        gl={{ preserveDrawingBuffer: true }}
        onCreated={(state) => {
          // React Three Fiberが作成した実際のCanvas要素をRefに保存
          canvasRef.current = state.gl.domElement;
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 9]} />
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

        {/* <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}> */}
        <Float speed={0} rotationIntensity={0} floatIntensity={0}>
          <Center>
            {/* ビーム管理 */}
            <BeamManager triggerCount={triggerCount} />

            {/* バリア (ヒット検知で光る) */}
            <SphereBarrier hitTrigger={hitCount} />

            {/* コア */}
            <TetrahedronCore />
          </Center>
        </Float>

        <ContactShadows
          position={[0, -5, 0]}
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
