import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, MeshStandardMaterial, PointLight } from "three";
import { CanvasTexture, Color, MathUtils, Vector3 } from "three";
import type { Room, RoomId } from "../../data/rooms";
import { rooms } from "../../data/rooms";

type DatacenterWorldProps = {
  mode: "identity" | "corridor" | "network";
  transition: boolean;
  selectedRoom: RoomId | null;
  activeNetworkNode: string;
  onSelectRoom: (room: Room) => void;
  onProximity: (room: Room | null) => void;
  onEnterRoom: (room: Room) => void;
  onCorridorReady: () => void;
};

const metalMaterials = {
  wall: new Color("#303f49"),
  trim: new Color("#697b86"),
};

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function nearestInteractiveRoom(position: Vector3) {
  return rooms
    .filter((room) => room.side !== 0)
    .map((room) => ({
      room,
      distance: Math.hypot(
        position.z - room.z,
        position.x - room.side * 3.2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function TerminalConsole() {
  return (
    <group position={[0, 1.08, -1.5]}>
      <mesh position={[0, -0.58, 0]}>
        <boxGeometry args={[3.35, 0.2, 1.02]} />
        <meshStandardMaterial color="#2a3842" metalness={0.75} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.06, -0.27]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[3.2, 0.95, 0.12]} />
        <meshStandardMaterial color="#354650" metalness={0.7} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.5, -0.12]}>
        <boxGeometry args={[3.15, 1.65, 0.22]} />
        <meshStandardMaterial color="#566976" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.5, 0.005]}>
        <boxGeometry args={[2.93, 1.42, 0.025]} />
        <meshStandardMaterial color="#071019" metalness={0.35} roughness={0.25} emissive="#08233a" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.028]}>
        <boxGeometry args={[2.79, 1.28, 0.008]} />
        <meshBasicMaterial color="#06141c" />
      </mesh>
      {[-1.36, 1.36].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.044]}>
          <boxGeometry args={[0.025, 1.17, 0.012]} />
          <meshBasicMaterial color={x < 0 ? "#57b8ff" : "#9bea70"} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0.035]}>
        <boxGeometry args={[2.82, 0.03, 0.02]} />
        <meshBasicMaterial color="#72baff" />
      </mesh>
      {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((x, index) => (
        <mesh key={x} position={[x, -0.61, 0.03]}>
          <boxGeometry args={[0.16, 0.012, 0.02]} />
          <meshBasicMaterial color={index === 3 ? "#b5f36d" : "#667987"} />
        </mesh>
      ))}
    </group>
  );
}

