import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, InstancedMesh, PointLight } from "three";
import { BoxGeometry, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, MathUtils, MeshStandardMaterial, Object3D, PointsMaterial, SphereGeometry, Vector3 } from "three";
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
  wall: new Color("#382820"),
  trim: new Color("#C3C7D0"),
};

type RackDeviceKind = "compute" | "network" | "storage";

type RackDeviceSpec = {
  kind: RackDeviceKind;
  height: number;
};

type RackDetail = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};

type RackDetailSet = {
  boxes: RackDetail[];
  indicators: RackDetail[];
};

const rackConfigurations: RackDeviceSpec[][] = [
  [
    { kind: "compute", height: 0.52 },
    { kind: "compute", height: 0.44 },
    { kind: "compute", height: 0.6 },
    { kind: "compute", height: 0.44 },
    { kind: "compute", height: 0.6 },
    { kind: "compute", height: 0.52 },
  ],
  [
    { kind: "network", height: 0.44 },
    { kind: "network", height: 0.44 },
    { kind: "network", height: 0.44 },
    { kind: "network", height: 0.44 },
    { kind: "network", height: 0.44 },
    { kind: "network", height: 0.44 },
  ],
  [
    { kind: "storage", height: 0.62 },
    { kind: "storage", height: 0.62 },
    { kind: "storage", height: 0.62 },
    { kind: "storage", height: 0.62 },
    { kind: "storage", height: 0.62 },
  ],
  [
    { kind: "compute", height: 0.58 },
    { kind: "network", height: 0.44 },
    { kind: "storage", height: 0.62 },
    { kind: "compute", height: 0.44 },
    { kind: "network", height: 0.44 },
    { kind: "storage", height: 0.62 },
  ],
];
const rackConfigurationOrder = [0, 1, 2, 3, 0, 2, 3, 1, 2, 3] as const;

const rackFrameMaterial = new MeshStandardMaterial({ color: "#C3C7D0", metalness: 0.88, roughness: 0.28 });
const rackBronzeMaterial = new MeshStandardMaterial({ color: "#8C674B", metalness: 0.82, roughness: 0.34 });
const rackInteriorMaterial = new MeshStandardMaterial({ color: "#17131F", metalness: 0.42, roughness: 0.62 });
const rackDeviceMetalMaterial = new MeshStandardMaterial({ color: "#E3E5EB", metalness: 0.82, roughness: 0.3 });
const rackDeviceBronzeMaterial = new MeshStandardMaterial({ color: "#8C674B", metalness: 0.76, roughness: 0.36 });
const rackDeviceFaceMaterial = new MeshStandardMaterial({ color: "#382820", metalness: 0.58, roughness: 0.48 });
const rackDetailGeometry = new BoxGeometry(1, 1, 1);
const rackDetailColors = ["#C3C7D0", "#8C674B", "#17131F", "#382820", "#E3E5EB"] as const;
const rackDetailMaterials: Record<(typeof rackDetailColors)[number], MeshStandardMaterial> = {
  "#C3C7D0": new MeshStandardMaterial({ color: "#C3C7D0", metalness: 0.66, roughness: 0.46 }),
  "#8C674B": new MeshStandardMaterial({ color: "#8C674B", metalness: 0.66, roughness: 0.46 }),
  "#17131F": new MeshStandardMaterial({ color: "#17131F", metalness: 0.28, roughness: 0.76 }),
  "#382820": new MeshStandardMaterial({ color: "#382820", metalness: 0.54, roughness: 0.54 }),
  "#E3E5EB": new MeshStandardMaterial({ color: "#E3E5EB", metalness: 0.78, roughness: 0.3 }),
};
const rackIndicatorGeometry = new SphereGeometry(1, 8, 8);
const rackIndicatorMaterial = new MeshStandardMaterial({
  color: "#D8CBF5",
  emissive: "#B7A0E8",
  emissiveIntensity: 0.62,
});
const cableTrayRungCount = 48;
const cableTrayRungGeometry = new BoxGeometry(0.58, 0.026, 0.045);
const cableTrayRungMaterial = new MeshStandardMaterial({ color: "#C3C7D0", metalness: 0.86, roughness: 0.3 });
const floorPanelCount = 14;
const floorPanelGeometry = new BoxGeometry(0.52, 0.025, 1.8);
const floorPanelMaterial = new MeshStandardMaterial({ color: "#C3C7D0", metalness: 0.78, roughness: 0.32 });

