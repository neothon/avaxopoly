import { BOARD_TILES, type BoardTile, type DeckType, type GameSession } from "@avaxopoly/shared";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerspectiveCamera, RoundedBox, Text, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { DoubleSide, Group, MathUtils, Vector3 } from "three";

import { resolveArtwork } from "../lib/art";
import centerBoardArt from "../assets/avaxopoly.png";

const TILE_SIZE = 2.1;
const TILES_PER_SIDE = 11;
const BOARD_SIZE = TILE_SIZE * TILES_PER_SIDE;
const BOARD_HALF = BOARD_SIZE / 2;
const TILE_HEIGHT = 0.32;
const BOARD_SURFACE_HEIGHT = 0.34;
const BOARD_SURFACE_Y = 0.18;
const BOARD_SURFACE_TOP = BOARD_SURFACE_Y + BOARD_SURFACE_HEIGHT / 2;
const TILE_CENTER_Y = BOARD_SURFACE_TOP + TILE_HEIGHT / 2;
const CENTER_PANEL_HEIGHT = 0.14;
const CENTER_PANEL_Y = BOARD_SURFACE_TOP - CENTER_PANEL_HEIGHT / 2 - 0.02;
const DECK_Y = BOARD_SURFACE_TOP + 0.07;
const TITLE_Y = BOARD_SURFACE_TOP + 0.08;

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
      position: [BOARD_HALF - TILE_SIZE / 2, TILE_CENTER_Y, BOARD_HALF - TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: 0,
      side: "bottom",
      corner: true
    };
  }
  if (index < 10) {
    return {
      position: [BOARD_HALF - TILE_SIZE / 2 - TILE_SIZE * index, TILE_CENTER_Y, BOARD_HALF - TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: 0,
      side: "bottom",
      corner: false
    };
  }
  if (index === 10) {
    return {
      position: [-BOARD_HALF + TILE_SIZE / 2, TILE_CENTER_Y, BOARD_HALF - TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: Math.PI / 2,
      side: "left",
      corner: true
    };
  }
  if (index < 20) {
    return {
      position: [-BOARD_HALF + TILE_SIZE / 2, TILE_CENTER_Y, BOARD_HALF - TILE_SIZE / 2 - TILE_SIZE * (index - 10)],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: Math.PI / 2,
      side: "left",
      corner: false
    };
  }
  if (index === 20) {
    return {
      position: [-BOARD_HALF + TILE_SIZE / 2, TILE_CENTER_Y, -BOARD_HALF + TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: Math.PI,
      side: "top",
      corner: true
    };
  }
  if (index < 30) {
    return {
      position: [-BOARD_HALF + TILE_SIZE / 2 + TILE_SIZE * (index - 20), TILE_CENTER_Y, -BOARD_HALF + TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: Math.PI,
      side: "top",
      corner: false
    };
  }
  if (index === 30) {
    return {
      position: [BOARD_HALF - TILE_SIZE / 2, TILE_CENTER_Y, -BOARD_HALF + TILE_SIZE / 2],
      dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
      textRotation: -Math.PI / 2,
      side: "right",
      corner: true
    };
  }
  return {
    position: [BOARD_HALF - TILE_SIZE / 2, TILE_CENTER_Y, -BOARD_HALF + TILE_SIZE / 2 + TILE_SIZE * (index - 30)],
    dimensions: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
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
      return "JUST VISITING";
    case "go":
      return "COLLECT 20 AVAX";
  }
}

function pieceColor(playerId: string) {
  if (playerId === "player") return "#5f8dff";
  if (playerId === "bot-1") return "#ed5d47";
  if (playerId === "bot-2") return "#2cc9c0";
  return "#f3c14b";
}

function pieceTarget(index: number, stackIndex: number): Vector3 {
  const layout = tileLayout(index);
  const [x, , z] = layout.position;
  const lateralOffset = stackIndex * 0.52 - 0.52;
  const alongOffset = layout.corner ? 0.22 : 0;
  const targetX = layout.side === "left" || layout.side === "right" ? x + lateralOffset : x + lateralOffset + alongOffset;
  const targetZ = layout.side === "top" || layout.side === "bottom" ? z + lateralOffset : z + lateralOffset + alongOffset;
  return new Vector3(targetX, BOARD_SURFACE_TOP + TILE_HEIGHT - 0.07, targetZ);
}

function AccentStrip({ tile, layout }: { tile: BoardTile; layout: TileLayout }) {
  if (tile.kind !== "property" && tile.kind !== "card") {
    return null;
  }

  const stripThickness = 0.34;
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

function OwnerChip({ ownerId, layout }: { ownerId: string; layout: TileLayout }) {
  const [width, height, depth] = layout.dimensions;
  const position: [number, number, number] =
    layout.side === "bottom"
      ? [width / 2 - 0.3, height / 2 + 0.08, depth / 2 - 0.34]
      : layout.side === "top"
        ? [-width / 2 + 0.3, height / 2 + 0.08, -depth / 2 + 0.34]
        : layout.side === "left"
          ? [-width / 2 + 0.34, height / 2 + 0.08, depth / 2 - 0.3]
          : [width / 2 - 0.34, height / 2 + 0.08, -depth / 2 + 0.3];

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 20]} />
        <meshStandardMaterial color={pieceColor(ownerId)} emissive={pieceColor(ownerId)} emissiveIntensity={0.18} />
      </mesh>
      <Text position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.11} color="#f8fbff">
        {ownerId === "player" ? "P" : ownerId === "bot-1" ? "A" : ownerId === "bot-2" ? "S" : "V"}
      </Text>
    </group>
  );
}