function ServerRack({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const lightRefs = useRef<(MeshStandardMaterial | null)[]>([]);
  const reducedMotion = useMemo(prefersReducedMotion, []);
  useFrame((state) => {
    if (reducedMotion) return;
    const pulse = 1.3 + Math.sin(state.clock.elapsedTime * 2.3 + variant) * 0.35;
    for (const material of lightRefs.current) {
      if (material) material.emissiveIntensity = pulse;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.88, 0]}>
        <boxGeometry args={[1.02, 3.75, 0.92]} />
        <meshStandardMaterial color="#34424c" metalness={0.76} roughness={0.34} />
      </mesh>
      <mesh position={[0, 1.88, 0.47]}>
        <boxGeometry args={[0.9, 3.59, 0.06]} />
        <meshStandardMaterial color="#111a22" metalness={0.52} roughness={0.45} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const y = 0.48 + index * 0.45;
        const materialIndex = variant * 7 + index;
        return (
          <group key={index}>
            <mesh position={[0, y, 0.52]}>
              <boxGeometry args={[0.78, 0.37, 0.04]} />
              <meshStandardMaterial color={index % 2 ? "#26343e" : "#1b2933"} metalness={0.42} roughness={0.39} />
            </mesh>
            {[-0.25, -0.15, 0.2, 0.28].map((x, lightIndex) => (
              <mesh key={x} position={[x, y, 0.548]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial
                  ref={(element) => {
                    if (lightIndex === 0) lightRefs.current[materialIndex] = element;
                  }}
                  color={lightIndex % 2 ? "#65b7ff" : "#9af071"}
                  emissive={lightIndex % 2 ? "#1484d7" : "#31bc6c"}
                  emissiveIntensity={1.3}
                />
              </mesh>
            ))}
            <mesh position={[0, y - 0.1, 0.55]}>
              <boxGeometry args={[0.27, 0.018, 0.012]} />
              <meshBasicMaterial color="#647784" />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 3.85, 0]}>
        <boxGeometry args={[1.1, 0.12, 1]} />
        <meshStandardMaterial color="#566875" metalness={0.83} roughness={0.28} />
      </mesh>
    </group>
  );
}

function CorridorEndBulkhead() {
  return (
    <group position={[0, 0, -23.72]}>
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[9.7, 7.4, 0.24]} />
        <meshStandardMaterial color="#273640" metalness={0.78} roughness={0.42} />
      </mesh>
      <mesh position={[0, 3.45, 0.14]}>
        <boxGeometry args={[4.15, 5.9, 0.12]} />
        <meshStandardMaterial color="#3a4b55" metalness={0.88} roughness={0.31} />
      </mesh>
      <mesh position={[0, 3.42, 0.22]}>
        <boxGeometry args={[3.7, 5.43, 0.06]} />
        <meshStandardMaterial color="#17232b" metalness={0.68} roughness={0.4} />
      </mesh>
      {[-1.52, -0.76, 0, 0.76, 1.52].map((x) => (
        <mesh key={x} position={[x, 3.42, 0.26]}>
          <boxGeometry args={[0.035, 5.18, 0.025]} />
          <meshStandardMaterial color="#647680" metalness={0.92} roughness={0.26} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 2.32, 3.7, 0.17]}>
          <boxGeometry args={[0.12, 6.7, 0.09]} />
          <meshStandardMaterial color="#61737e" metalness={0.88} roughness={0.29} />
        </mesh>
      ))}
      <mesh position={[0, 6.83, 0.2]}>
        <boxGeometry args={[4.85, 0.18, 0.1]} />
        <meshStandardMaterial color="#536671" metalness={0.84} roughness={0.3} />
      </mesh>
      <mesh position={[0, 6.83, 0.26]}>
        <boxGeometry args={[3.65, 0.035, 0.025]} />
        <meshStandardMaterial color="#77dfff" emissive="#168fbd" emissiveIntensity={2.2} />
      </mesh>
      {[-1.7, 1.7].map((x, index) => (
        <group key={x} position={[x, 0.78, 0.27]}>
          <mesh>
            <boxGeometry args={[0.32, 0.5, 0.06]} />
            <meshStandardMaterial color="#111c23" metalness={0.62} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.08, 0.24, 0.025]} />
            <meshStandardMaterial
              color={index === 0 ? "#73dfff" : "#a5ed77"}
              emissive={index === 0 ? "#168cbe" : "#229a57"}
              emissiveIntensity={1.7}
            />
          </mesh>
        </group>
      ))}
      {[-3.45, 3.45].map((x) => (
        <mesh key={x} position={[x, 3.7, 0.16]}>
          <boxGeometry args={[1.5, 7.05, 0.08]} />
          <meshStandardMaterial color="#202e37" metalness={0.72} roughness={0.46} />
        </mesh>
      ))}
      {[-2.8, -1.6, -0.4, 0.8, 2].map((y, index) => (
        <mesh key={y} position={[0, y, 0.18]}>
          <boxGeometry args={[9.55, 0.045, 0.06]} />
          <meshStandardMaterial
            color={index % 2 ? "#455963" : "#536771"}
            metalness={0.82}
            roughness={0.34}
          />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-3.1 + index * 0.88, 0.35, 0.2]}>
          <boxGeometry args={[0.42, 0.025, 0.035]} />
          <meshBasicMaterial color={index % 2 ? "#44728a" : "#52707d"} />
        </mesh>
      ))}
    </group>
  );
}