function createRackDetailSet(configuration: RackDeviceSpec[], variant: number): RackDetailSet {
  const boxes: RackDetail[] = [];
  const indicators: RackDetail[] = [];
  const totalHeight = configuration.reduce((total, device) => total + device.height, 0);
  let deviceY = (3.5 - totalHeight) / 2;
  const handleColor = variant % 2 === 0 ? "#C3C7D0" : "#8C674B";

  const addBox = (position: RackDetail["position"], size: RackDetail["size"], color: string) => {
    boxes.push({ position, size, color });
  };
  const addIndicator = (position: RackDetail["position"], radius: number) => {
    indicators.push({
      position,
      size: [radius, radius, radius],
      color: "#D8CBF5",
    });
  };

  for (const device of configuration) {
    const centerY = deviceY + device.height / 2;
    deviceY += device.height;

    for (const x of [-0.31, 0.31]) {
      addBox([x, centerY, 0.463], [0.028, Math.min(0.16, device.height * 0.48), 0.018], handleColor);
    }
    for (const x of [-0.34, 0.34]) {
      addBox([x, centerY + device.height * 0.37, 0.476], [0.026, 0.026, 0.012], "#8C674B");
    }

    if (device.kind === "compute") {
      addBox([-0.16, centerY, 0.466], [0.22, device.height * 0.58, 0.012], "#17131F");
      addBox([0.08, centerY, 0.466], [0.22, device.height * 0.58, 0.012], "#17131F");
      for (let vent = 0; vent < 6; vent += 1) {
        addBox(
          [-0.22 + (vent % 3) * 0.06, centerY + ((Math.floor(vent / 3) - 0.5) * device.height) / 3, 0.474],
          [0.025, 0.018, 0.008],
          "#C3C7D0",
        );
      }
      for (let vent = 0; vent < 5; vent += 1) {
        addBox(
          [0.02 + (vent % 2) * 0.06, centerY + ((vent - 2) * device.height) / 7, 0.474],
          [0.026, 0.018, 0.008],
          "#C3C7D0",
        );
      }
      addIndicator([0.25, centerY + device.height * 0.28, 0.482], 0.013);
    }

    if (device.kind === "network") {
      for (let port = 0; port < 12; port += 1) {
        const x = -0.275 + (port % 6) * 0.11;
        const y = centerY + (port < 6 ? 0.075 : -0.075);
        addBox([x, y, 0.466], [0.076, 0.085, 0.014], "#C3C7D0");
        addBox([x, y, 0.476], [0.048, 0.054, 0.008], "#17131F");
        addBox([x, y + 0.015, 0.482], [0.026, 0.018, 0.006], "#382820");
      }
      for (const x of [-0.29, -0.23, 0.23, 0.29]) {
        addIndicator([x, centerY - device.height * 0.34, 0.474], 0.014);
      }
    }

    if (device.kind === "storage") {
      for (let bay = 0; bay < 4; bay += 1) {
        const x = -0.27 + bay * 0.18;
        addBox([x, centerY, 0.466], [0.16, device.height - 0.15, 0.016], "#C3C7D0");
        addBox([x, centerY, 0.477], [0.125, device.height - 0.2, 0.008], "#382820");
        addBox([x, centerY - device.height * 0.22, 0.485], [0.085, 0.025, 0.008], "#E3E5EB");
        addIndicator([x + 0.045, centerY + device.height * 0.29, 0.485], 0.012);
      }
    }

  }

  for (const x of [-0.38, 0.38]) {
    for (let slot = 0; slot < 18; slot += 1) {
      addBox([x, 0.38 + slot * 0.17, 0.376], [0.012, 0.045, 0.008], "#17131F");
    }
  }

  for (const x of [-0.38, 0.38]) {
    for (const y of [0.28, 3.48]) {
      for (const z of [-0.27, 0.27]) {
        addBox([x, y, z], [0.025, 0.025, 0.018], "#C3C7D0");
      }
    }
  }

  return { boxes, indicators };
}

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
        <meshStandardMaterial color="#8C674B" metalness={0.75} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.06, -0.27]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[3.2, 0.95, 0.12]} />
        <meshStandardMaterial color="#C3C7D0" metalness={0.7} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.5, -0.12]}>
        <boxGeometry args={[3.15, 1.65, 0.22]} />
        <meshStandardMaterial color="#E3E5EB" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.5, 0.005]}>
        <boxGeometry args={[2.93, 1.42, 0.025]} />
        <meshStandardMaterial color="#17131F" metalness={0.35} roughness={0.25} emissive="#382820" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.028]}>
        <boxGeometry args={[2.79, 1.28, 0.008]} />
        <meshBasicMaterial color="#17131F" />
      </mesh>
      {[-1.36, 1.36].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.044]}>
          <boxGeometry args={[0.025, 1.17, 0.012]} />
          <meshBasicMaterial color="#D8CBF5" />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0.035]}>
        <boxGeometry args={[2.82, 0.03, 0.02]} />
        <meshBasicMaterial color="#B7A0E8" />
      </mesh>
      {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((x, index) => (
        <mesh key={x} position={[x, -0.61, 0.03]}>
          <boxGeometry args={[0.16, 0.012, 0.02]} />
          <meshBasicMaterial color={index === 3 ? "#D8CBF5" : "#C3C7D0"} />
        </mesh>
      ))}
    </group>
  );
}

function RackDevice({ kind, height, index, variant }: RackDeviceSpec & { index: number; variant: number }) {
  const shellMaterial = (index + variant) % 3 === 0 ? rackDeviceBronzeMaterial : rackDeviceMetalMaterial;

  return (
    <group>
      <mesh position={[0, 0, 0.315]}>
        <boxGeometry args={[0.78, height - 0.035, 0.25]} />
        <primitive object={shellMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.449]}>
        <boxGeometry args={[0.72, height - 0.09, 0.018]} />
        <primitive object={kind === "network" ? rackInteriorMaterial : rackDeviceFaceMaterial} attach="material" />
      </mesh>
    </group>
  );
}

function InstancedRackBoxGroup({ details, color }: { details: RackDetail[]; color: keyof typeof rackDetailMaterials }) {
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const transform = new Object3D();
    for (const [index, detail] of details.entries()) {
      transform.position.set(...detail.position);
      transform.scale.set(...detail.size);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [details]);

  return (
    <instancedMesh
      args={[rackDetailGeometry, rackDetailMaterials[color], details.length]}
      dispose={null}
      ref={meshRef}
    />
  );
}