function TileArtwork({
  artUrl,
  layout,
  height
}: {
  artUrl: string;
  layout: TileLayout;
  height: number;
}) {
  const texture = useTexture(artUrl);
  const [width, , depth] = layout.dimensions;

  return (
    <>
      <mesh position={[0, height / 2 + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[Math.max(1, width - 0.18), Math.max(1, depth - 0.18)]} />
        <meshBasicMaterial map={texture} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2 + 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[Math.max(1, width - 0.12), Math.max(1, depth - 0.12)]} />
        <meshBasicMaterial color="#f8f2de" transparent opacity={0.36} depthWrite={false} />
      </mesh>
    </>
  );
}

function TileMesh({ tile, ownerId, artUrl }: { tile: BoardTile; ownerId?: string; artUrl?: string }) {
  const layout = tileLayout(tile.index);
  const [x, y, z] = layout.position;
  const [width, height, depth] = layout.dimensions;
  const primary = layout.corner ? "#efe7d1" : "#f8f2de";
  const labelSize = layout.corner ? 0.32 : 0.22;
  const subtitleSize = layout.corner ? 0.12 : 0.1;
  const labelPosition: [number, number, number] = layout.corner
    ? layout.side === "bottom"
      ? [0, height / 2 + 0.03, 0.06]
      : layout.side === "top"
        ? [0, height / 2 + 0.03, -0.06]
        : layout.side === "left"
          ? [-0.06, height / 2 + 0.03, 0]
          : [0.18, height / 2 + 0.03, 0]
    : layout.side === "left"
      ? [-0.18, height / 2 + 0.03, 0]
      : layout.side === "right"
        ? [0.18, height / 2 + 0.03, 0]
        : [0, height / 2 + 0.03, 0];
  const subtitlePosition: [number, number, number] = layout.corner
    ? layout.side === "bottom"
      ? [0, height / 2 + 0.03, -0.58]
      : layout.side === "top"
        ? [0, height / 2 + 0.03, 0.58]
        : layout.side === "left"
          ? [0.56, height / 2 + 0.03, 0]
          : [-0.56, height / 2 + 0.03, 0]
    : layout.side === "bottom"
      ? [0, height / 2 + 0.03, -0.58]
      : layout.side === "top"
        ? [0, height / 2 + 0.03, 0.58]
        : layout.side === "left"
          ? [-0.56, height / 2 + 0.03, 0]
          : [0.56, height / 2 + 0.03, 0];

  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[width, height, depth]} radius={0.08} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color={primary} roughness={0.82} metalness={0.04} />
      </RoundedBox>

      <AccentStrip tile={tile} layout={layout} />
      {artUrl ? <TileArtwork artUrl={artUrl} layout={layout} height={height} /> : null}
      {ownerId ? <OwnerChip ownerId={ownerId} layout={layout} /> : null}

      <Text
        position={labelPosition}
        rotation={[-Math.PI / 2, 0, layout.textRotation]}
        fontSize={labelSize}
        maxWidth={layout.corner ? 1.5 : 1.36}
        color="#16212f"
        lineHeight={1.05}
        textAlign="center"
        outlineWidth={0.014}
        outlineColor="#fff8ea"
        renderOrder={4}
      >
        {tile.name}
      </Text>

      <Text
        position={subtitlePosition}
        rotation={[-Math.PI / 2, 0, layout.textRotation]}
        fontSize={subtitleSize}
        maxWidth={layout.corner ? 1.35 : 1.2}
        color="#5f6b7a"
        lineHeight={1}
        textAlign="center"
        outlineWidth={0.01}
        outlineColor="#fff8ea"
        renderOrder={4}
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
  rotation,
  highlighted
}: {
  title: string;
  accent: string;
  position: [number, number, number];
  rotation: number;
  highlighted: boolean;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    const targetY = highlighted ? position[1] + 0.28 : position[1];
    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, Math.min(1, delta * 4));
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, rotation, Math.min(1, delta * 4));
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
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
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={highlighted ? 0.2 : 0.05} />
      </mesh>
      <Text
        position={[0.16, 0.46, 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        maxWidth={3.8}
        color="#132033"
        textAlign="center"
        outlineWidth={0.012}
        outlineColor="#fff9ee"
      >
        {title}
      </Text>
    </group>
  );
}