function CorridorArchitecture() {
  const floorLines = useMemo(() => Array.from({ length: 17 }, (_, i) => -20 + i * 1.5), []);
  const floorJoints = useMemo(() => Array.from({ length: 9 }, (_, i) => -22 + i * 3.75), []);
  const floorSheen = useMemo(() => Array.from({ length: 7 }, (_, i) => -18 + i * 4.2), []);

  return (
    <group>
      <mesh position={[0, 0, -7]}>
        <boxGeometry args={[9.7, 0.22, 34]} />
        <meshStandardMaterial color="#33434c" metalness={0.58} roughness={0.36} />
      </mesh>
      {floorSheen.map((z) => (
        <group key={z}>
          {[-3.45, 3.45].map((x) => (
            <mesh key={x} position={[x, 0.116, z]}>
              <boxGeometry args={[0.12, 0.004, 2.8]} />
              <meshBasicMaterial color="#1b5268" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
      {floorLines.map((z) => (
        <mesh key={z} position={[0, 0.115, z]}>
          <boxGeometry args={[9.45, 0.012, 0.025]} />
          <meshBasicMaterial color="#334653" />
        </mesh>
      ))}
      {floorJoints.map((z) => (
        <mesh key={z} position={[0, 0.117, z]}>
          <boxGeometry args={[9.45, 0.014, 0.035]} />
          <meshStandardMaterial color="#60737e" metalness={0.82} roughness={0.24} />
        </mesh>
      ))}
      {[-2.85, 2.85].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.123, -7]}>
            <boxGeometry args={[0.58, 0.018, 33]} />
            <meshStandardMaterial color="#19262e" metalness={0.76} roughness={0.42} />
          </mesh>
          {floorLines.map((z) => (
            <mesh key={z} position={[x, 0.135, z]}>
              <boxGeometry args={[0.48, 0.012, 0.08]} />
              <meshStandardMaterial color="#526671" metalness={0.84} roughness={0.28} />
            </mesh>
          ))}
        </group>
      ))}
      {[-4.55, 4.55].map((x) => (
        <mesh key={x} position={[x, 0.13, -7]}>
          <boxGeometry args={[0.07, 0.024, 33]} />
          <meshStandardMaterial color="#82d6ff" emissive="#259add" emissiveIntensity={2.1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 5, 3.8, -7]}>
            <boxGeometry args={[0.28, 7.6, 34]} />
            <meshStandardMaterial color={metalMaterials.wall} metalness={0.54} roughness={0.58} />
          </mesh>
          {[-21, -17, -13, -9, -5, -1, 3, 7].map((z) => (
            <group key={z} position={[side * 4.82, 3.8, z]}>
              <mesh>
                <boxGeometry args={[0.09, 7.25, 0.12]} />
                <meshStandardMaterial color={metalMaterials.trim} metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[-side * 0.09, 0, 0.15]}>
                <boxGeometry args={[0.018, 6.8, 0.025]} />
                <meshBasicMaterial color="#293b49" />
              </mesh>
            </group>
          ))}
          {[1.05, 3.78, 6.52].map((y) => (
            <mesh key={y} position={[side * 4.84, y, -7]}>
              <boxGeometry args={[0.045, 0.065, 33.6]} />
              <meshStandardMaterial color="#52636d" metalness={0.86} roughness={0.29} />
            </mesh>
          ))}
          {[-23, -19, -15, -7, -3, 5, 9].map((z) => (
            <mesh key={z} position={[side * 4.84, 3.8, z]}>
              <boxGeometry args={[0.05, 4.9, 0.045]} />
              <meshStandardMaterial color="#3b4b55" metalness={0.76} roughness={0.36} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 7.45, -7]}>
        <boxGeometry args={[10.2, 0.24, 34]} />
        <meshStandardMaterial color="#242f38" metalness={0.65} roughness={0.6} />
      </mesh>
      {[-3.55, -2.75, 2.75, 3.55].map((x, index) => (
        <group key={x} position={[x, 6.96, -7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 33, 10]} />
            <meshStandardMaterial color={index % 2 ? "#536771" : "#74858c"} metalness={0.87} roughness={0.28} />
          </mesh>
          <mesh position={[0.16, 0.22, 0]}>
            <boxGeometry args={[0.3, 0.24, 33]} />
            <meshStandardMaterial color="#293a44" metalness={0.76} roughness={0.36} />
          </mesh>
        </group>
      ))}
      {[-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3].map((x, index) => (
        <group key={x} position={[x, 7.1, -7]}>
          <mesh>
            <boxGeometry args={[0.08, 0.14, 33]} />
            <meshStandardMaterial color="#657783" metalness={0.7} roughness={0.4} />
          </mesh>
          {index % 2 === 0 && (
            <mesh position={[0.2, 0.03, 0]}>
              <boxGeometry args={[0.28, 0.13, 32]} />
              <meshStandardMaterial color="#364854" metalness={0.65} roughness={0.46} />
            </mesh>
          )}
        </group>
      ))}
      {[-16, -8, 0, 8].map((z) => (
        <group key={z} position={[0, 7.02, z]}>
          <mesh>
            <boxGeometry args={[9.7, 0.1, 0.08]} />
            <meshStandardMaterial color="#667a86" metalness={0.76} roughness={0.32} />
          </mesh>
          {[-3.6, 3.6].map((x) => (
            <mesh key={x} position={[x, -0.12, 0]}>
              <boxGeometry args={[0.9, 0.055, 0.26]} />
              <meshStandardMaterial color="#72c5ff" emissive="#2481c3" emissiveIntensity={1.8} />
            </mesh>
          ))}
        </group>
      ))}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 7.24, -7]}>
          <mesh>
            <boxGeometry args={[0.72, 0.045, 31]} />
            <meshStandardMaterial color="#101b22" metalness={0.58} roughness={0.4} />
          </mesh>
          {floorSheen.map((z) => (
            <mesh key={z} position={[0, 0.028, z + 7]}>
              <boxGeometry args={[0.52, 0.018, 1.3]} />
              <meshStandardMaterial color="#9bdcff" emissive="#288fc8" emissiveIntensity={1.25} />
            </mesh>
          ))}
        </group>
      ))}
      {rooms.filter((room) => room.side !== 0).flatMap((room, roomIndex) =>
        [-2.05, 2.05].map((offset, rackIndex) => (
          <group
            key={`${room.id}-${offset}`}
            position={[room.side * 4.12, 0, room.z + offset]}
            rotation={[0, room.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <ServerRack position={[0, 0, 0]} variant={roomIndex * 2 + rackIndex} />
            <mesh position={[0, 3.98, 0]}>
              <boxGeometry args={[1.12, 0.055, 0.98]} />
              <meshStandardMaterial color="#7ac8ff" emissive="#2882c2" emissiveIntensity={1.2} />
            </mesh>
          </group>
        )),
      )}
      {Array.from({ length: 16 }, (_, index) => {
        const z = -20 + index * 2;
        return [-4.88, 4.88].map((x, side) => (
          <mesh key={`${index}-${side}`} position={[x, 5.5, z]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#8fe6b9" emissive="#159965" emissiveIntensity={1.5} />
          </mesh>
        ));
      })}
      <CorridorEndBulkhead />
    </group>
  );
}

function DoorModule({
  room,
  selected,
  onSelect,
  onEnter,
}: {
  room: Room;
  selected: boolean;
  onSelect: (room: Room) => void;
  onEnter: (room: Room) => void;
}) {
  const panel = useRef<Group>(null);
  const indicator = useRef<MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const labelTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#0a151e";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#527181";
      context.lineWidth = 5;
      context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      context.fillStyle = "#70c8eb";
      context.font = "600 34px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${room.number} / DATACENTER ACCESS`, canvas.width / 2, 73);

      let fontSize = 92;
      context.font = `700 ${fontSize}px Arial, sans-serif`;
      while (context.measureText(room.label).width > canvas.width - 112 && fontSize > 48) {
        fontSize -= 2;
        context.font = `700 ${fontSize}px Arial, sans-serif`;
      }
      context.shadowColor = "#4abce8";
      context.shadowBlur = 16;
      context.fillStyle = "#f0f8fc";
      context.fillText(room.label, canvas.width / 2, 224, canvas.width - 112);
      context.shadowBlur = 0;
      context.fillStyle = "#54c9f0";
      context.fillRect(130, 304, canvas.width - 260, 7);
      context.fillStyle = "#a8bdc9";
      context.font = "500 24px monospace";
      context.fillText("SYSTEMS  /  NETWORK  /  INFRASTRUCTURE", canvas.width / 2, 352);
    }
    return new CanvasTexture(canvas);
  }, [room.label, room.number]);
  const active = selected || hovered;
  const side = room.side;
  const orientation = side === 0 ? -Math.PI / 2 : side < 0 ? 0 : Math.PI;
  const vertical = room.id === "contact" ? 2.65 : 2.72;

  useEffect(() => () => labelTexture.dispose(), [labelTexture]);

  useFrame((_, delta) => {
    if (indicator.current) {
      indicator.current.emissiveIntensity = reducedMotion
        ? active ? 3 : 0.85
        : MathUtils.damp(indicator.current.emissiveIntensity, active ? 3 : 0.85, 7, delta);
    }
    if (panel.current) {
      const target = selected && room.id === "network" ? -1.1 : 0;
      panel.current.rotation.y = reducedMotion
        ? target
        : MathUtils.damp(panel.current.rotation.y, target, 3, delta);
    }
  });

  return (
    <group position={[side * 4.72, 0, room.z]} rotation={[0, orientation, 0]}>
      <mesh position={[0, vertical, 0]}>
        <boxGeometry args={[0.18, 5.2, 3.65]} />
        <meshStandardMaterial color="#53636e" metalness={0.8} roughness={0.34} />
      </mesh>
      {[-1, 1].map((edge) => (
        <group key={edge}>
          <mesh position={[0.13, 2.72, edge * 1.79]}>
            <boxGeometry args={[0.34, 5.42, 0.24]} />
            <meshStandardMaterial color="#647782" metalness={0.92} roughness={0.25} />
          </mesh>
          <mesh position={[0.31, 2.72, edge * 1.79]}>
            <boxGeometry args={[0.025, 5.12, 0.035]} />
            <meshStandardMaterial
              color="#66d9ff"
              emissive="#128bbd"
              emissiveIntensity={active ? 2 : 0.9}
            />
          </mesh>
          {[0.52, 4.92].map((y) => (
            <mesh key={y} position={[0.34, y, edge * 1.79]}>
              <boxGeometry args={[0.035, 0.07, 0.09]} />
              <meshStandardMaterial color="#a9c0ca" metalness={0.94} roughness={0.22} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0.14, 5.43, 0]}>
        <boxGeometry args={[0.36, 0.3, 3.82]} />
        <meshStandardMaterial color="#52656f" metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0.34, 5.43, 0]}>
        <boxGeometry args={[0.025, 0.045, 3.34]} />
        <meshStandardMaterial color="#6edcff" emissive="#1594c5" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0.16, 0.12, 0]}>
        <boxGeometry args={[0.4, 0.18, 3.82]} />
        <meshStandardMaterial color="#354650" metalness={0.9} roughness={0.27} />
      </mesh>
      <group ref={panel} position={[0.12, 2.58, 0]}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onSelect(room);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
          }}
        >
          <boxGeometry args={[0.14, 4.65, 2.72]} />
          <meshStandardMaterial color={active ? "#405763" : "#2b3943"} metalness={0.74} roughness={0.38} />
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.035, 4.38, 2.47]} />
          <meshStandardMaterial color="#1d2a33" metalness={0.56} roughness={0.44} />
        </mesh>
        {[-1.15, 0, 1.15].map((z) => (
          <mesh key={z} position={[0.12, 0, z]}>
            <boxGeometry args={[0.04, 4.3, 0.022]} />
            <meshStandardMaterial color="#596a74" metalness={0.79} roughness={0.34} />
          </mesh>
        ))}
        {[-1.95, 1.95].map((y) => (
          <mesh key={y} position={[0.135, y, 0]}>
            <boxGeometry args={[0.055, 0.11, 2.54]} />
            <meshStandardMaterial color="#83949c" metalness={0.93} roughness={0.24} />
          </mesh>
        ))}
        {[-1.22, 1.22].map((z) => (
          <group key={z} position={[0.15, 0, z]}>
            <mesh>
              <boxGeometry args={[0.07, 4.22, 0.075]} />
              <meshStandardMaterial color="#344650" metalness={0.9} roughness={0.29} />
            </mesh>
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.018, 4.02, 0.018]} />
              <meshStandardMaterial color="#54c9f0" emissive="#127ea8" emissiveIntensity={0.85} />
            </mesh>
          </group>
        ))}
        {[-1.03, -0.8, -0.57, 0.57, 0.8, 1.03].map((z, index) => (
          <mesh key={z} position={[0.15, -1.58, z]}>
            <boxGeometry args={[0.065, 0.1, 0.14]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#82939b" : "#455963"}
              metalness={0.88}
              roughness={0.3}
            />
          </mesh>
        ))}
        {[-1, 1].flatMap((verticalEdge) =>
          [-1, 1].map((horizontalEdge) => (
            <mesh
              key={`${verticalEdge}-${horizontalEdge}`}
              position={[0.17, verticalEdge * 2.12, horizontalEdge * 1.12]}
            >
              <cylinderGeometry args={[0.045, 0.045, 0.035, 10]} />
              <meshStandardMaterial color="#bac8ce" metalness={0.96} roughness={0.2} />
            </mesh>
          )),
        )}
        <mesh position={[0.14, 0, 1.17]}>
          <boxGeometry args={[0.09, 0.82, 0.055]} />
          <meshStandardMaterial color="#8997a0" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[0.2, 0, 1.17]}>
          <boxGeometry args={[0.07, 0.34, 0.08]} />
          <meshStandardMaterial color="#bac7cc" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[0.145, 0, 0]}>
          <boxGeometry args={[0.055, 1.02, 2.52]} />
          <meshStandardMaterial color="#101c24" metalness={0.83} roughness={0.3} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.42, 0.82]} />
          <meshBasicMaterial map={labelTexture} toneMapped={false} />
        </mesh>
      </group>
      {[-1.48, 1.48].map((z) => (
        <mesh key={z} position={[0.24, 2.58, z]}>
          <boxGeometry args={[0.065, 4.92, 0.07]} />
          <meshBasicMaterial color={active ? "#b5f36d" : "#55b9ff"} toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[0.24, 2.58 + edge * 2.49, 0]}>
          <boxGeometry args={[0.065, 0.07, 3.02]} />
          <meshBasicMaterial color={active ? "#b5f36d" : "#55b9ff"} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.2, 4.95, 0]}>
        <boxGeometry args={[0.035, 0.025, 2.78]} />
        <meshBasicMaterial color={active ? "#b5f36d" : "#77c7ff"} />
      </mesh>
      <mesh position={[0.23, 5.02, 0.78]}>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial ref={indicator} color="#9af071" emissive="#20b96e" emissiveIntensity={0.85} />
      </mesh>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onEnter(room);
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        position={[0.05, 2.65, 0]}
      >
        <boxGeometry args={[0.35, 6.35, 3.9]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlayerController({
  mode,
  transition,
  onProximity,
  onEnterRoom,
  onCorridorReady,
}: Pick<DatacenterWorldProps, "mode" | "transition" | "onProximity" | "onEnterRoom" | "onCorridorReady">) {
  const { camera, gl, invalidate } = useThree();
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const transitionTime = useRef(0);
  const completed = useRef(false);
  const currentPosition = useRef(new Vector3(0, 2.3, 8));
  const previousMode = useRef(mode);
  const travelStart = useRef(new Vector3());
  const travelElapsed = useRef(0);
  const travelingRoom = useRef(false);
  const leavingNetwork = useRef(false);
  const reducedMotion = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    camera.position.copy(currentPosition.current);
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const key = event.key.toLowerCase();
      if (key === "e" && mode === "corridor" && !target?.closest("input, textarea, select")) {
        event.preventDefault();
        const nearest = nearestInteractiveRoom(currentPosition.current);
        if (nearest && nearest.distance < 2.4) onEnterRoom(nearest.room);
        return;
      }
      if (target?.closest("button, a, input, textarea, select")) return;
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase());
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button, a")) return;
      dragging.current = true;
    };
    const pointerUp = () => {
      dragging.current = false;
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging.current || mode === "identity" || transition) return;
      yaw.current -= event.movementX * 0.0022;
      pitch.current = MathUtils.clamp(pitch.current - event.movementY * 0.0017, -0.42, 0.42);
    };
    const touchMove = (event: Event) => {
      keys.current.clear();
      const direction = (event as CustomEvent<string | null>).detail;
      if (direction) keys.current.add(direction);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    gl.domElement.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("universe-move", touchMove);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      gl.domElement.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("universe-move", touchMove);
      document.body.style.cursor = "";
    };
  }, [camera, gl, mode, onEnterRoom, transition]);

  useEffect(() => {
    if (previousMode.current === mode) return;
    const previous = previousMode.current;
    if (mode === "network" || previous === "network") {
      yaw.current = 0;
      pitch.current = 0;
    }
    leavingNetwork.current = previous === "network" && mode !== "network";
    travelStart.current.copy(currentPosition.current);
    travelElapsed.current = 0;
    if (reducedMotion) {
      if (mode === "network") currentPosition.current.set(12, 2.3, 5);
      else if (mode === "identity") currentPosition.current.set(0, 2.3, 8);
      else if (previous === "network") currentPosition.current.set(0, 2.3, 2.5);
      travelingRoom.current = false;
    } else {
      travelingRoom.current = mode === "network" || previous === "network" || mode === "identity";
    }
    previousMode.current = mode;
  }, [mode, reducedMotion]);

  useEffect(() => {
    if (!transition) {
      transitionTime.current = 0;
      completed.current = false;
      return;
    }
    transitionTime.current = 0;
  }, [transition]);

  useFrame((_, delta) => {
    const forward = new Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new Vector3(-forward.z, 0, forward.x);

    if (transition) {
      transitionTime.current += delta;
      const progress = MathUtils.smoothstep(transitionTime.current, 0, 3.7);
      const from = new Vector3(0, 2.3, 8);
      const to = new Vector3(0, 2.2, 2.5);
      currentPosition.current.lerpVectors(from, to, progress);
      if (!completed.current && transitionTime.current > 3.75) {
        completed.current = true;
        onCorridorReady();
      }
    } else if (travelingRoom.current) {
      travelElapsed.current += delta;
      if (mode === "network") {
        const doorway = new Vector3(5.7, 2.3, 5);
        const destination = new Vector3(12, 2.3, 5);
        if (travelElapsed.current < 1.15) {
          const progress = MathUtils.smoothstep(travelElapsed.current, 0, 1.15);
          currentPosition.current.lerpVectors(travelStart.current, doorway, progress);
        } else {
          const progress = MathUtils.smoothstep(travelElapsed.current, 1.15, 1.8);
          currentPosition.current.lerpVectors(doorway, destination, progress);
        }
      } else if (leavingNetwork.current) {
        const doorway = new Vector3(5.7, 2.3, 5);
        const destination = mode === "identity"
          ? new Vector3(0, 2.3, 8)
          : new Vector3(0, 2.3, 2.5);
        if (travelElapsed.current < 0.65) {
          const progress = MathUtils.smoothstep(travelElapsed.current, 0, 0.65);
          currentPosition.current.lerpVectors(travelStart.current, doorway, progress);
        } else {
          const progress = MathUtils.smoothstep(travelElapsed.current, 0.65, 1.8);
          currentPosition.current.lerpVectors(doorway, destination, progress);
        }
      } else {
        const progress = MathUtils.smoothstep(travelElapsed.current, 0, 1.8);
        const destination = mode === "identity"
          ? new Vector3(0, 2.3, 8)
          : new Vector3(0, 2.3, 2.5);
        currentPosition.current.lerpVectors(travelStart.current, destination, progress);
      }
      if (travelElapsed.current >= 1.85) travelingRoom.current = false;
    } else if (mode === "corridor") {
      const speed = 3.2 * delta;
      if (keys.current.has("w") || keys.current.has("arrowup")) currentPosition.current.addScaledVector(forward, speed);
      if (keys.current.has("s") || keys.current.has("arrowdown")) currentPosition.current.addScaledVector(forward, -speed);
      if (keys.current.has("d")) currentPosition.current.addScaledVector(right, speed);
      if (keys.current.has("a")) currentPosition.current.addScaledVector(right, -speed);
      currentPosition.current.x = MathUtils.clamp(currentPosition.current.x, -3.45, 3.45);
      currentPosition.current.z = MathUtils.clamp(currentPosition.current.z, -20.5, 7.5);
      const nearest = nearestInteractiveRoom(currentPosition.current);
      onProximity(nearest && nearest.distance < 2.4 ? nearest.room : null);
      if (dragging.current && keys.current.size) invalidate();
    }

    camera.position.copy(currentPosition.current);
    const lookDirection = new Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      -Math.cos(yaw.current) * Math.cos(pitch.current),
    );
    camera.lookAt(currentPosition.current.clone().add(lookDirection));
  });

  return null;
}