function RackEquipmentDetails({
  configuration,
  variant,
}: {
  configuration: RackDeviceSpec[];
  variant: number;
}) {
  const indicators = useRef<InstancedMesh>(null);
  const details = useMemo(() => createRackDetailSet(configuration, variant), [configuration, variant]);
  const boxGroups = useMemo(
    () => rackDetailColors
      .map((color) => ({
        color,
        details: details.boxes.filter((detail) => detail.color === color),
      }))
      .filter((group) => group.details.length > 0),
    [details],
  );

  useEffect(() => {
    const indicatorMesh = indicators.current;
    const transform = new Object3D();

    for (const [index, detail] of details.indicators.entries()) {
      if (!indicatorMesh) break;
      transform.position.set(...detail.position);
      transform.scale.set(...detail.size);
      transform.updateMatrix();
      indicatorMesh.setMatrixAt(index, transform.matrix);
    }
    if (indicatorMesh) {
      indicatorMesh.instanceMatrix.needsUpdate = true;
      indicatorMesh.computeBoundingSphere();
    }
  }, [details]);

  return (
    <group name="rack-details">
      {boxGroups.map((group) => (
        <InstancedRackBoxGroup key={group.color} {...group} />
      ))}
      <instancedMesh
        args={[rackIndicatorGeometry, rackIndicatorMaterial, details.indicators.length]}
        dispose={null}
        ref={indicators}
      />
    </group>
  );
}

function ServerRack({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const configurationIndex = rackConfigurationOrder[variant % rackConfigurationOrder.length];
  const configuration = rackConfigurations[configurationIndex];
  const deviceHeight = configuration.reduce((total, device) => total + device.height, 0);
  let deviceY = (3.5 - deviceHeight) / 2;

  return (
    <group position={position}>
      <group name="rack-structure">
        <mesh position={[0, 1.88, 0]}>
          <boxGeometry args={[0.84, 3.52, 0.76]} />
          <primitive object={rackInteriorMaterial} attach="material" />
        </mesh>
        {[-0.47, 0.47].flatMap((x) =>
          [-0.42, 0.42].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 1.88, z]}>
              <boxGeometry args={[0.075, 3.76, 0.075]} />
              <primitive object={z > 0 ? rackFrameMaterial : rackBronzeMaterial} attach="material" />
            </mesh>
          )),
        )}
        {[0.08, 3.68].flatMap((y) =>
          [-0.42, 0.42].map((z) => (
            <mesh key={`${y}-${z}`} position={[0, y, z]}>
              <boxGeometry args={[0.99, 0.09, 0.08]} />
              <primitive object={rackFrameMaterial} attach="material" />
            </mesh>
          )),
        )}
        {[-0.47, 0.47].flatMap((x) =>
          [0.08, 3.68].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0]}>
              <boxGeometry args={[0.075, 0.09, 0.76]} />
              <primitive object={rackBronzeMaterial} attach="material" />
            </mesh>
          )),
        )}
        {[-0.38, 0.38].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.88, 0.355]}>
              <boxGeometry args={[0.035, 3.24, 0.035]} />
              <primitive object={rackBronzeMaterial} attach="material" />
            </mesh>
          </group>
        ))}
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, 1.88, -0.414]}>
            <boxGeometry args={[0.035, 3.28, 0.035]} />
            <primitive object={rackFrameMaterial} attach="material" />
          </mesh>
        ))}
        {[-0.44, 0.44].map((x) => (
          <mesh key={x} position={[x, 1.88, 0]}>
            <boxGeometry args={[0.025, 2.95, 0.58]} />
            <primitive object={rackInteriorMaterial} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 1.88, -0.43]}>
          <boxGeometry args={[0.82, 3.3, 0.025]} />
          <primitive object={rackInteriorMaterial} attach="material" />
        </mesh>
      </group>
      <group name="rack-equipment">
        {configuration.map((device, index) => {
          const centerY = deviceY + device.height / 2;
          deviceY += device.height;
          return (
            <group key={`${device.kind}-${index}`} position={[0, centerY, 0]}>
              <RackDevice {...device} index={index} variant={variant} />
            </group>
          );
        })}
      </group>
      <RackEquipmentDetails configuration={configuration} variant={variant} />
      <group name="rack-mechanical-details">
        {[-0.47, 0.47].map((x) => (
          <group key={x}>
            {[-0.42, 0.42].map((z) => (
              <mesh key={z} position={[x, 0.09, z]}>
                <boxGeometry args={[0.14, 0.18, 0.14]} />
                <primitive object={rackBronzeMaterial} attach="material" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <mesh position={[0, 3.85, 0]}>
        <boxGeometry args={[1.02, 0.12, 0.96]} />
        <primitive object={rackDeviceMetalMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 3.916, 0.04]}>
        <boxGeometry args={[0.48, 0.012, 0.65]} />
        <primitive object={rackInteriorMaterial} attach="material" />
      </mesh>
      <mesh position={[0.37, 3.916, 0.04]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <primitive object={rackIndicatorMaterial} attach="material" />
      </mesh>
    </group>
  );
}

function RackInstallation({
  position,
  rotation,
  variant,
}: {
  position: [number, number, number];
  rotation: number;
  variant: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <ServerRack position={[0, 0, 0]} variant={variant} />
      <mesh position={[0, 3.98, 0]}>
        <boxGeometry args={[1.12, 0.055, 0.98]} />
        <meshStandardMaterial color="#C3C7D0" metalness={0.84} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CorridorEndBulkhead() {
  return (
    <group position={[0, 0, -23.72]}>
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[9.7, 7.4, 0.24]} />
        <meshStandardMaterial color="#17131F" metalness={0.78} roughness={0.42} />
      </mesh>
      <mesh position={[0, 3.45, 0.14]}>
        <boxGeometry args={[4.15, 5.9, 0.12]} />
        <meshStandardMaterial color="#C3C7D0" metalness={0.88} roughness={0.31} />
      </mesh>
      <mesh position={[0, 3.42, 0.22]}>
        <boxGeometry args={[3.7, 5.43, 0.06]} />
        <meshStandardMaterial color="#382820" metalness={0.68} roughness={0.4} />
      </mesh>
      {[-1.52, -0.76, 0, 0.76, 1.52].map((x) => (
        <mesh key={x} position={[x, 3.42, 0.26]}>
          <boxGeometry args={[0.035, 5.18, 0.025]} />
          <meshStandardMaterial color="#8C674B" metalness={0.92} roughness={0.26} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 2.32, 3.7, 0.17]}>
          <boxGeometry args={[0.12, 6.7, 0.09]} />
          <meshStandardMaterial color="#C3C7D0" metalness={0.88} roughness={0.29} />
        </mesh>
      ))}
      <mesh position={[0, 6.83, 0.2]}>
        <boxGeometry args={[4.85, 0.18, 0.1]} />
        <meshStandardMaterial color="#C3C7D0" metalness={0.84} roughness={0.3} />
      </mesh>
      <mesh position={[0, 6.83, 0.26]}>
        <boxGeometry args={[3.65, 0.035, 0.025]} />
        <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={1.4} />
      </mesh>
      {[-1.7, 1.7].map((x) => (
        <group key={x} position={[x, 0.78, 0.27]}>
          <mesh>
            <boxGeometry args={[0.32, 0.5, 0.06]} />
            <meshStandardMaterial color="#17131F" metalness={0.62} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.08, 0.24, 0.025]} />
            <meshStandardMaterial
              color="#D8CBF5"
              emissive="#B7A0E8"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>
      ))}
      {[-3.45, 3.45].map((x) => (
        <mesh key={x} position={[x, 3.7, 0.16]}>
          <boxGeometry args={[1.5, 7.05, 0.08]} />
          <meshStandardMaterial color="#382820" metalness={0.72} roughness={0.46} />
        </mesh>
      ))}
      {[-2.8, -1.6, -0.4, 0.8, 2].map((y, index) => (
        <mesh key={y} position={[0, y, 0.18]}>
          <boxGeometry args={[9.55, 0.045, 0.06]} />
          <meshStandardMaterial
            color={index % 2 ? "#8C674B" : "#C3C7D0"}
            metalness={0.82}
            roughness={0.34}
          />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-3.1 + index * 0.88, 0.35, 0.2]}>
          <boxGeometry args={[0.42, 0.025, 0.035]} />
          <meshBasicMaterial color={index % 2 ? "#D8CBF5" : "#8C674B"} />
        </mesh>
      ))}
    </group>
  );
}