function CenterPanelArtwork() {
  const texture = useTexture(centerBoardArt);

  return (
    <mesh position={[0, BOARD_SURFACE_TOP + 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
      <planeGeometry args={[BOARD_SIZE - TILE_SIZE * 2 - 0.3, BOARD_SIZE - TILE_SIZE * 2 - 0.3]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function AnimatedPiece({
  playerId,
  label,
  index,
  stackIndex
}: {
  playerId: string;
  label: string;
  index: number;
  stackIndex: number;
}) {
  const groupRef = useRef<Group>(null);
  const current = useRef(pieceTarget(index, stackIndex));
  const target = useRef(pieceTarget(index, stackIndex));

  useEffect(() => {
    target.current = pieceTarget(index, stackIndex);
    if (!groupRef.current) {
      current.current.copy(target.current);
    }
  }, [index, stackIndex]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }
    current.current.lerp(target.current, Math.min(1, delta * 2.1));
    const moving = current.current.distanceTo(target.current) > 0.04;
    const bob = moving ? Math.sin(state.clock.elapsedTime * 10) * 0.12 : 0;
    groupRef.current.position.set(current.current.x, current.current.y + bob, current.current.z);
  });

  return (
    <group ref={groupRef} position={current.current.toArray()}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.22, 24]} />
        <meshStandardMaterial color={pieceColor(playerId)} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.21, 20, 20]} />
        <meshStandardMaterial color={pieceColor(playerId)} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.64, 0]}>
        <coneGeometry args={[0.13, 0.22, 20]} />
        <meshStandardMaterial color={pieceColor(playerId)} />
      </mesh>
      <Text position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#fffdf7">
        {label}
      </Text>
    </group>
  );
}

export function BoardScene({
  session,
  highlightedDeck
}: {
  session?: GameSession;
  highlightedDeck?: DeckType;
}) {
  const boardTiles = session?.board ?? BOARD_TILES;
  const ownership = new Map<number, string>();
  const tileArt = new Map<number, string>();
  session?.players.forEach((player) => {
    player.properties.forEach((tileIndex) => ownership.set(tileIndex, player.id));
  });
  boardTiles.forEach((tile) => {
    const artUrl = resolveArtwork({
      tileName: tile.name,
      momentId: tile.momentIds?.[0]
    });
    if (artUrl) {
      tileArt.set(tile.index, artUrl);
    }
  });

  return (
    <div className="board-shell">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 22, 24]} fov={38} />
        <color attach="background" args={["#08101e"]} />
        <fog attach="fog" args={["#08101e", 34, 72]} />
        <ambientLight intensity={0.78} />
        <hemisphereLight args={["#dbe7fb", "#111b2e", 1.05]} />
        <directionalLight
          position={[12, 24, 16]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-16, 18, -10]} intensity={0.55} color="#a8c6ff" />
        <pointLight position={[0, 14, 0]} intensity={0.45} color="#ff8e61" />
        <pointLight position={[0, 8, -14]} intensity={0.32} color="#4d7ed8" />

        <RoundedBox args={[BOARD_SIZE + 2.8, 1.4, BOARD_SIZE + 2.8]} radius={0.28} smoothness={6} position={[0, -0.9, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#5b3f29" roughness={0.84} />
        </RoundedBox>

        <RoundedBox args={[BOARD_SIZE + 0.5, 0.5, BOARD_SIZE + 0.5]} radius={0.24} smoothness={6} position={[0, -0.04, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#203250" emissive="#17253d" emissiveIntensity={0.22} roughness={0.68} />
        </RoundedBox>

        <RoundedBox args={[BOARD_SIZE, BOARD_SURFACE_HEIGHT, BOARD_SIZE]} radius={0.18} smoothness={6} position={[0, BOARD_SURFACE_Y, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f0e8d6" roughness={0.74} />
        </RoundedBox>

        <CenterPanelArtwork />

        {boardTiles.map((tile) => (
          <TileMesh key={tile.index} tile={tile} ownerId={ownership.get(tile.index)} artUrl={tileArt.get(tile.index)} />
        ))}

        <DeckCard
          title="Community / FUD"
          accent="#ef8f34"
          position={[-4.7, DECK_Y, -3.8]}
          rotation={-0.26}
          highlighted={highlightedDeck === "community"}
        />
        <DeckCard
          title="L1 Rewards"
          accent="#1d9a7c"
          position={[4.8, DECK_Y, 3.95]}
          rotation={0.22}
          highlighted={highlightedDeck === "rewards"}
        />

        {session?.players.map((player, index) => (
          <AnimatedPiece
            key={player.id}
            playerId={player.id}
            index={player.position}
            label={player.name.slice(0, 2).toUpperCase()}
            stackIndex={index}
          />
        ))}

        <ContactShadows position={[0, -0.18, 0]} opacity={0.32} scale={48} blur={3} far={22} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={[0, BOARD_SURFACE_TOP, 0]}
          minDistance={18}
          maxDistance={44}
          minPolarAngle={0.12}
          maxPolarAngle={1.25}
          rotateSpeed={0.8}
          zoomSpeed={0.85}
        />
      </Canvas>
    </div>
  );
}