const networkMonitorLabels = [
  "PASSERELLE",
  "CŒUR L3",
  "VLAN 10",
  "VLAN 20",
  "VLAN 30",
];

function NetworkMonitor({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 680;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#07121a";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#132b38";
      context.fillRect(0, 0, canvas.width, 46);
      context.fillStyle = "#9fdcf5";
      context.font = "600 25px monospace";
      context.fillText(networkMonitorLabels[index], 22, 31);
      context.fillStyle = "#91a9b8";
      context.font = "18px monospace";
      context.fillText("LAB / TOPOLOGIE DE DÉMO", 22, 82);
      context.strokeStyle = "#15303c";
      context.lineWidth = 1;
      for (let y = 112; y < canvas.height; y += 38) {
        context.beginPath();
        context.moveTo(20, y);
        context.lineTo(492, y);
        context.stroke();
      }
      context.fillStyle = active ? "#a5ed77" : "#54bfff";
      for (let row = 0; row < 7; row += 1) {
        context.fillRect(25, 133 + row * 65, 12, 12);
        context.fillRect(49, 138 + row * 65, 200 + (row % 3) * 56, 5);
      }
      context.strokeStyle = active ? "#a5ed77" : "#54bfff";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(28, 615);
      context.lineTo(120, 566);
      context.lineTo(196, 585);
      context.lineTo(274, 505);
      context.lineTo(352, 536);
      context.lineTo(480, 472);
      context.stroke();
    }
    return new CanvasTexture(canvas);
  }, [active, index]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group>
      <mesh>
        <boxGeometry args={[1.72, 2.5, 0.06]} />
        <meshStandardMaterial color="#10232d" emissive={active ? "#0873a4" : "#07506a"} emissiveIntensity={active ? 0.7 : 0.38} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.54, 2.26]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {[-0.48, -0.16, 0.16, 0.48].map((offset, row) => (
        <mesh key={offset} position={[offset, -0.98, 0.05]}>
          <boxGeometry args={[0.05, 0.018, 0.02]} />
          <meshBasicMaterial color={row === 1 ? "#a4ed74" : "#54bfff"} />
        </mesh>
      ))}
    </group>
  );
}

