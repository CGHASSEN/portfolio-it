import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, MeshStandardMaterial, PointLight } from "three";
import { Color, MathUtils } from "three";

type DataCenterSceneProps = {
  entering: boolean;
  onEnter: () => void;
  onComplete: () => void;
};

const metal = new Color("#40515d");

function WallControlPanel() {
  return (
    <group position={[-4.15, 3.45, 0.3]}>
      <mesh>
        <boxGeometry args={[3.72, 2.06, 0.16]} />
        <meshStandardMaterial color="#263640" metalness={0.88} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.092]}>
        <boxGeometry args={[3.48, 1.82, 0.035]} />
        <meshStandardMaterial color="#111d25" metalness={0.7} roughness={0.37} />
      </mesh>
      <mesh position={[-0.9, 0, 0.12]}>
        <boxGeometry args={[1.34, 1.48, 0.035]} />
        <meshStandardMaterial color="#07131b" metalness={0.4} roughness={0.3} emissive="#07324a" emissiveIntensity={0.8} />
      </mesh>
      {[-0.55, -0.25, 0.05, 0.35].map((y, index) => (
        <mesh key={y} position={[-0.9, y, 0.145]}>
          <boxGeometry args={[0.94 - (index % 2) * 0.18, 0.025, 0.012]} />
          <meshBasicMaterial color={index === 0 ? "#65cfff" : "#395464"} />
        </mesh>
      ))}
      <mesh position={[0.88, 0.5, 0.12]}>
        <boxGeometry args={[1.28, 0.16, 0.035]} />
        <meshStandardMaterial color="#354953" metalness={0.84} roughness={0.3} />
      </mesh>
      {[-0.35, 0, 0.35].map((y, index) => (
        <group key={y} position={[0.9, y, 0.13]}>
          <mesh>
            <boxGeometry args={[1.12, 0.11, 0.025]} />
            <meshStandardMaterial color="#202f38" metalness={0.82} roughness={0.35} />
          </mesh>
          <mesh position={[-0.43, 0, 0.02]}>
            <boxGeometry args={[0.035, 0.04, 0.012]} />
            <meshBasicMaterial color={index === 0 ? "#9bea70" : "#55c8ed"} />
          </mesh>
        </group>
      ))}
      {[-1.72, 1.72].map((x) => (
        <mesh key={x} position={[x, 0, 0.12]}>
          <boxGeometry args={[0.035, 1.72, 0.025]} />
          <meshStandardMaterial color="#657984" metalness={0.92} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Door({ entering, onEnter }: { entering: boolean; onEnter: () => void }) {
  const hinge = useRef<Group>(null);
  const wheel = useRef<Group>(null);
  const lockingBars = useRef<Group>(null);
  const frameGlow = useRef<MeshStandardMaterial[]>([]);
  const circuitGlow = useRef<MeshStandardMaterial[]>([]);
  const accessLight = useRef<MeshStandardMaterial>(null);
  const redLight = useRef<MeshStandardMaterial>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!entering) return;
    elapsed.current += delta;
    const outline = MathUtils.smoothstep(elapsed.current, 0.15, 1.25);
    const unlock = MathUtils.smoothstep(elapsed.current, 0.8, 1.8);
    const opening = MathUtils.smoothstep(elapsed.current, 1.95, 3.65);
    if (hinge.current) hinge.current.rotation.y = opening * 1.48;
    if (wheel.current) wheel.current.rotation.z = unlock * Math.PI * 2;
    if (lockingBars.current) {
      lockingBars.current.position.set(0, unlock * 0.16, 0.28 - unlock * 0.2);
    }
    frameGlow.current.forEach((material) => {
      material.emissiveIntensity = 0.15 + outline * 3.4;
    });
    circuitGlow.current.forEach((material, index) => {
      const sweep = MathUtils.smoothstep(
        elapsed.current,
        1.05 + index * 0.16,
        1.55 + index * 0.16,
      );
      material.emissiveIntensity = 0.12 + sweep * 2.8;
    });

    if (accessLight.current) {
      accessLight.current.emissiveIntensity = elapsed.current > 0.8 ? 3.2 : 0.8;
    }
    if (redLight.current) {
      redLight.current.emissiveIntensity = elapsed.current < 0.95 ? 1.1 : 0.05;
    }
  });

  return (
    <>
      <mesh position={[0, 2.54, -0.17]}>
        <boxGeometry args={[4.35, 5.35, 0.58]} />
        <meshStandardMaterial color="#15212a" metalness={0.8} roughness={0.43} />
      </mesh>
      {[[-2.12, 2.65, 0.18], [2.12, 2.65, 0.18]].map(([x, y, z]) => (
        <mesh key={x} position={[x, y, z]}>
          <boxGeometry args={[0.34, 5.18, 0.46]} />
          <meshStandardMaterial color="#60717b" metalness={0.88} roughness={0.27} />
        </mesh>
      ))}
      <mesh position={[0, 5.22, 0.17]}>
        <boxGeometry args={[4.58, 0.38, 0.46]} />
        <meshStandardMaterial color="#455660" metalness={0.88} roughness={0.3} />
      </mesh>
      <mesh position={[0, 5.23, 0.42]}>
        <boxGeometry args={[3.85, 0.035, 0.025]} />
        <meshStandardMaterial ref={(material) => { if (material) frameGlow.current[0] = material; }} color="#63dfff" emissive="#14bde8" emissiveIntensity={0.15} />
      </mesh>
      {[-2.12, 2.12].map((x, index) => (
        <mesh key={x} position={[x, 2.65, 0.42]}>
          <boxGeometry args={[0.035, 4.9, 0.025]} />
          <meshStandardMaterial ref={(material) => { if (material) frameGlow.current[index + 1] = material; }} color="#63dfff" emissive="#14bde8" emissiveIntensity={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0.42]}>
        <boxGeometry args={[3.85, 0.035, 0.025]} />
        <meshStandardMaterial ref={(material) => { if (material) frameGlow.current[3] = material; }} color="#63dfff" emissive="#14bde8" emissiveIntensity={0.15} />
      </mesh>
      <WallControlPanel />
      <group ref={hinge} position={[-1.78, 0.08, 0.1]}>
        <mesh
          castShadow={false}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onEnter();
          }}
          position={[1.78, 2.42, 0]}
        >
          <boxGeometry args={[3.56, 4.84, 0.2]} />
          <meshStandardMaterial color={metal} metalness={0.82} roughness={0.32} />
        </mesh>
        <mesh position={[1.78, 2.42, 0.108]}>
          <boxGeometry args={[3.3, 4.58, 0.025]} />
          <meshStandardMaterial color="#34434e" metalness={0.42} roughness={0.43} />
        </mesh>
        <mesh position={[1.78, 2.42, 0.127]}>
          <boxGeometry args={[2.94, 4.14, 0.018]} />
          <meshStandardMaterial color="#34434c" metalness={0.66} roughness={0.32} />
        </mesh>
        <mesh position={[1.78, 2.42, 0.145]}>
          <boxGeometry args={[2.58, 3.8, 0.018]} />
          <meshStandardMaterial color="#202c34" metalness={0.75} roughness={0.31} />
        </mesh>
        {[0.28, 3.28].map((x) => (
          <mesh key={x} position={[x, 2.42, 0.17]}>
            <boxGeometry args={[0.045, 4.1, 0.035]} />
            <meshStandardMaterial color="#71838c" metalness={0.9} roughness={0.24} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[1.78 + Math.cos(angle) * 1.14, 2.42 + Math.sin(angle) * 1.14, 0.19]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.055, 0.055, 0.055, 8]} />
              <meshStandardMaterial color="#bac6ca" metalness={0.94} roughness={0.2} />
            </mesh>
          );
        })}
        <group ref={lockingBars} position={[0, 0, 0.28]}>
          {[-1, 1].map((direction) => (
            <group key={direction}>
              <mesh position={[1.78 + direction * 1.28, 2.42, 0]}>
                <boxGeometry args={[1.65, 0.18, 0.16]} />
                <meshStandardMaterial color="#9aa8ad" metalness={0.94} roughness={0.2} />
              </mesh>
              <mesh position={[1.78, 2.42 + direction * 1.35, 0]}>
                <boxGeometry args={[0.18, 1.42, 0.16]} />
                <meshStandardMaterial color="#85959d" metalness={0.9} roughness={0.22} />
              </mesh>
            </group>
          ))}
        </group>
        <group ref={wheel} position={[1.78, 2.42, 0.27]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.02, 1.02, 0.1, 48]} />
            <meshStandardMaterial color="#101a21" metalness={0.84} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.065]}>
            <torusGeometry args={[0.91, 0.055, 10, 64]} />
            <meshStandardMaterial color="#6b7c84" metalness={0.94} roughness={0.21} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <torusGeometry args={[0.77, 0.025, 8, 64]} />
            <meshStandardMaterial color="#34c9ee" emissive="#13a9d2" emissiveIntensity={1.8} metalness={0.6} roughness={0.28} />
          </mesh>
          {Array.from({ length: 8 }, (_, index) => (
            <group key={index} rotation={[0, 0, (index / 8) * Math.PI * 2]}>
              <mesh position={[0, 0.44, 0.105]}>
                <boxGeometry args={[0.13, 0.66, 0.12]} />
                <meshStandardMaterial color="#94a3aa" metalness={0.94} roughness={0.23} />
              </mesh>
              <mesh position={[0, 0.82, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.1, 10]} />
                <meshStandardMaterial color="#53636c" metalness={0.94} roughness={0.2} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 32]} />
            <meshStandardMaterial color="#61737c" metalness={0.96} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.045, 32]} />
            <meshStandardMaterial color="#0b1c25" metalness={0.58} roughness={0.23} emissive="#087f9d" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0, 0.33]}>
            <torusGeometry args={[0.12, 0.012, 8, 32]} />
            <meshBasicMaterial color="#83f1ff" toneMapped={false} />
          </mesh>
        </group>
        {[0.42, 4.42].map((y) => (
          <group key={y} position={[3.45, y, 0.05]}>
            <mesh>
              <boxGeometry args={[0.2, 0.36, 0.46]} />
              <meshStandardMaterial color="#64737b" metalness={0.95} roughness={0.22} />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
              <meshStandardMaterial color="#93a3a9" metalness={0.96} roughness={0.19} />
            </mesh>
          </group>
        ))}
        <mesh position={[1.78, 2.42, 0.355]}>
          <boxGeometry args={[2.02, 0.025, 0.025]} />
          <meshStandardMaterial color="#52dcf7" emissive="#09b6db" emissiveIntensity={2.1} />
        </mesh>
        <mesh position={[1.78, 2.42, 0.355]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[2.02, 0.025, 0.025]} />
          <meshStandardMaterial color="#52dcf7" emissive="#09b6db" emissiveIntensity={2.1} />
        </mesh>
        {Array.from({ length: 5 }, (_, index) => (
          <mesh key={index} position={[1.78, 0.78 + index * 0.82, 0.2]}>
            <boxGeometry args={[2.48, 0.018, 0.02]} />
            <meshStandardMaterial
              ref={(material) => { if (material) circuitGlow.current[index] = material; }}
              color="#72eaff"
              emissive="#13bde1"
              emissiveIntensity={0.12}
            />
          </mesh>
        ))}
        <mesh position={[0.22, 2.42, 0.2]}>
          <boxGeometry args={[0.055, 0.5, 0.025]} />
          <meshStandardMaterial color="#48d9f4" emissive="#12b8dc" emissiveIntensity={2} />
        </mesh>
        <mesh position={[3.34, 2.42, 0.2]}>
          <boxGeometry args={[0.055, 0.5, 0.025]} />
          <meshStandardMaterial color="#48d9f4" emissive="#12b8dc" emissiveIntensity={2} />
        </mesh>
        <mesh position={[1.78, 0.46, 0.16]}>
          <boxGeometry args={[2.65, 0.06, 0.045]} />
          <meshStandardMaterial color="#5d707a" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[1.78, 4.38, 0.16]}>
          <boxGeometry args={[2.65, 0.06, 0.045]} />
          <meshStandardMaterial color="#5d707a" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[1.78, 4.1, 0.19]}>
          <boxGeometry args={[0.82, 0.28, 0.035]} />
          <meshStandardMaterial color="#0d171e" metalness={0.45} roughness={0.38} />
        </mesh>
        <mesh position={[1.78, 4.1, 0.215]}>
          <boxGeometry args={[0.5, 0.025, 0.014]} />
          <meshStandardMaterial color="#66dff5" emissive="#26a6d2" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[1.78, 3.97, 0.215]}>
          <boxGeometry args={[0.3, 0.018, 0.014]} />
          <meshStandardMaterial color="#a2eb77" emissive="#70c94c" emissiveIntensity={1.1} />
        </mesh>
        {[-1.43, 1.43].map((x) => (
          <mesh key={x} position={[x, 2.42, 0.168]}>
            <boxGeometry args={[0.025, 3.8, 0.02]} />
            <meshStandardMaterial color="#52dcf7" emissive="#09b6db" emissiveIntensity={1.6} />
          </mesh>
        ))}
      </group>

      {[-1.78, 1.78].map((x) => (
        <group key={x} position={[x, 0.12, 0.31]}>
          <mesh position={[0, 0.54, 0]}>
            <boxGeometry args={[0.4, 0.28, 0.36]} />
            <meshStandardMaterial color="#6e7d83" metalness={0.96} roughness={0.2} />
          </mesh>
          <mesh position={[0, 4.38, 0]}>
            <boxGeometry args={[0.4, 0.28, 0.36]} />
            <meshStandardMaterial color="#6e7d83" metalness={0.96} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.46, -0.08]}>
            <boxGeometry args={[0.22, 3.2, 0.5]} />
            <meshStandardMaterial color="#3d4d56" metalness={0.9} roughness={0.27} />
          </mesh>
        </group>
      ))}

      <group position={[2.35, 2.52, 0.46]}>
        <mesh>
          <boxGeometry args={[0.58, 1.72, 0.16]} />
          <meshStandardMaterial color="#111d25" metalness={0.82} roughness={0.27} />
        </mesh>
        <mesh position={[0, 0.42, 0.09]}>
          <boxGeometry args={[0.39, 0.4, 0.025]} />
          <meshStandardMaterial color="#07131b" metalness={0.4} roughness={0.24} emissive="#075a76" emissiveIntensity={1.1} />
        </mesh>
        <mesh position={[0, 0.42, 0.11]}>
          <boxGeometry args={[0.25, 0.025, 0.012]} />
          <meshStandardMaterial color="#72e8f8" emissive="#1bbfdc" emissiveIntensity={1.8} />
        </mesh>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} position={[x, -0.08, 0.105]}>
            <boxGeometry args={[0.035, 0.035, 0.018]} />
            <meshStandardMaterial color="#79d5e8" emissive="#1487a5" emissiveIntensity={0.85} />
          </mesh>
        ))}
        {[-0.3, -0.42, -0.54].map((y, index) => (
          <mesh key={y} position={[0, y, 0.105]}>
            <boxGeometry args={[0.29, 0.035, 0.018]} />
            <meshStandardMaterial color={index === 0 ? "#71eeb1" : "#586c77"} emissive={index === 0 ? "#18a878" : "#101d26"} emissiveIntensity={index === 0 ? 1.4 : 0.3} />
          </mesh>
        ))}
        <mesh position={[0, -0.69, 0.105]}>
          <boxGeometry args={[0.36, 0.15, 0.035]} />
          <meshStandardMaterial color="#3c4e58" metalness={0.74} roughness={0.36} />
        </mesh>
      </group>
      <mesh position={[2.35, 3.62, 0.48]}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial ref={redLight} color="#db5165" emissive="#b81635" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[2.35, 3.38, 0.48]}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial ref={accessLight} color="#64efae" emissive="#17c77d" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[2.35, 3.14, 0.48]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#7bbfff" emissive="#2676db" emissiveIntensity={1.8} />
      </mesh>
    </>
  );
}