function WallTechnicalCabinet({ side, z }: { side: -1 | 1; z: number }) {
  const faceX = -side * 0.135;

  return (
    <group position={[side * 4.78, 3.8, z]}>
      <mesh>
        <boxGeometry args={[0.22, 1.65, 1.05]} />
        <meshStandardMaterial color="#8C674B" metalness={0.78} roughness={0.4} />
      </mesh>
      <mesh position={[faceX, 0, 0]}>
        <boxGeometry args={[0.035, 1.49, 0.89]} />
        <meshStandardMaterial color="#17131F" metalness={0.42} roughness={0.62} />
      </mesh>
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[faceX - side * 0.023, 0, edge * 0.42]}>
          <boxGeometry args={[0.028, 1.38, 0.035]} />
          <meshStandardMaterial color="#E3E5EB" metalness={0.9} roughness={0.26} />
        </mesh>
      ))}
      {[-0.66, 0.66].map((y) => (
        <mesh key={y} position={[faceX - side * 0.023, y, 0]}>
          <boxGeometry args={[0.028, 0.035, 0.88]} />
          <meshStandardMaterial color="#C3C7D0" metalness={0.86} roughness={0.3} />
        </mesh>
      ))}
      {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((zOffset) => (
        <mesh key={zOffset} position={[faceX - side * 0.045, 0.26, zOffset]}>
          <boxGeometry args={[0.012, 0.025, 0.065]} />
          <meshStandardMaterial color="#C3C7D0" metalness={0.62} roughness={0.48} />
        </mesh>
      ))}
      <mesh position={[faceX - side * 0.045, -0.43, 0]}>
        <boxGeometry args={[0.012, 0.24, 0.48]} />
        <meshStandardMaterial color="#382820" metalness={0.5} roughness={0.52} />
      </mesh>
      <mesh position={[faceX - side * 0.054, -0.43, 0.16]}>
        <boxGeometry args={[0.01, 0.08, 0.018]} />
        <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function CableTrayRungs() {
  const rungMesh = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = rungMesh.current;
    if (!mesh) return;

    const transform = new Object3D();
    for (let index = 0; index < cableTrayRungCount; index += 1) {
      const rungIndex = index % 24;
      transform.position.set(index < 24 ? -2.2 : 2.2, 6.68, 8 - rungIndex * 1.3);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <instancedMesh
      args={[cableTrayRungGeometry, cableTrayRungMaterial, cableTrayRungCount]}
      dispose={null}
      ref={rungMesh}
    />
  );
}