function NetworkRoom({ activeNetworkNode }: { activeNetworkNode: string }) {
  return (
    <group position={[14, 0, 5]}>
      <mesh position={[0, -0.16, -2.2]}>
        <boxGeometry args={[17.5, 0.16, 8.5]} />
        <meshStandardMaterial color="#111b23" metalness={0.78} roughness={0.28} />
      </mesh>
      {[-7.9, 7.9].map((x, index) => (
        <ServerRack key={x} position={[x, 0, 0.2]} variant={index + 8} />
      ))}
      <mesh position={[0, 3.8, -3]}>
        <boxGeometry args={[18, 7.6, 0.25]} />
        <meshStandardMaterial color="#18242d" metalness={0.66} roughness={0.52} />
      </mesh>
      <mesh position={[0, 3.3, -2.82]}>
        <boxGeometry args={[12, 3.6, 0.08]} />
        <meshStandardMaterial color="#08151e" emissive="#08314a" emissiveIntensity={0.8} metalness={0.3} roughness={0.28} />
      </mesh>
      {[-4.2, -2.1, 0, 2.1, 4.2].map((x, index) => (
        <group key={x} position={[x - 3.2, 3.2, -2.72]}>
          <NetworkMonitor
            active={activeNetworkNode === ["edge-router", "core-switch", "vlan-admin", "vlan-servers", "vlan-users"][index]}
            index={index}
          />
        </group>
      ))}
      <mesh position={[0, 1.08, -1.15]}>
        <boxGeometry args={[5.8, 0.18, 1.3]} />
        <meshStandardMaterial color="#40515c" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.55, -1.4]}>
          <boxGeometry args={[1.6, 0.84, 0.1]} />
          <meshStandardMaterial color="#182a35" emissive="#063451" emissiveIntensity={0.7} />
        </mesh>
      ))}
      <pointLight position={[-2, 5.8, -2]} color="#2c9ad5" intensity={5} distance={14} />
      <pointLight position={[2, 5.2, -2]} color="#7ba8c5" intensity={3} distance={11} />
    </group>
  );
}

