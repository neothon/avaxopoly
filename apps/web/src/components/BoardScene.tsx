import type { BoardTile, GameSession } from "@avaxopoly/shared";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerspectiveCamera, RoundedBox, Text } from "@react-three/drei";

const CORNER_SIZE = 3.4;
const EDGE_SIZE = 1.6;
const BOARD_SIZE = CORNER_SIZE * 2 + EDGE_SIZE * 9;
const BOARD_HALF = BOARD_SIZE / 2;
const TILE_HEIGHT = 0.32;

type TileLayout = {
  position: [number, number, number];
  dimensions: [number, number, number];
  textRotation: number;
  side: "bottom" | "left" | "top" | "right";
  corner: boolean;
};

function tileLayout(index: number): TileLayout {
  if (index === 0) {
    return {
      position: [BOARD_HALF - CORNER_SIZE / 2, TILE_HEIGHT / 2, BOARD_HALF - CORNER_SIZE / 2],
      dimensions: [CORNER_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: 0,
      side: "bottom",
      corner: true
    };
  }
  if (index < 10) {
    return {
      position: [
        BOARD_HALF - CORNER_SIZE - EDGE_SIZE * (index - 0.5),
        TILE_HEIGHT / 2,
        BOARD_HALF - CORNER_SIZE / 2
      ],
      dimensions: [EDGE_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: 0,
      side: "bottom",
      corner: false
    };
  }
  if (index === 10) {
    return {
      position: [-BOARD_HALF + CORNER_SIZE / 2, TILE_HEIGHT / 2, BOARD_HALF - CORNER_SIZE / 2],
      dimensions: [CORNER_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: Math.PI / 2,
      side: "left",
      corner: true
    };
  }
  if (index < 20) {
    return {
      position: [
        -BOARD_HALF + CORNER_SIZE / 2,
        TILE_HEIGHT / 2,
        BOARD_HALF - CORNER_SIZE - EDGE_SIZE * (index - 10 - 0.5)
      ],
      dimensions: [CORNER_SIZE, TILE_HEIGHT, EDGE_SIZE],
      textRotation: Math.PI / 2,
      side: "left",
      corner: false
    };
  }
  if (index === 20) {
    return {
      position: [-BOARD_HALF + CORNER_SIZE / 2, TILE_HEIGHT / 2, -BOARD_HALF + CORNER_SIZE / 2],
      dimensions: [CORNER_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: Math.PI,
      side: "top",
      corner: true
    };
  }
  if (index < 30) {
    return {
      position: [
        -BOARD_HALF + CORNER_SIZE + EDGE_SIZE * (index - 20 - 0.5),
        TILE_HEIGHT / 2,
        -BOARD_HALF + CORNER_SIZE / 2
      ],
      dimensions: [EDGE_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: Math.PI,
      side: "top",
      corner: false
    };
  }
  if (index === 30) {
    return {
      position: [BOARD_HALF - CORNER_SIZE / 2, TILE_HEIGHT / 2, -BOARD_HALF + CORNER_SIZE / 2],
      dimensions: [CORNER_SIZE, TILE_HEIGHT, CORNER_SIZE],
      textRotation: -Math.PI / 2,
      side: "right",
      corner: true
    };
  }
  return {
    position: [
      BOARD_HALF - CORNER_SIZE / 2,
      TILE_HEIGHT / 2,
      -BOARD_HALF + CORNER_SIZE + EDGE_SIZE * (index - 30 - 0.5)
    ],
    dimensions: [CORNER_SIZE, TILE_HEIGHT, EDGE_SIZE],
    textRotation: -Math.PI / 2,
    side: "right",
    corner: false
  };
}

function tileAccent(tile: BoardTile) {
  switch (tile.kind) {
    case "property":
      if (tile.rentToken === "COQ") return "#ff7a2f";
      if (tile.rentToken === "NOCHILL") return "#f7d44c";
      if (tile.rentToken === "AVAX") return "#dd4f47";
      return "#2f7f5f";
    case "rail":
      return "#1c2f54";
    case "utility":
      return "#566573";
    case "tax":
      return "#8f2154";
    case "card":
      return tile.deck === "community" ? "#ef8f34" : "#1d9a7c";
    case "freeParking":
      return "#4d955d";
    case "goToJail":
      return "#31203f";
    case "bonus":
      return "#226f98";
    case "jail":
      return "#e6bf62";
    case "go":
      return "#2c8a62";
  }
}

function tileSubtitle(tile: BoardTile) {
  switch (tile.kind) {
    case "property":
      return `${tile.cost} AVAX`;
    case "rail":
      return "L1";
    case "utility":
      return "UTILITY";
    case "tax":
      return `${tile.amount} AVAX`;
    case "card":
      return tile.deck === "community" ? "COMMUNITY / FUD" : "L1 REWARDS";
    case "freeParking":
      return "POOL";
    case "goToJail":
      return "GO TO JAIL";
    case "bonus":
      return "EVENT";
    case "jail":
      return "VISITING";
    case "go":
      return "COLLECT 200 AVAX";
  }
}

function playerColor(playerId: string) {
  if (playerId === "player") return "#0f172a";
  if (playerId === "bot-1") return "#d7263d";
  if (playerId === "bot-2") return "#187bcd";
  return "#f49d37";
}

function AccentStrip({
  tile,
  layout
}: {
  tile: BoardTile;
  layout: TileLayout;
}) {
  if (tile.kind !== "property" && tile.kind !== "card") {
    return null;
  }

  const stripThickness = 0.28;
  const stripColor = tileAccent(tile);
  const [width, , depth] = layout.dimensions;

  if (layout.side === "bottom" || layout.side === "top") {
    const zOffset = layout.side === "bottom" ? depth / 2 - stripThickness / 2 : -depth / 2 + stripThickness / 2;
    return (
      <mesh position={[0, TILE_HEIGHT / 2 + 0.02, zOffset]}>
        <boxGeometry args={[width, 0.04, stripThickness]} />
        <meshStandardMaterial color={stripColor} />
      </mesh>
    );
  }

  const xOffset = layout.side === "right" ? width / 2 - stripThickness / 2 : -width / 2 + stripThickness / 2;
  return (
    <mesh position={[xOffset, TILE_HEIGHT / 2 + 0.02, 0]}>
      <boxGeometry args={[stripThickness, 0.04, depth]} />
      <meshStandardMaterial color={stripColor} />
    </mesh>
  );
}

function TileMesh({ tile }: { tile: BoardTile }) {
  const layout = tileLayout(tile.index);
  const [x, y, z] = layout.position;
  const [width, height, depth] = layout.dimensions;
  const primary = layout.corner ? "#efe7d1" : "#f8f2de";
  const labelSize = layout.corner ? 0.34 : 0.22;
  const subtitleSize = layout.corner ? 0.14 : 0.11;

  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[width, height, depth]} radius={0.08} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color={primary} />
      </RoundedBox>

      <AccentStrip tile={tile} layout={layout} />

      <Text
        position={[0, height / 2 + 0.03, layout.corner ? 0.15 : 0]}
        rotation={[-Math.PI / 2, 0, layout.textRotation]}
        fontSize={labelSize}
        maxWidth={layout.corner ? 2.3 : Math.min(width, depth) * 0.85}
        color="#16212f"
        lineHeight={1.05}
        textAlign="center"
      >
        {tile.name}
      </Text>

      <Text
        position={[0, height / 2 + 0.03, layout.corner ? -0.95 : layout.side === "bottom" ? -0.72 : layout.side === "top" ? 0.72 : 0]}
        rotation={[-Math.PI / 2, 0, layout.textRotation]}
        fontSize={subtitleSize}
        maxWidth={layout.corner ? 2.2 : Math.min(width, depth) * 0.8}
        color="#5f6b7a"
        textAlign="center"
      >
        {tileSubtitle(tile)}
      </Text>
    </group>
  );
}

function DeckCard({
  title,
  accent,
  position,
  rotation
}: {
  title: string;
  accent: string;
  position: [number, number, number];
  rotation: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[4.8, 0.18, 3.2]} radius={0.08} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#efe1bb" />
      </RoundedBox>
      <RoundedBox args={[4.8, 0.18, 3.2]} radius={0.08} smoothness={6} position={[0.08, 0.16, -0.08]} castShadow receiveShadow>
        <meshStandardMaterial color="#f7edd2" />
      </RoundedBox>
      <RoundedBox args={[4.8, 0.2, 3.2]} radius={0.08} smoothness={6} position={[0.16, 0.32, -0.16]} castShadow receiveShadow>
        <meshStandardMaterial color="#fff8e8" />
      </RoundedBox>
      <mesh position={[0.16, 0.44, 1]}>
        <boxGeometry args={[4.8, 0.05, 0.54]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <Text
        position={[0.16, 0.46, 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        maxWidth={3.8}
        color="#132033"
        textAlign="center"
      >
        {title}
      </Text>
    </group>
  );
}

function GamePiece({
  index,
  label,
  color,
  stackIndex
}: {
  index: number;
  label: string;
  color: string;
  stackIndex: number;
}) {
  const layout = tileLayout(index);
  const [x, , z] = layout.position;
  const lateralOffset = stackIndex * 0.55 - 0.45;
  const alongOffset = layout.corner ? 0.35 : 0;
  const posX = layout.side === "left" || layout.side === "right" ? x + lateralOffset : x + alongOffset + lateralOffset;
  const posZ = layout.side === "top" || layout.side === "bottom" ? z + lateralOffset : z + alongOffset + lateralOffset;

  return (
    <group position={[posX, TILE_HEIGHT + 0.22, posZ]}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.22, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.21, 20, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.64, 0]}>
        <coneGeometry args={[0.13, 0.22, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.13} color="#fffdf7">
        {label}
      </Text>
    </group>
  );
}

export function BoardScene({ session }: { session?: GameSession }) {
  return (
    <div className="board-shell">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 28, 18]} fov={34} />
        <color attach="background" args={["#d8ceb5"]} />
        <fog attach="fog" args={["#d8ceb5", 34, 54]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[10, 22, 14]} intensity={1.15} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

        <RoundedBox args={[BOARD_SIZE + 2.8, 1.4, BOARD_SIZE + 2.8]} radius={0.28} smoothness={6} position={[0, -0.9, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#9c6b3d" />
        </RoundedBox>

        <RoundedBox args={[BOARD_SIZE, 0.34, BOARD_SIZE]} radius={0.18} smoothness={6} position={[0, -0.02, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f3ecdb" />
        </RoundedBox>

        <RoundedBox args={[BOARD_SIZE - CORNER_SIZE * 2 - 0.3, 0.12, BOARD_SIZE - CORNER_SIZE * 2 - 0.3]} radius={0.14} smoothness={6} position={[0, 0.09, 0]} receiveShadow>
          <meshStandardMaterial color="#dbe7c9" />
        </RoundedBox>

        {(session?.board ?? []).map((tile) => (
          <TileMesh key={tile.index} tile={tile} />
        ))}

        <DeckCard title="Community / FUD" accent="#ef8f34" position={[-3.9, 0.22, -1.2]} rotation={-0.26} />
        <DeckCard title="L1 Rewards" accent="#1d9a7c" position={[4.2, 0.22, 1.8]} rotation={0.22} />

        <Text position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, -0.78]} fontSize={1.15} color="#164863">
          Avaxopoly
        </Text>
        <Text position={[0, 0.22, 3.25]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.26} color="#52606e">
          Avalanche-native monopoly chaos
        </Text>

        {session?.players.map((player, index) => (
          <GamePiece
            key={player.id}
            index={player.position}
            label={player.name.slice(0, 2).toUpperCase()}
            color={playerColor(player.id)}
            stackIndex={index}
          />
        ))}

        <ContactShadows position={[0, -0.2, 0]} opacity={0.32} scale={40} blur={2.5} far={16} />
        <OrbitControls
          enablePan={false}
          target={[0, 0, 0]}
          minDistance={22}
          maxDistance={34}
          minPolarAngle={0.72}
          maxPolarAngle={1.0}
          minAzimuthAngle={-0.65}
          maxAzimuthAngle={0.65}
        />
      </Canvas>
    </div>
  );
}