function FloorServicePanels() {
  const panelMesh = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = panelMesh.current;
    if (!mesh) return;

    const transform = new Object3D();
    const color = new Color();
    let index = 0;
    for (const z of [-18, -13.8, -9.6, -5.4, -1.2, 3, 7.2]) {
      for (const side of [-1, 1]) {
        transform.position.set(side * 3.78, 0.125, z);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
        color.set(index % 3 === 0 ? "#8C674B" : "#C3C7D0");
        mesh.setColorAt(index, color);
        index += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      args={[floorPanelGeometry, floorPanelMaterial, floorPanelCount]}
      dispose={null}
      ref={panelMesh}
    />
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
        <meshStandardMaterial color="#17131F" metalness={0.58} roughness={0.36} />
      </mesh>
      {floorSheen.map((z) => (
        <group key={z}>
          {[-3.45, 3.45].map((x) => (
            <mesh key={x} position={[x, 0.116, z]}>
              <boxGeometry args={[0.12, 0.004, 2.8]} />
              <meshBasicMaterial color="#8C674B" transparent opacity={0.2} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
      {floorLines.map((z) => (
        <mesh key={z} position={[0, 0.115, z]}>
          <boxGeometry args={[9.45, 0.012, 0.025]} />
          <meshBasicMaterial color="#382820" />
        </mesh>
      ))}
      {floorJoints.map((z) => (
        <mesh key={z} position={[0, 0.117, z]}>
          <boxGeometry args={[9.45, 0.014, 0.035]} />
          <meshStandardMaterial color="#8C674B" metalness={0.82} roughness={0.24} />
        </mesh>
      ))}
      <FloorServicePanels />
      {[-2.85, 2.85].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.123, -7]}>
            <boxGeometry args={[0.58, 0.018, 33]} />
            <meshStandardMaterial color="#382820" metalness={0.76} roughness={0.42} />
          </mesh>
          {floorLines.map((z) => (
            <mesh key={z} position={[x, 0.135, z]}>
              <boxGeometry args={[0.48, 0.012, 0.08]} />
              <meshStandardMaterial color="#C3C7D0" metalness={0.84} roughness={0.28} />
            </mesh>
          ))}
        </group>
      ))}
      {[-4.55, 4.55].map((x) => (
        <mesh key={x} position={[x, 0.13, -7]}>
          <boxGeometry args={[0.07, 0.024, 33]} />
          <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={1.15} />
        </mesh>
      ))}
      {[-1.9, 1.9].map((x, lane) => (
        <mesh key={x} position={[x, 0.132, -7]}>
          <boxGeometry args={[0.045, 0.014, 31.5]} />
          <meshStandardMaterial
            color={lane === 0 ? "#B7A0E8" : "#D8CBF5"}
            emissive={lane === 0 ? "#8C674B" : "#B7A0E8"}
            emissiveIntensity={0.95}
          />
        </mesh>
      ))}
      {[-2.45, 2.45].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.132, -7]}>
            <boxGeometry args={[0.055, 0.012, 31.5]} />
            <meshStandardMaterial color="#8C674B" metalness={0.86} roughness={0.3} />
          </mesh>
          {[-18, -10, -2, 6].map((z) => (
            <group key={z} position={[x, 0.142, z]}>
              <mesh rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.16, 0.018, 0.16]} />
                <meshStandardMaterial color="#C3C7D0" metalness={0.88} roughness={0.26} />
              </mesh>
              <mesh position={[0, 0.012, 0]}>
                <boxGeometry args={[0.035, 0.008, 0.12]} />
                <meshBasicMaterial color="#D8CBF5" toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {[-18, -10, -2, 6].map((z, index) => (
        <group key={z} position={[0, 0.14, z]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.95, 0, 0]}>
              <boxGeometry args={[1.9, 0.012, 0.035]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#D8CBF5" : "#B7A0E8"}
                toneMapped={false}
                transparent
                opacity={0.72}
              />
            </mesh>
          ))}
          <mesh position={[0, 0.004, 0]}>
            <boxGeometry args={[0.12, 0.016, 0.12]} />
            <meshBasicMaterial color={index === 2 ? "#8C674B" : "#E3E5EB"} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 5, 3.8, -7]}>
            <boxGeometry args={[0.28, 7.6, 34]} />
            <meshStandardMaterial color={metalMaterials.wall} metalness={0.54} roughness={0.58} />
          </mesh>
          {[-21, -17, -13, -9, -5, -1, 3, 7].map((z) => (
            <group key={z} position={[side * 4.82, 3.8, z]}>
              <mesh position={[-side * 0.15, 0, 0]}>
                <boxGeometry args={[0.07, 7.02, 0.48]} />
                <meshStandardMaterial color="#8C674B" metalness={0.82} roughness={0.38} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.09, 7.25, 0.12]} />
                <meshStandardMaterial color={metalMaterials.trim} metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[-side * 0.2, 0, 0]}>
                <boxGeometry args={[0.035, 6.72, 0.19]} />
                <meshStandardMaterial color="#E3E5EB" metalness={0.94} roughness={0.22} />
              </mesh>
              {[-3.18, 3.18].map((y) => (
                <mesh key={y} position={[-side * 0.21, y, 0]}>
                  <boxGeometry args={[0.05, 0.09, 0.42]} />
                  <meshStandardMaterial color="#C3C7D0" metalness={0.88} roughness={0.28} />
                </mesh>
              ))}
              <mesh position={[-side * 0.09, 0, 0.15]}>
                <boxGeometry args={[0.018, 6.8, 0.025]} />
                <meshBasicMaterial color="#8C674B" />
              </mesh>
              {[-1, 1].map((edge) => (
                <mesh key={edge} position={[-side * 0.11, 0, edge * 0.42]}>
                  <boxGeometry args={[0.018, 5.95, 0.018]} />
                  <meshBasicMaterial
                    color={edge === 1 ? "#D8CBF5" : "#B7A0E8"}
                    toneMapped={false}
                    transparent
                    opacity={0.62}
                  />
                </mesh>
              ))}
            </group>
          ))}
          {[1.05, 3.78, 6.52].map((y) => (
            <mesh key={y} position={[side * 4.84, y, -7]}>
              <boxGeometry args={[0.045, 0.065, 33.6]} />
              <meshStandardMaterial color="#C3C7D0" metalness={0.86} roughness={0.29} />
            </mesh>
          ))}
          {[-23, -19, -15, -7, -3, 5, 9].map((z) => (
            <mesh key={z} position={[side * 4.84, 3.8, z]}>
              <boxGeometry args={[0.05, 4.9, 0.045]} />
              <meshStandardMaterial color="#8C674B" metalness={0.76} roughness={0.36} />
            </mesh>
          ))}
        </group>
      ))}
      {([-1, 1] as const).flatMap((side) =>
        [1, -7, -15].map((z) => (
          <WallTechnicalCabinet key={`${side}-${z}`} side={side} z={z} />
        )),
      )}
      <mesh position={[0, 7.45, -7]}>
        <boxGeometry args={[10.2, 0.24, 34]} />
        <meshStandardMaterial color="#17131F" metalness={0.65} roughness={0.6} />
      </mesh>
      {[-3.55, -2.75, 2.75, 3.55].map((x, index) => (
        <group key={x} position={[x, 6.96, -7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 33, 10]} />
            <meshStandardMaterial color={index % 2 ? "#C3C7D0" : "#E3E5EB"} metalness={0.87} roughness={0.28} />
          </mesh>
          <mesh position={[0.16, 0.22, 0]}>
            <boxGeometry args={[0.3, 0.24, 33]} />
            <meshStandardMaterial color="#382820" metalness={0.76} roughness={0.36} />
          </mesh>
        </group>
      ))}
      {[-2.2, 2.2].map((x) => (
        <group key={x}>
          <mesh position={[x, 6.58, -7]}>
            <boxGeometry args={[0.64, 0.035, 33]} />
            <meshStandardMaterial color="#382820" metalness={0.78} roughness={0.38} />
          </mesh>
          {[-0.31, 0.31].map((edge) => (
            <mesh key={edge} position={[x + edge, 6.67, -7]}>
              <boxGeometry args={[0.035, 0.14, 33]} />
              <meshStandardMaterial color="#8C674B" metalness={0.82} roughness={0.32} />
            </mesh>
          ))}
        </group>
      ))}
      <CableTrayRungs />
      {[-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3].map((x, index) => (
        <group key={x} position={[x, 7.1, -7]}>
          <mesh>
            <boxGeometry args={[0.08, 0.14, 33]} />
            <meshStandardMaterial color="#E3E5EB" metalness={0.7} roughness={0.4} />
          </mesh>
          {index % 2 === 0 && (
            <mesh position={[0.2, 0.03, 0]}>
              <boxGeometry args={[0.28, 0.13, 32]} />
              <meshStandardMaterial color="#8C674B" metalness={0.65} roughness={0.46} />
            </mesh>
          )}
        </group>
      ))}
      {[-16, -8, 0, 8].map((z) => (
        <group key={z} position={[0, 7.02, z]}>
          <mesh>
            <boxGeometry args={[9.7, 0.1, 0.08]} />
            <meshStandardMaterial color="#C3C7D0" metalness={0.76} roughness={0.32} />
          </mesh>
          {[-3.6, 3.6].map((x) => (
            <mesh key={x} position={[x, -0.12, 0]}>
              <boxGeometry args={[0.9, 0.055, 0.26]} />
              <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={1.05} />
            </mesh>
          ))}
        </group>
      ))}
      {[-16, -8, 0, 8].flatMap((z, index) =>
        [-1.65, 1.65].map((x, side) => (
          <group key={`${z}-${x}`} position={[x, 7.27, z]}>
            <mesh>
              <boxGeometry args={[0.9, 0.026, 1.5]} />
              <meshStandardMaterial color="#8C674B" metalness={0.46} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.035, 0]}>
              <boxGeometry args={[0.66, 0.012, 1.2]} />
              <meshStandardMaterial
                color={side === 0 ? "#E3E5EB" : "#D8CBF5"}
                emissive={side === 0 ? "#B7A0E8" : "#8C674B"}
                emissiveIntensity={index === 1 ? 0.7 : 0.5}
              />
            </mesh>
          </group>
        )),
      )}
      {[-20, -12, -4, 4].map((z, index) => {
        const x = index % 2 === 0 ? -2.2 : 2.2;
        return (
          <group key={z} position={[x, 7.32, z]}>
            <mesh>
              <boxGeometry args={[1.15, 0.045, 1.35]} />
              <meshStandardMaterial color="#C3C7D0" metalness={0.9} roughness={0.26} />
            </mesh>
            <mesh position={[0, -0.027, 0]}>
              <boxGeometry args={[0.96, 0.018, 1.15]} />
              <meshStandardMaterial color="#17131F" metalness={0.5} roughness={0.52} />
            </mesh>
            {[-0.42, 0.42].map((offset) => (
              <mesh key={offset} position={[offset, -0.039, 0]}>
                <boxGeometry args={[0.025, 0.008, 0.88]} />
                <meshStandardMaterial color="#8C674B" metalness={0.84} roughness={0.32} />
              </mesh>
            ))}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.035, 0.01, 0.62]} />
              <meshBasicMaterial color="#B7A0E8" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 7.24, -7]}>
          <mesh>
            <boxGeometry args={[0.72, 0.045, 31]} />
            <meshStandardMaterial color="#17131F" metalness={0.58} roughness={0.4} />
          </mesh>
          {floorSheen.map((z) => (
            <mesh key={z} position={[0, 0.028, z + 7]}>
              <boxGeometry args={[0.52, 0.018, 1.3]} />
              <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {rooms.filter((room) => room.side !== 0).flatMap((room, roomIndex) =>
        [-2.05, 2.05].map((offset, rackIndex) => (
          <RackInstallation
            key={`${room.id}-${offset}`}
            position={[room.side * 4.12, 0, room.z + offset]}
            rotation={room.side < 0 ? Math.PI / 2 : -Math.PI / 2}
            variant={roomIndex * 2 + rackIndex}
          />
        )),
      )}
      <RackInstallation
        position={[4.12, 0, -16.2]}
        rotation={-Math.PI / 2}
        variant={6}
      />
      {Array.from({ length: 16 }, (_, index) => {
        const z = -20 + index * 2;
        return [-4.88, 4.88].map((x, side) => (
          <mesh key={`${index}-${side}`} position={[x, 5.5, z]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={1} />
          </mesh>
        ));
      })}
      <CorridorEndBulkhead />
    </group>
  );
}

function DigitalMotes() {
  const geometry = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963;
      positions[index * 3] = Math.sin(angle) * (1.2 + (index % 5) * 0.48);
      positions[index * 3 + 1] = 0.35 + ((index * 37) % 100) / 100 * 5.5;
      positions[index * 3 + 2] = -22 + ((index * 53) % 100) / 100 * 30;
    }
    const points = new BufferGeometry();
    points.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return points;
  }, []);
  const material = useMemo(() => new PointsMaterial({
    color: "#D8CBF5",
    size: 0.1,
    transparent: true,
    opacity: 0.32,
    sizeAttenuation: true,
    depthWrite: false,
  }), []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return <points geometry={geometry} material={material} />;
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
      context.fillStyle = "#17131F";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#8C674B";
      context.lineWidth = 5;
      context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      context.fillStyle = "#D8CBF5";
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
      context.shadowColor = "#B7A0E8";
      context.shadowBlur = 16;
      context.fillStyle = "#F0EDF7";
      context.fillText(room.label, canvas.width / 2, 224, canvas.width - 112);
      context.shadowBlur = 0;
      context.fillStyle = "#B7A0E8";
      context.fillRect(130, 304, canvas.width - 260, 7);
      context.fillStyle = "#C3C7D0";
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
        <meshStandardMaterial color="#382820" metalness={0.8} roughness={0.34} />
      </mesh>
      {[-1, 1].map((edge) => (
        <group key={edge}>
          <mesh position={[0.13, 2.72, edge * 1.79]}>
            <boxGeometry args={[0.34, 5.42, 0.24]} />
            <meshStandardMaterial color="#C3C7D0" metalness={0.92} roughness={0.25} />
          </mesh>
          <mesh position={[0.31, 2.72, edge * 1.79]}>
            <boxGeometry args={[0.025, 5.12, 0.035]} />
            <meshStandardMaterial
              color="#D8CBF5"
              emissive="#B7A0E8"
              emissiveIntensity={active ? 1.8 : 0.7}
            />
          </mesh>
          {[0.52, 4.92].map((y) => (
            <mesh key={y} position={[0.34, y, edge * 1.79]}>
              <boxGeometry args={[0.035, 0.07, 0.09]} />
              <meshStandardMaterial color="#E3E5EB" metalness={0.94} roughness={0.22} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0.14, 5.43, 0]}>
        <boxGeometry args={[0.36, 0.3, 3.82]} />
        <meshStandardMaterial color="#8C674B" metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0.34, 5.43, 0]}>
        <boxGeometry args={[0.025, 0.045, 3.34]} />
        <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0.16, 0.12, 0]}>
        <boxGeometry args={[0.4, 0.18, 3.82]} />
        <meshStandardMaterial color="#C3C7D0" metalness={0.9} roughness={0.27} />
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
          <meshStandardMaterial color={active ? "#8C674B" : "#382820"} metalness={0.74} roughness={0.38} />
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.035, 4.38, 2.47]} />
          <meshStandardMaterial color="#17131F" metalness={0.56} roughness={0.44} />
        </mesh>
        {[-1.15, 0, 1.15].map((z) => (
          <mesh key={z} position={[0.12, 0, z]}>
            <boxGeometry args={[0.04, 4.3, 0.022]} />
            <meshStandardMaterial color="#8C674B" metalness={0.79} roughness={0.34} />
          </mesh>
        ))}
        {[-1.95, 1.95].map((y) => (
          <mesh key={y} position={[0.135, y, 0]}>
            <boxGeometry args={[0.055, 0.11, 2.54]} />
            <meshStandardMaterial color="#E3E5EB" metalness={0.93} roughness={0.24} />
          </mesh>
        ))}
        {[-1.22, 1.22].map((z) => (
          <group key={z} position={[0.15, 0, z]}>
            <mesh>
              <boxGeometry args={[0.07, 4.22, 0.075]} />
              <meshStandardMaterial color="#C3C7D0" metalness={0.9} roughness={0.29} />
            </mesh>
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.018, 4.02, 0.018]} />
              <meshStandardMaterial color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={0.75} />
            </mesh>
          </group>
        ))}
        {[-1.03, -0.8, -0.57, 0.57, 0.8, 1.03].map((z, index) => (
          <mesh key={z} position={[0.15, -1.58, z]}>
            <boxGeometry args={[0.065, 0.1, 0.14]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#E3E5EB" : "#8C674B"}
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
              <meshStandardMaterial color="#C3C7D0" metalness={0.96} roughness={0.2} />
            </mesh>
          )),
        )}
        <mesh position={[0.14, 0, 1.17]}>
          <boxGeometry args={[0.09, 0.82, 0.055]} />
          <meshStandardMaterial color="#8C674B" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[0.2, 0, 1.17]}>
          <boxGeometry args={[0.07, 0.34, 0.08]} />
          <meshStandardMaterial color="#E3E5EB" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[0.145, 0, 0]}>
          <boxGeometry args={[0.055, 1.02, 2.52]} />
          <meshStandardMaterial color="#17131F" metalness={0.83} roughness={0.3} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.42, 0.82]} />
          <meshBasicMaterial map={labelTexture} toneMapped={false} />
        </mesh>
      </group>
      {[-1.48, 1.48].map((z) => (
        <mesh key={z} position={[0.24, 2.58, z]}>
          <boxGeometry args={[0.065, 4.92, 0.07]} />
          <meshBasicMaterial color={active ? "#D8CBF5" : "#B7A0E8"} toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[0.24, 2.58 + edge * 2.49, 0]}>
          <boxGeometry args={[0.065, 0.07, 3.02]} />
          <meshBasicMaterial color={active ? "#D8CBF5" : "#B7A0E8"} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.2, 4.95, 0]}>
        <boxGeometry args={[0.035, 0.025, 2.78]} />
        <meshBasicMaterial color={active ? "#D8CBF5" : "#B7A0E8"} />
      </mesh>
      <mesh position={[0.23, 5.02, 0.78]}>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial ref={indicator} color="#D8CBF5" emissive="#B7A0E8" emissiveIntensity={0.85} />
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
      context.fillStyle = "#17131F";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#382820";
      context.fillRect(0, 0, canvas.width, 46);
      context.fillStyle = "#D8CBF5";
      context.font = "600 25px monospace";
      context.fillText(networkMonitorLabels[index], 22, 31);
      context.fillStyle = "#C3C7D0";
      context.font = "18px monospace";
      context.fillText("LAB / TOPOLOGIE DE DÉMO", 22, 82);
      context.strokeStyle = "#382820";
      context.lineWidth = 1;
      for (let y = 112; y < canvas.height; y += 38) {
        context.beginPath();
        context.moveTo(20, y);
        context.lineTo(492, y);
        context.stroke();
      }
      context.fillStyle = active ? "#D8CBF5" : "#B7A0E8";
      for (let row = 0; row < 7; row += 1) {
        context.fillRect(25, 133 + row * 65, 12, 12);
        context.fillRect(49, 138 + row * 65, 200 + (row % 3) * 56, 5);
      }
      context.strokeStyle = active ? "#D8CBF5" : "#B7A0E8";
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
        <meshStandardMaterial color="#382820" emissive={active ? "#B7A0E8" : "#8C674B"} emissiveIntensity={active ? 0.7 : 0.4} metalness={0.62} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.54, 2.26]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {[-0.79, 0.79].map((x, side) => (
        <mesh key={x} position={[x, 0, 0.055]}>
          <boxGeometry args={[0.018, 2.3, 0.018]} />
          <meshBasicMaterial color={side === 0 ? "#D8CBF5" : "#B7A0E8"} toneMapped={false} />
        </mesh>
      ))}
      {[-0.48, -0.16, 0.16, 0.48].map((offset, row) => (
        <mesh key={offset} position={[offset, -0.98, 0.05]}>
          <boxGeometry args={[0.05, 0.018, 0.02]} />
          <meshBasicMaterial color={row === 1 ? "#8C674B" : "#C3C7D0"} />
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
        <meshStandardMaterial color="#17131F" metalness={0.78} roughness={0.28} />
      </mesh>
      {[-6.3, 6.3].map((x, side) => (
        <mesh key={x} position={[x, -0.071, -2.2]}>
          <boxGeometry args={[0.065, 0.012, 7.7]} />
          <meshStandardMaterial
            color={side === 0 ? "#D8CBF5" : "#B7A0E8"}
            emissive={side === 0 ? "#B7A0E8" : "#8C674B"}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
      {[-7.9, 7.9].map((x, index) => (
        <ServerRack key={x} position={[x, 0, 0.2]} variant={index + 8} />
      ))}
      <mesh position={[0, 3.8, -3]}>
        <boxGeometry args={[18, 7.6, 0.25]} />
        <meshStandardMaterial color="#382820" metalness={0.66} roughness={0.52} />
      </mesh>
      <mesh position={[0, 3.3, -2.82]}>
        <boxGeometry args={[12, 3.6, 0.08]} />
        <meshStandardMaterial color="#17131F" emissive="#382820" emissiveIntensity={0.45} metalness={0.3} roughness={0.28} />
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
        <meshStandardMaterial color="#C3C7D0" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.55, -1.4]}>
          <boxGeometry args={[1.6, 0.84, 0.1]} />
          <meshStandardMaterial color="#8C674B" emissive="#B7A0E8" emissiveIntensity={0.55} />
        </mesh>
      ))}
      <pointLight position={[-2, 5.8, -2]} color="#D8CBF5" intensity={2.2} distance={14} />
      <pointLight position={[2, 5.2, -2]} color="#8C674B" intensity={1.4} distance={11} />
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
        transitionElapsed.current > index * 0.18 + 0.2 ? 2.2 : 0.08,
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
      <color attach="background" args={["#17131F"]} />
      <fog attach="fog" args={["#17131F", 24, 58]} />
      <ambientLight intensity={mode === "identity" ? 0.35 : 0.95} color="#B7A0E8" />
      <hemisphereLight intensity={mode === "identity" ? 0.4 : 1.05} color="#E3E5EB" groundColor="#382820" />
      <directionalLight position={[0, 9, 6]} intensity={mode === "identity" ? 1 : 2.2} color="#E3E5EB" />
      <CorridorArchitecture />
      {mode !== "identity" && <DigitalMotes />}
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
          color={index % 2 ? "#D8CBF5" : "#B7A0E8"}
          intensity={mode === "identity" ? 0.08 : 2.2}
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