export function DatacenterWorld(props: DatacenterWorldProps) {
  const { mode, transition, selectedRoom, onSelectRoom, onProximity, onEnterRoom, onCorridorReady } = props;
  const corridorLights = useRef<PointLight[]>([]);
  const transitionElapsed = useRef(0);
  const hasArrived = useRef(false);

  useEffect(() => {
    if (!transition) {
      transitionElapsed.current = 0;
      hasArrived.current = false;
      return;
    }
    transitionElapsed.current = 0;
  }, [transition]);

  useFrame((_, delta) => {
    if (!transition) return;
    transitionElapsed.current += delta;
    for (const [index, light] of corridorLights.current.entries()) {
      light.intensity = MathUtils.damp(
        light.intensity,
        transitionElapsed.current > index * 0.18 + 0.2 ? 6 : 0.08,
        2.6,
        delta,
      );
    }
    if (!hasArrived.current && transitionElapsed.current > 3.8) {
      hasArrived.current = true;
    }
  });

  return (
    <>
      <color attach="background" args={["#080d13"]} />
      <fog attach="fog" args={["#101923", 20, 48]} />
      <ambientLight intensity={mode === "identity" ? 0.42 : 2} color="#c1daec" />
      <hemisphereLight intensity={mode === "identity" ? 0.48 : 1.5} color="#d0e9fc" groundColor="#46545e" />
      <directionalLight position={[0, 9, 6]} intensity={mode === "identity" ? 1.2 : 3.2} color="#d8edff" />
      <CorridorArchitecture />
      {mode === "identity" && <TerminalConsole />}
      {rooms.map((room) => (
        <DoorModule
          key={room.id}
          onEnter={onEnterRoom}
          onSelect={onSelectRoom}
          room={room}
          selected={selectedRoom === room.id}
        />
      ))}
      <NetworkRoom activeNetworkNode={props.activeNetworkNode} />
      {Array.from({ length: 7 }, (_, index) => (
        <pointLight
          key={index}
          ref={(light) => {
            if (light) corridorLights.current[index] = light;
          }}
          position={[index % 2 === 0 ? -3 : 3, 5.8, 5 - index * 5]}
          color={index % 2 ? "#4aabff" : "#71e9af"}
          intensity={mode === "identity" ? 0.08 : 6}
          distance={16}
        />
      ))}
      <PlayerController
        mode={mode}
        onCorridorReady={onCorridorReady}
        onEnterRoom={onEnterRoom}
        onProximity={onProximity}
        transition={transition}
      />
    </>
  );
}