function RoomArchitecture() {
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 5.85, 3.6, -0.36]}>
          <boxGeometry args={[5.7, 7.2, 0.34]} />
          <meshStandardMaterial color="#273640" metalness={0.42} roughness={0.56} />
        </mesh>
      ))}
      <mesh position={[-2.37, 2.65, -0.05]}>
        <boxGeometry args={[1.18, 5.3, 0.54]} />
        <meshStandardMaterial color="#4b5c67" metalness={0.48} roughness={0.4} />
      </mesh>
      <mesh position={[2.37, 2.65, -0.05]}>
        <boxGeometry args={[1.18, 5.3, 0.54]} />
        <meshStandardMaterial color="#4b5c67" metalness={0.48} roughness={0.4} />
      </mesh>
      <mesh position={[0, 6.05, -0.04]}>
        <boxGeometry args={[3.85, 1.38, 0.54]} />
        <meshStandardMaterial color="#4b5c67" metalness={0.48} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.87, 0.25]}>
        <boxGeometry args={[3.14, 0.42, 0.06]} />
        <meshStandardMaterial color="#101a22" metalness={0.62} roughness={0.42} emissive="#06131d" emissiveIntensity={0.4} />
      </mesh>
      {[-5.5, -4.2, -3, 3, 4.2, 5.5].map((x) => (
        <group key={x} position={[x, 3.5, -0.12]}>
          <mesh>
            <boxGeometry args={[0.82, 6.7, 0.5]} />
            <meshStandardMaterial color="#384852" metalness={0.42} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.27]}>
            <boxGeometry args={[0.7, 0.018, 0.025]} />
            <meshStandardMaterial color="#63727e" metalness={0.7} roughness={0.4} />
          </mesh>
          {[-1.7, 0, 1.7].map((y) => (
            <mesh key={y} position={[0, y, 0.29]}>
              <boxGeometry args={[0.7, 0.014, 0.025]} />
              <meshStandardMaterial color="#63727e" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -3]}>
        <planeGeometry args={[22, 26]} />
        <meshStandardMaterial color="#18212a" metalness={0.55} roughness={0.64} />
      </mesh>
      {[-4.8, 4.8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.025, -2]}>
          <planeGeometry args={[0.045, 22]} />
          <meshStandardMaterial color="#53a8df" emissive="#147dc2" emissiveIntensity={1.4} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7.2, -4]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#141c24" metalness={0.45} roughness={0.68} />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 6.78, -2.4]}>
          <boxGeometry args={[0.12, 0.045, 7]} />
          <meshStandardMaterial color="#72c7ff" emissive="#267dc6" emissiveIntensity={2.2} />
        </mesh>
      ))}
      {[-7.5, 7.5].map((x) => (
        <mesh key={x} position={[x, 3.6, -10]}>
          <boxGeometry args={[0.32, 7.2, 24]} />
          <meshStandardMaterial color="#1a242d" metalness={0.68} roughness={0.58} />
        </mesh>
      ))}
      {[-6.8, 6.8].map((x) => (
        <mesh key={x} position={[x, 1.4, -1.7]}>
          <boxGeometry args={[0.08, 2.8, 0.08]} />
          <meshStandardMaterial color="#6dddb0" emissive="#15966b" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </>
  );
}

function EntranceAnimation({
  entering,
  onComplete,
}: Pick<DataCenterSceneProps, "entering" | "onComplete">) {
  const { camera, invalidate, size } = useThree();
  const elapsed = useRef(0);
  const completed = useRef(false);
  const initialZ = useRef(size.width < 600 ? 14 : 11.5);
  const cameraTarget = useRef({ x: 0, y: 2.8, z: initialZ.current });

  useEffect(() => {
    initialZ.current = size.width < 600 ? 14 : 11.5;
    camera.position.z = initialZ.current;
    camera.lookAt(0, 2.35, 0);
  }, [camera, size.width]);

  useFrame((_, delta) => {
    if (!entering) return;
    elapsed.current += delta;
    const travel = MathUtils.smoothstep(elapsed.current, 2.15, 4.95);
    cameraTarget.current.z = MathUtils.lerp(
      initialZ.current,
      -1.8,
      travel,
    );
    cameraTarget.current.y = MathUtils.lerp(2.8, 2.4, travel);
    camera.position.x = MathUtils.damp(camera.position.x, cameraTarget.current.x, 2.8, delta);
    camera.position.y = MathUtils.damp(camera.position.y, cameraTarget.current.y, 2.8, delta);
    camera.position.z = MathUtils.damp(camera.position.z, cameraTarget.current.z, 2.8, delta);
    camera.lookAt(0, 2.35, cameraTarget.current.z - 4);
    if (!completed.current && elapsed.current >= 5.15) {
      completed.current = true;
      onComplete();
    }
    invalidate();
  });

  return null;
}

export function DataCenterScene({ entering, onEnter, onComplete }: DataCenterSceneProps) {
  const keyLight = useRef<PointLight>(null);
  const lightElapsed = useRef(0);

  useFrame((_, delta) => {
    if (!entering || !keyLight.current) return;
    lightElapsed.current += delta;
    const portalLight = MathUtils.smoothstep(lightElapsed.current, 2.1, 4.2);
    keyLight.current.intensity = MathUtils.damp(
      keyLight.current.intensity,
      MathUtils.lerp(0.2, 30, portalLight),
      2.4,
      delta,
    );
  });

  return (
    <>
      <color attach="background" args={["#080d13"]} />
      <fog attach="fog" args={["#080d13", 13, 34]} />
      <ambientLight intensity={0.62} color="#8da9c1" />
      <hemisphereLight intensity={0.78} color="#9fc9e8" groundColor="#101820" />
      <directionalLight position={[0, 7, 6]} intensity={2.2} color="#bad8f2" />
      <pointLight position={[-5, 4.5, 1]} intensity={5} distance={15} color="#1d87d3" />
      <pointLight ref={keyLight} position={[0, 3.4, -1.4]} intensity={0.2} distance={13} color="#a6efff" />
      <pointLight position={[5, 4, -3]} intensity={4} distance={14} color="#1268b0" />
      <RoomArchitecture />
      <Door entering={entering} onEnter={onEnter} />
      <EntranceAnimation entering={entering} onComplete={onComplete} />
    </>
  );
}
