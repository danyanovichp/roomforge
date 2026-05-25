import React, { forwardRef, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, OrthographicCamera, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CATALOG_BY_ID, formatArea } from '../data/plannerData';
import { getItemFootprint, getItemVariant } from '../lib/planner';
import { getRussianItemLabel, getRussianRoomLabel } from '../lib/russian';
import { generateHerringboneWood, generatePlasterBump, generateFabricBump, generateMarble } from '../lib/textures';

const WALL_THICKNESS = 0.08;

function SceneCamera({ mode, focus, controlsEnabled }) {
  const Controls = OrbitControls;

  return (
    <>
      <OrthographicCamera makeDefault position={[focus[0] + 10, 10, focus[2] + 10]} zoom={42} near={0.1} far={100} />
      <Controls
        makeDefault
        target={focus}
        enabled={controlsEnabled}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={22}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.6}
      />
    </>
  );
}

function useHiddenWall(room, active, mode) {
  const { camera } = useThree();
  const [hiddenWall, setHiddenWall] = useState(null);

  useFrame(() => {
    if (!active || mode === '2d') {
      if (hiddenWall !== null) {
        setHiddenWall(null);
      }
      return;
    }
    const center = new THREE.Vector3(room.x + room.width / 2, room.height / 2, room.z + room.depth / 2);
    const direction = camera.position.clone().sub(center);
    const nextWall = Math.abs(direction.x) > Math.abs(direction.z) ? (direction.x > 0 ? 'east' : 'west') : direction.z > 0 ? 'north' : 'south';
    if (nextWall !== hiddenWall) {
      setHiddenWall(nextWall);
    }
  });

  return hiddenWall;
}

// Helper to segment baseboard around doors
function getWallSegments(span, doors) {
  let segments = [[WALL_THICKNESS / 2, span - WALL_THICKNESS / 2]];
  
  doors.forEach(door => {
    const doorStart = door.offset - door.width / 2;
    const doorEnd = door.offset + door.width / 2;
    
    let nextSegments = [];
    segments.forEach(([sStart, sEnd]) => {
      if (doorStart < sEnd && doorEnd > sStart) {
        if (sStart < doorStart) {
          nextSegments.push([sStart, doorStart]);
        }
        if (sEnd > doorEnd) {
          nextSegments.push([doorEnd, sEnd]);
        }
      } else {
        nextSegments.push([sStart, sEnd]);
      }
    });
    segments = nextSegments;
  });
  
  return segments;
}

function RoomWall({ room, wall, color, hiddenWall, onSelectWall, active, textures }) {
  const span = wall === 'north' || wall === 'south' ? room.width : room.depth;
  const isHorizontal = wall === 'north' || wall === 'south';
  const rotationY = isHorizontal ? 0 : -Math.PI / 2;
  const opacity = hiddenWall === wall ? 0.08 : wall === 'south' || wall === 'west' ? 0.32 : 0.96;

  let position = [room.x + room.width / 2, room.height / 2, room.z];
  if (wall === 'north') {
    position = [room.x + room.width / 2, room.height / 2, room.z + room.depth];
  }
  if (wall === 'east') {
    position = [room.x + room.width, room.height / 2, room.z + room.depth / 2];
  }
  if (wall === 'west') {
    position = [room.x, room.height / 2, room.z + room.depth / 2];
  }

  // Memoized ExtrudeGeometry with wall openings subtracted
  const wallGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(span, 0);
    shape.lineTo(span, room.height);
    shape.lineTo(0, room.height);
    shape.closePath();

    const wallDoors = (room.openings?.doors ?? []).filter((d) => d.wall === wall);
    const wallWindows = (room.openings?.windows ?? []).filter((w) => w.wall === wall);

    wallDoors.forEach((door) => {
      const x1 = door.offset - door.width / 2;
      const x2 = door.offset + door.width / 2;
      const y1 = 0;
      const y2 = 2.2;
      const hole = new THREE.Path();
      hole.moveTo(x1, y1);
      hole.lineTo(x2, y1);
      hole.lineTo(x2, y2);
      hole.lineTo(x1, y2);
      hole.closePath();
      shape.holes.push(hole);
    });

    wallWindows.forEach((win) => {
      const x1 = win.offset - win.width / 2;
      const x2 = win.offset + win.width / 2;
      const y1 = 1.175;
      const y2 = 2.225;
      const hole = new THREE.Path();
      hole.moveTo(x1, y1);
      hole.lineTo(x2, y1);
      hole.lineTo(x2, y2);
      hole.lineTo(x1, y2);
      hole.closePath();
      shape.holes.push(hole);
    });

    const extrudeSettings = {
      depth: WALL_THICKNESS,
      bevelEnabled: false,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, [room.width, room.depth, room.height, room.openings, wall, span]);

  const plasterBumpCloned = useMemo(() => {
    if (!textures?.plasterBump) return null;
    const t = textures.plasterBump.clone();
    t.repeat.set(span * 2, room.height * 2);
    return t;
  }, [textures?.plasterBump, span, room.height]);

  return (
    <group>
      <mesh
        position={position}
        rotation={[0, rotationY, 0]}
        geometry={wallGeometry}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelectWall?.(room.id, wall);
        }}
      >
        <meshStandardMaterial
          color={color}
          bumpMap={plasterBumpCloned}
          bumpScale={0.003}
          transparent
          opacity={opacity}
          roughness={0.9}
          emissive={active ? '#e6bd77' : '#000000'}
          emissiveIntensity={active ? 0.08 : 0}
        />
      </mesh>
      {active && (
        <Html position={[position[0], room.height * 0.6, position[2]]} center>
          <button
            type="button"
            className="wall-plus-button"
            data-testid={`wall-plus-3d-${room.id}-${wall}`}
            aria-label={`Добавить комнату от стены ${getRussianRoomLabel(room)} (${wall})`}
            onClick={(event) => {
              event.stopPropagation();
              onSelectWall?.(room.id, wall, true);
            }}
          >
            +
          </button>
        </Html>
      )}
    </group>
  );
}

function RoomOpening({ room, opening, type, palette }) {
  const isHorizontal = opening.wall === 'north' || opening.wall === 'south';
  const width = opening.width;
  const height = type === 'window' ? 1.05 : 2.2;
  const bottomY = type === 'window' ? 1.175 : 0.005;

  let position = [0, bottomY, 0];
  if (opening.wall === 'north') {
    position = [room.x + opening.offset, bottomY, room.z + room.depth];
  } else if (opening.wall === 'south') {
    position = [room.x + opening.offset, bottomY, room.z];
  } else if (opening.wall === 'east') {
    position = [room.x + room.width, bottomY, room.z + opening.offset];
  } else if (opening.wall === 'west') {
    position = [room.x, bottomY, room.z + opening.offset];
  }

  const rotationY = isHorizontal ? 0 : Math.PI / 2;

  if (type === 'window') {
    const frameThickness = 0.04;
    const frameDepth = WALL_THICKNESS * 1.3;
    const frameMaterial = <meshStandardMaterial color="#1f2327" roughness={0.35} metalness={0.7} />;
    const glassMaterial = <meshStandardMaterial color="#dbebfa" transparent opacity={0.25} roughness={0.03} metalness={0.95} />;

    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* Frame Left */}
        <mesh position={[-width / 2 + frameThickness / 2, height / 2, 0]}>
          <boxGeometry args={[frameThickness, height, frameDepth]} />
          {frameMaterial}
        </mesh>
        {/* Frame Right */}
        <mesh position={[width / 2 - frameThickness / 2, height / 2, 0]}>
          <boxGeometry args={[frameThickness, height, frameDepth]} />
          {frameMaterial}
        </mesh>
        {/* Frame Bottom */}
        <mesh position={[0, frameThickness / 2, 0]}>
          <boxGeometry args={[width - frameThickness * 2, frameThickness, frameDepth]} />
          {frameMaterial}
        </mesh>
        {/* Frame Top */}
        <mesh position={[0, height - frameThickness / 2, 0]}>
          <boxGeometry args={[width - frameThickness * 2, frameThickness, frameDepth]} />
          {frameMaterial}
        </mesh>
        {/* Frame Middle Mullion */}
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[frameThickness * 0.8, height - frameThickness * 2, frameDepth * 0.9]} />
          {frameMaterial}
        </mesh>
        {/* Glass Pane Left */}
        <mesh position={[-width / 4, height / 2, 0]}>
          <boxGeometry args={[width / 2 - frameThickness * 1.4, height - frameThickness * 2, 0.008]} />
          {glassMaterial}
        </mesh>
        {/* Glass Pane Right */}
        <mesh position={[width / 4, height / 2, 0]}>
          <boxGeometry args={[width / 2 - frameThickness * 1.4, height - frameThickness * 2, 0.008]} />
          {glassMaterial}
        </mesh>
      </group>
    );
  } else {
    // Door Opening
    const casingThickness = 0.018;
    const casingDepth = WALL_THICKNESS * 1.35;
    const casingMaterial = <meshStandardMaterial color="#f3f4f6" roughness={0.4} />;

    const doorWidth = width - 0.02;
    const doorHeight = height - 0.01;
    const doorThickness = 0.04;
    const doorMaterial = <meshStandardMaterial color="#f9fafb" roughness={0.35} />;
    const handleMaterial = <meshStandardMaterial color="#c5a059" metalness={0.95} roughness={0.08} />;

    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* Door Jamb / Casing Left */}
        <mesh position={[-width / 2 - casingThickness / 2, height / 2, 0]}>
          <boxGeometry args={[casingThickness, height, casingDepth]} />
          {casingMaterial}
        </mesh>
        {/* Door Jamb / Casing Right */}
        <mesh position={[width / 2 + casingThickness / 2, height / 2, 0]}>
          <boxGeometry args={[casingThickness, height, casingDepth]} />
          {casingMaterial}
        </mesh>
        {/* Door Jamb / Casing Top */}
        <mesh position={[0, height + casingThickness / 2, 0]}>
          <boxGeometry args={[width + casingThickness * 2, casingThickness, casingDepth]} />
          {casingMaterial}
        </mesh>

        {/* Door Panel with Pivot (Open by 60 degrees) */}
        <group position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 3, 0]}>
          <mesh position={[doorWidth / 2, doorHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
            {doorMaterial}
          </mesh>
          {/* Door Handle Outer */}
          <mesh position={[doorWidth - 0.08, 1.0, doorThickness / 2 + 0.025]}>
            <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} rotation={[Math.PI / 2, 0, 0]} />
            {handleMaterial}
          </mesh>
          <mesh position={[doorWidth - 0.08 + 0.04, 1.0, doorThickness / 2 + 0.04]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.08, 8]} />
            {handleMaterial}
          </mesh>
          {/* Door Handle Inner */}
          <mesh position={[doorWidth - 0.08, 1.0, -doorThickness / 2 - 0.025]}>
            <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} rotation={[Math.PI / 2, 0, 0]} />
            {handleMaterial}
          </mesh>
          <mesh position={[doorWidth - 0.08 + 0.04, 1.0, -doorThickness / 2 - 0.04]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.08, 8]} />
            {handleMaterial}
          </mesh>
        </group>
      </group>
    );
  }
}

function ItemMesh({ item, room, palette, selected, dragging, onSelectItem, onStartDrag, textures }) {
  const groupRef = useRef(null);
  const footprint = getItemFootprint(item);
  const variant = getItemVariant(item);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    const startedAt = item.animation?.startedAt;
    if (startedAt) {
      const elapsed = Math.min((Date.now() - startedAt) / 900, 1);
      const dropOffset = (1 - elapsed) * 1.4;
      const bounce = Math.sin(elapsed * Math.PI) * 0.12;
      groupRef.current.position.y = footprint.height / 2 + dropOffset + bounce;
    } else {
      groupRef.current.position.y = footprint.height / 2;
    }
    groupRef.current.scale.setScalar(dragging ? 1.08 : selected ? 1.05 + Math.sin(clock.elapsedTime * 4) * 0.01 : 1);
  });

  const color = item.color;
  const family = item.family;
  const geometryKey = variant?.geometryKey ?? family;

  // Setup fine fabric bump map
  const fabricBumpMap = useMemo(() => {
    if (!textures?.fabricBump) return null;
    const t = textures.fabricBump.clone();
    t.repeat.set(footprint.width * 6, footprint.height * 6);
    return t;
  }, [textures?.fabricBump, footprint.width, footprint.height]);

  // Setup polished marble color map
  const marbleMap = useMemo(() => {
    if (!textures?.marbleMap) return null;
    const t = textures.marbleMap.clone();
    t.repeat.set(footprint.width * 2, footprint.depth * 2);
    return t;
  }, [textures?.marbleMap, footprint.width, footprint.depth]);

  const isSoftFurniture = geometryKey.startsWith('sofa-') || geometryKey.startsWith('chair-') || geometryKey.startsWith('bed-') || geometryKey.startsWith('rug-') || geometryKey.startsWith('textile-');
  const isTable = geometryKey.startsWith('table-') || geometryKey.startsWith('desk-');

  // Realistic materials
  const mainMaterial = useMemo(() => {
    const base = {
      color,
      roughness: 0.8,
      metalness: 0.1,
      emissive: selected ? palette.highlight : '#000000',
      emissiveIntensity: selected ? 0.28 : 0,
    };

    if (isSoftFurniture && fabricBumpMap) {
      return (
        <meshStandardMaterial
          {...base}
          bumpMap={fabricBumpMap}
          bumpScale={0.003}
          roughness={0.9}
        />
      );
    }

    if (isTable && marbleMap) {
      return (
        <meshStandardMaterial
          {...base}
          map={marbleMap}
          roughness={0.16}
          metalness={0.05}
        />
      );
    }

    return <meshStandardMaterial {...base} />;
  }, [color, selected, palette.highlight, isSoftFurniture, fabricBumpMap, isTable, marbleMap]);

  const accentMaterialProps = useMemo(() => ({
    color: '#d5b275', // Golden champagne metal
    metalness: 0.92,
    roughness: 0.16,
  }), []);

  const sheetsMaterial = useMemo(() => (
    <meshStandardMaterial
      color={palette.ceiling}
      bumpMap={fabricBumpMap}
      bumpScale={0.002}
      roughness={0.95}
    />
  ), [palette.ceiling, fabricBumpMap]);

  const material = mainMaterial;

  let geometry = (
    <RoundedBox args={[footprint.width, footprint.height, footprint.depth]} radius={0.08} smoothness={4} castShadow receiveShadow>
      {material}
    </RoundedBox>
  );

  if (geometryKey.startsWith('sofa-')) {
    const backDepth = geometryKey === 'sofa-curved' ? footprint.depth * 0.3 : footprint.depth * 0.22;
    const armWidth = geometryKey === 'sofa-minimal' ? 0.06 : geometryKey === 'sofa-tuxedo' ? footprint.width * 0.12 : footprint.width * 0.08;
    geometry = (
      <group>
        <RoundedBox
          args={[
            geometryKey === 'sofa-curved' ? footprint.width * 0.94 : footprint.width,
            geometryKey === 'sofa-minimal' ? footprint.height * 0.32 : footprint.height * 0.42,
            footprint.depth,
          ]}
          radius={geometryKey === 'sofa-curved' ? 0.24 : 0.08}
          smoothness={4}
          position={[0, -footprint.height * 0.12, 0]}
          castShadow
          receiveShadow
        >
          {material}
        </RoundedBox>
        <RoundedBox args={[footprint.width * (geometryKey === 'sofa-compact' ? 0.88 : 0.96), footprint.height * 0.3, backDepth]} radius={0.06} smoothness={4} position={[0, footprint.height * 0.14, -footprint.depth * 0.36]} castShadow receiveShadow>
          {material}
        </RoundedBox>
        {geometryKey !== 'sofa-minimal' && (
          <>
            <RoundedBox args={[armWidth, footprint.height * (geometryKey === 'sofa-tuxedo' ? 0.5 : 0.38), footprint.depth * 0.92]} radius={0.05} smoothness={4} position={[-footprint.width * 0.44, footprint.height * 0.02, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <RoundedBox args={[armWidth, footprint.height * (geometryKey === 'sofa-tuxedo' ? 0.5 : 0.38), footprint.depth * 0.92]} radius={0.05} smoothness={4} position={[footprint.width * 0.44, footprint.height * 0.02, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
          </>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('chair-')) {
    geometry = (
      <group>
        <RoundedBox args={[footprint.width * (geometryKey === 'chair-barrel' ? 0.92 : 1), footprint.height * 0.2, footprint.depth]} radius={geometryKey === 'chair-barrel' ? 0.18 : 0.05} smoothness={4} position={[0, -footprint.height * 0.16, 0]} castShadow receiveShadow>
          {material}
        </RoundedBox>
        {geometryKey !== 'chair-slipper' && (
          <RoundedBox
            args={[footprint.width * (geometryKey === 'chair-wingback' ? 0.9 : 1), footprint.height * (geometryKey === 'chair-wingback' ? 0.46 : 0.3), footprint.depth * (geometryKey === 'chair-barrel' ? 0.7 : 0.14)]}
            radius={geometryKey === 'chair-barrel' ? 0.16 : 0.04}
            smoothness={4}
            position={[0, footprint.height * 0.12, geometryKey === 'chair-barrel' ? 0 : -footprint.depth * 0.36]}
            castShadow
            receiveShadow
          >
            {material}
          </RoundedBox>
        )}
        {geometryKey === 'chair-wishbone' && (
          <>
            <mesh position={[-footprint.width * 0.24, -footprint.height * 0.02, -footprint.depth * 0.24]} rotation={[0, 0, 0.2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, footprint.height * 0.72, 10]} />
              <meshStandardMaterial {...accentMaterialProps} />
            </mesh>
            <mesh position={[footprint.width * 0.24, -footprint.height * 0.02, -footprint.depth * 0.24]} rotation={[0, 0, -0.2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, footprint.height * 0.72, 10]} />
              <meshStandardMaterial {...accentMaterialProps} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('lamp-') || geometryKey.startsWith('ceiling-')) {
    geometry = (
      <group>
        {!geometryKey.startsWith('ceiling-') && (
          <mesh position={[0, -footprint.height * 0.1, 0]} rotation={[0, 0, geometryKey === 'lamp-arc' ? -0.35 : 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, footprint.height * 0.72, 12]} />
            <meshStandardMaterial {...accentMaterialProps} />
          </mesh>
        )}
        {geometryKey === 'lamp-tripod' && (
          <>
            {[-0.2, 0, 0.2].map((offset) => (
              <mesh key={offset} position={[offset, -footprint.height * 0.16, 0]} rotation={[0, 0, offset]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, footprint.height * 0.7, 8]} />
                <meshStandardMaterial {...accentMaterialProps} />
              </mesh>
            ))}
          </>
        )}
        <mesh position={[0, geometryKey.startsWith('ceiling-') ? 0 : footprint.height * 0.22, 0]} castShadow>
          {geometryKey === 'lamp-globe' || geometryKey === 'ceiling-sputnik' ? (
            <sphereGeometry args={[Math.max(0.18, footprint.width * 0.28), 18, 18]} />
          ) : geometryKey === 'ceiling-disc' ? (
            <cylinderGeometry args={[footprint.width * 0.42, footprint.width * 0.48, footprint.height * 0.18, 24]} />
          ) : (
            <cylinderGeometry args={[footprint.width * 0.24, footprint.width * 0.32, footprint.height * 0.36, 18]} />
          )}
          {material}
        </mesh>
        {geometryKey === 'ceiling-sputnik' && (
          <>
            {Array.from({ length: 6 }).map((_, index) => {
              const angle = (index / 6) * Math.PI * 2;
              return (
                <group key={angle} rotation={[0, angle, 0]}>
                  <mesh position={[footprint.width * 0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.015, 0.015, footprint.width * 0.5, 6]} />
                    <meshStandardMaterial {...accentMaterialProps} />
                  </mesh>
                </group>
              );
            })}
          </>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('plant-')) {
    geometry = (
      <group>
        <mesh position={[0, -footprint.height * 0.18, 0]} castShadow>
          <cylinderGeometry args={[footprint.width * 0.22, footprint.width * 0.32, footprint.height * 0.24, 16]} />
          <meshStandardMaterial color="#7b5b45" roughness={0.86} />
        </mesh>
        {geometryKey === 'plant-minimal' ? (
          <mesh position={[0, footprint.height * 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, footprint.height * 0.9, 10]} />
            <meshStandardMaterial color="#70885f" roughness={0.82} />
          </mesh>
        ) : geometryKey === 'plant-palm' ? (
          <mesh position={[0, footprint.height * 0.26, 0]} castShadow>
            <sphereGeometry args={[footprint.width * 0.58, 12, 12]} />
            <meshStandardMaterial color="#7da86f" roughness={0.82} />
          </mesh>
        ) : (
          <mesh position={[0, footprint.height * 0.2, 0]} castShadow>
            <sphereGeometry args={[footprint.width * (geometryKey === 'plant-olive' ? 0.38 : 0.5), 16, 16]} />
            <meshStandardMaterial color="#7aa06e" roughness={0.82} />
          </mesh>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('tv-')) {
    geometry = (
      <group>
        <RoundedBox args={[footprint.width, footprint.height * 0.8, geometryKey === 'tv-gallery' ? footprint.depth * 0.7 : footprint.depth]} radius={geometryKey === 'tv-curved' ? 0.18 : 0.04} smoothness={4} castShadow>
          <meshStandardMaterial color="#2a3138" roughness={0.4} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0, -footprint.height * 0.48, 0]} castShadow>
          <boxGeometry args={[0.18, footprint.height * 0.18, 0.08]} />
          <meshStandardMaterial color="#3f454a" roughness={0.85} />
        </mesh>
        {geometryKey === 'tv-frame' && (
          <mesh castShadow>
            <boxGeometry args={[footprint.width * 1.02, footprint.height * 0.84, footprint.depth * 1.3]} />
            <meshStandardMaterial color="#6d574a" roughness={0.86} />
          </mesh>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('rug-') || geometryKey.startsWith('textile-')) {
    geometry = (
      <mesh position={[0, -footprint.height * 0.48, 0]} receiveShadow>
        <boxGeometry args={[footprint.width, geometryKey === 'textile-draped' ? footprint.height * 0.16 : 0.02, footprint.depth]} />
        {material}
      </mesh>
    );
  }

  if (geometryKey.startsWith('bed-')) {
    geometry = (
      <group>
        <RoundedBox args={[footprint.width, footprint.height * 0.26, footprint.depth]} radius={0.06} smoothness={4} position={[0, -footprint.height * 0.18, 0]} castShadow receiveShadow>
          {material}
        </RoundedBox>
        <RoundedBox args={[footprint.width * 0.94, footprint.height * 0.12, footprint.depth * 0.92]} radius={0.04} smoothness={4} position={[0, -footprint.height * 0.02, 0]} castShadow receiveShadow>
          {sheetsMaterial}
        </RoundedBox>
        {geometryKey !== 'bed-low' && (
          <RoundedBox args={[footprint.width, footprint.height * (geometryKey === 'bed-sleigh' ? 0.34 : 0.28), footprint.depth * 0.08]} radius={0.04} smoothness={4} position={[0, footprint.height * 0.12, -footprint.depth * 0.46]} castShadow receiveShadow>
            {material}
          </RoundedBox>
        )}
        {geometryKey === 'bed-canopy' && (
          <>
            {[
              [-footprint.width * 0.44, footprint.height * 0.5, -footprint.depth * 0.44],
              [footprint.width * 0.44, footprint.height * 0.5, -footprint.depth * 0.44],
              [-footprint.width * 0.44, footprint.height * 0.5, footprint.depth * 0.44],
              [footprint.width * 0.44, footprint.height * 0.5, footprint.depth * 0.44],
            ].map((position, index) => (
              <mesh key={index} position={position} castShadow>
                <boxGeometry args={[0.05, footprint.height, 0.05]} />
                <meshStandardMaterial {...accentMaterialProps} />
              </mesh>
            ))}
          </>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('table-') || geometryKey.startsWith('desk-')) {
    geometry = (
      <group>
        <RoundedBox args={[footprint.width, footprint.height * 0.12, footprint.depth]} radius={0.04} smoothness={4} position={[0, footprint.height * 0.18, 0]} castShadow receiveShadow>
          {material}
        </RoundedBox>
        {geometryKey.includes('pedestal') ? (
          <mesh position={[0, -footprint.height * 0.02, 0]} castShadow>
            <cylinderGeometry args={[footprint.width * 0.12, footprint.width * 0.18, footprint.height * 0.56, 16]} />
            <meshStandardMaterial {...accentMaterialProps} />
          </mesh>
        ) : geometryKey.includes('trestle') ? (
          <>
            {[-footprint.width * 0.24, footprint.width * 0.24].map((x) => (
              <mesh key={x} position={[x, -footprint.height * 0.04, 0]} castShadow>
                <boxGeometry args={[footprint.width * 0.08, footprint.height * 0.52, footprint.depth * 0.62]} />
                <meshStandardMaterial {...accentMaterialProps} />
              </mesh>
            ))}
          </>
        ) : geometryKey.includes('waterfall') ? (
          <>
            {[-footprint.width * 0.42, footprint.width * 0.42].map((x) => (
              <mesh key={x} position={[x, -footprint.height * 0.04, 0]} castShadow receiveShadow>
                <boxGeometry args={[footprint.width * 0.08, footprint.height * 0.54, footprint.depth]} />
                {material}
              </mesh>
            ))}
          </>
        ) : (
          <>
            {[-footprint.width * 0.38, footprint.width * 0.38].map((x) =>
              [-footprint.depth * 0.38, footprint.depth * 0.38].map((z) => (
                <mesh key={`${x}-${z}`} position={[x, -footprint.height * 0.04, z]} castShadow>
                  <boxGeometry args={[0.06, footprint.height * 0.54, 0.06]} />
                  <meshStandardMaterial {...accentMaterialProps} />
                </mesh>
              ))
            )}
          </>
        )}
      </group>
    );
  }

  if (
    geometryKey.startsWith('shawarma-') ||
    geometryKey.startsWith('grill-') ||
    geometryKey.startsWith('spit-') ||
    geometryKey.startsWith('counter-') ||
    geometryKey.startsWith('cold-counter-') ||
    geometryKey.startsWith('cash-') ||
    geometryKey.startsWith('hood-') ||
    geometryKey.startsWith('service-shelf-') ||
    geometryKey.startsWith('terminal-') ||
    geometryKey.startsWith('fridge-under-') ||
    geometryKey.startsWith('handwash-')
  ) {
    geometry = (
      <group>
        {(geometryKey.startsWith('counter-') || geometryKey.startsWith('cold-counter-') || geometryKey.startsWith('cash-')) && (
          <>
            <RoundedBox args={[footprint.width, footprint.height * 0.72, footprint.depth]} radius={0.05} smoothness={4} position={[0, -footprint.height * 0.04, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <RoundedBox args={[footprint.width * 0.96, footprint.height * 0.08, footprint.depth * 1.02]} radius={0.04} smoothness={4} position={[0, footprint.height * 0.34, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={palette.ceiling} roughness={0.88} />
            </RoundedBox>
          </>
        )}
        {geometryKey.startsWith('cold-counter-') && (
          <mesh position={[0, 0, footprint.depth * 0.34]} castShadow>
            <boxGeometry args={[footprint.width * 0.82, footprint.height * 0.24, footprint.depth * 0.18]} />
            <meshStandardMaterial color="#d7e2eb" roughness={0.42} metalness={0.1} />
          </mesh>
        )}
        {geometryKey.startsWith('cash-') && (
          <mesh position={[footprint.width * 0.18, footprint.height * 0.46, 0]} castShadow>
            <boxGeometry args={[footprint.width * 0.2, footprint.height * 0.18, footprint.depth * 0.16]} />
            <meshStandardMaterial color="#d7e2eb" roughness={0.32} metalness={0.16} />
          </mesh>
        )}
        {geometryKey.startsWith('shawarma-') && (
          <>
            <RoundedBox args={[footprint.width * 0.58, footprint.height * 0.82, footprint.depth * 0.56]} radius={0.08} smoothness={4} position={[-footprint.width * 0.1, 0.02, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <mesh position={[footprint.width * 0.22, footprint.height * 0.1, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, footprint.height * 0.96, 12]} />
              <meshStandardMaterial color={palette.ceiling} roughness={0.36} metalness={0.38} />
            </mesh>
            <mesh position={[footprint.width * 0.22, footprint.height * 0.26, 0]} castShadow>
              <cylinderGeometry args={[footprint.width * 0.14, footprint.width * 0.18, footprint.height * 0.28, 14]} />
              <meshStandardMaterial color="#c7865f" roughness={0.84} />
            </mesh>
          </>
        )}
        {geometryKey.startsWith('grill-') && (
          <>
            <RoundedBox args={[footprint.width, footprint.height * 0.64, footprint.depth]} radius={0.05} smoothness={4} position={[0, -footprint.height * 0.08, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <mesh position={[0, footprint.height * 0.2, 0]} castShadow>
              <boxGeometry args={[footprint.width * 0.88, footprint.height * 0.1, footprint.depth * 0.82]} />
              <meshStandardMaterial color="#2b3035" roughness={0.46} metalness={0.18} />
            </mesh>
          </>
        )}
        {geometryKey.startsWith('spit-') && (
          <>
            <mesh position={[0, -footprint.height * 0.3, 0]} castShadow>
              <boxGeometry args={[footprint.width * 0.76, footprint.height * 0.12, footprint.depth * 0.76]} />
              {material}
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, footprint.height * 0.96, 10]} />
              <meshStandardMaterial color={palette.ceiling} roughness={0.36} metalness={0.34} />
            </mesh>
            <mesh position={[0, footprint.height * 0.08, 0]} castShadow>
              <cylinderGeometry args={[footprint.width * 0.18, footprint.width * 0.18, footprint.height * 0.3, 12]} />
              <meshStandardMaterial color="#c7865f" roughness={0.84} />
            </mesh>
          </>
        )}
        {geometryKey.startsWith('hood-') && (
          <>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[footprint.width, footprint.height * 0.38, footprint.depth * 0.74]} />
              {material}
            </mesh>
            <mesh position={[0, footprint.height * 0.2, -footprint.depth * 0.08]} castShadow>
              <boxGeometry args={[footprint.width * 0.28, footprint.height * 0.28, footprint.depth * 0.2]} />
              <meshStandardMaterial {...accentMaterialProps} />
            </mesh>
          </>
        )}
        {geometryKey.startsWith('service-shelf-') && (
          <>
            {[-footprint.width * 0.42, footprint.width * 0.42].map((x) => (
              <mesh key={x} position={[x, 0, 0]} castShadow>
                <boxGeometry args={[0.06, footprint.height, 0.06]} />
                <meshStandardMaterial {...accentMaterialProps} />
              </mesh>
            ))}
            {[-footprint.height * 0.28, 0, footprint.height * 0.28].map((y) => (
              <mesh key={y} position={[0, y, 0]} castShadow>
                <boxGeometry args={[footprint.width, 0.05, footprint.depth * 0.88]} />
                {material}
              </mesh>
            ))}
          </>
        )}
        {geometryKey.startsWith('terminal-') && (
          <>
            <mesh position={[0, footprint.height * 0.12, 0]} castShadow>
              <boxGeometry args={[footprint.width * 0.84, footprint.height * 0.36, footprint.depth * 0.28]} />
              {material}
            </mesh>
            <mesh position={[0, -footprint.height * 0.04, 0]} castShadow>
              <boxGeometry args={[footprint.width * 0.18, footprint.height * 0.24, footprint.depth * 0.14]} />
              <meshStandardMaterial {...accentMaterialProps} />
            </mesh>
            <mesh position={[0, -footprint.height * 0.2, 0]} castShadow>
              <boxGeometry args={[footprint.width, footprint.height * 0.08, footprint.depth * 0.42]} />
              {material}
            </mesh>
          </>
        )}
        {geometryKey.startsWith('fridge-under-') && (
          <>
            <RoundedBox args={[footprint.width, footprint.height * 0.72, footprint.depth]} radius={0.05} smoothness={4} position={[0, -footprint.height * 0.04, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <mesh position={[0, 0, footprint.depth * 0.5]} castShadow>
              <boxGeometry args={[0.03, footprint.height * 0.4, 0.02]} />
              <meshStandardMaterial color={palette.ceiling} roughness={0.42} metalness={0.2} />
            </mesh>
          </>
        )}
        {geometryKey.startsWith('handwash-') && (
          <>
            <RoundedBox args={[footprint.width, footprint.height * 0.64, footprint.depth]} radius={0.05} smoothness={4} position={[0, -footprint.height * 0.08, 0]} castShadow receiveShadow>
              {material}
            </RoundedBox>
            <mesh position={[0, footprint.height * 0.18, 0]} castShadow>
              <cylinderGeometry args={[footprint.width * 0.24, footprint.width * 0.24, footprint.height * 0.14, 18]} />
              <meshStandardMaterial color={palette.ceiling} roughness={0.7} metalness={0.06} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('cabinet-') || geometryKey.startsWith('wardrobe-') || geometryKey.startsWith('shelf-') || geometryKey.startsWith('appliance-')) {
    const bodyHeight = geometryKey.startsWith('shelf-') ? footprint.height * 0.94 : footprint.height;
    geometry = (
      <group>
        <RoundedBox args={[footprint.width, bodyHeight, footprint.depth]} radius={geometryKey.includes('rounded') || geometryKey.includes('arched') ? 0.16 : 0.05} smoothness={4} position={[0, bodyHeight * 0.02, 0]} castShadow receiveShadow>
          {material}
        </RoundedBox>
        {(geometryKey.startsWith('shelf-') || geometryKey.includes('fluted') || geometryKey.includes('open')) && (
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[footprint.width * 0.92, bodyHeight * 0.82, footprint.depth * 0.86]} />
            <meshStandardMaterial color={palette.ceiling} roughness={0.94} />
          </mesh>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('mirror-') || geometryKey.startsWith('wall-')) {
    geometry = (
      <group>
        <mesh castShadow>
          {geometryKey.includes('round') ? (
            <cylinderGeometry args={[footprint.width * 0.48, footprint.width * 0.48, Math.max(0.03, footprint.depth), 24]} />
          ) : (
            <boxGeometry args={[footprint.width, footprint.height, Math.max(0.03, footprint.depth)]} />
          )}
          <meshStandardMaterial color={palette.panelSoft} metalness={0.25} roughness={0.24} />
        </mesh>
        {geometryKey === 'mirror-backlit' && (
          <mesh scale={[1.08, 1.08, 1.4]} castShadow>
            <boxGeometry args={[footprint.width, footprint.height, Math.max(0.02, footprint.depth)]} />
            <meshStandardMaterial color={palette.highlight} transparent opacity={0.24} />
          </mesh>
        )}
      </group>
    );
  }

  if (geometryKey.startsWith('bathtub-') || geometryKey.startsWith('shower-') || geometryKey.startsWith('toilet-') || geometryKey.startsWith('sink-') || geometryKey.startsWith('stair-') || geometryKey.startsWith('decor-')) {
    geometry = (
      <RoundedBox args={[footprint.width, footprint.height, footprint.depth]} radius={geometryKey.includes('oval') || geometryKey.includes('sculptural') ? 0.18 : 0.06} smoothness={4} castShadow receiveShadow>
        {material}
      </RoundedBox>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[room.x + item.x, footprint.height / 2, room.z + item.z]}
      rotation={[0, item.rotation, 0]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectItem(room.id, item.id);
        if (!selected) {
          onStartDrag?.(event, room, item, footprint);
        }
      }}
    >
      {geometry}
      {selected && (
        <Html position={[0, footprint.height + 0.4, 0]} center>
          <div className="scene-tag">{getRussianItemLabel(CATALOG_BY_ID[item.catalogId] ?? item.catalogId)}</div>
        </Html>
      )}
    </group>
  );
}

function RoomMesh({ room, palette, selection, onSelectRoom, onSelectItem, onSelectWall, onStartDrag, onOpenWallExpand, activeRoomId, draggingItemId, mode, textures }) {
  const hiddenWall = useHiddenWall(room, room.id === activeRoomId, mode);
  const isSelected = selection?.kind === 'room' && selection.roomId === room.id;

  const floorMaterialTextures = useMemo(() => {
    if (!textures?.floorMap || !textures?.floorRoughness) return {};
    const mapCloned = textures.floorMap.clone();
    const roughCloned = textures.floorRoughness.clone();
    
    const scaleX = room.width / 2.8;
    const scaleY = room.depth / 2.8;
    mapCloned.repeat.set(scaleX, scaleY);
    roughCloned.repeat.set(scaleX, scaleY);
    
    return { map: mapCloned, roughnessMap: roughCloned };
  }, [textures?.floorMap, textures?.floorRoughness, room.width, room.depth]);

  const baseboardHeight = 0.08;
  const baseboardThickness = 0.012;
  const baseboardMaterial = <meshStandardMaterial color="#f3f4f6" roughness={0.4} />;

  const moldingHeight = 0.06;
  const moldingThickness = 0.018;
  const moldingMaterial = <meshStandardMaterial color="#f3f4f6" roughness={0.45} />;

  return (
    <group>
      {/* Floor plane with parquet texture */}
      <mesh
        position={[room.x + room.width / 2, 0, room.z + room.depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelectRoom(room.id);
        }}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial
          color={palette.floor}
          map={floorMaterialTextures.map}
          roughnessMap={floorMaterialTextures.roughnessMap}
          roughness={0.35}
          metalness={0.02}
          emissive={isSelected ? palette.highlight : '#000000'}
          emissiveIntensity={isSelected ? 0.12 : 0}
        />
      </mesh>

      {/* Glass ceiling slab for nice volumetric depth */}
      <mesh position={[room.x + room.width / 2, room.height + 0.03, room.z + room.depth / 2]}>
        <boxGeometry args={[room.width, 0.05, room.depth]} />
        <meshStandardMaterial color={palette.ceiling} transparent opacity={0.12} />
      </mesh>

      {/* Extruded hollowed-out walls with plaster texture */}
      {['north', 'east', 'south', 'west'].map((wall) => (
        <RoomWall
          key={`${room.id}-${wall}`}
          room={room}
          wall={wall}
          color={palette.wall}
          hiddenWall={hiddenWall}
          onSelectWall={(roomId, nextWall, openComposer = false) => {
            if (openComposer) {
              onOpenWallExpand?.(roomId, nextWall);
              return;
            }
            onSelectWall?.(roomId, nextWall);
          }}
          active={selection?.kind === 'wall' && selection.roomId === room.id && selection.wall === wall}
          textures={textures}
        />
      ))}

      {/* Openings: Doors and Windows */}
      {(room.openings?.doors ?? []).map((door) => (
        <RoomOpening key={door.id} room={room} opening={door} type="door" palette={palette} />
      ))}
      {(room.openings?.windows ?? []).map((window) => (
        <RoomOpening key={window.id} room={room} opening={window} type="window" palette={palette} />
      ))}

      {/* Baseboards and Moldings */}
      {['north', 'east', 'south', 'west'].map((wall) => {
        const span = wall === 'north' || wall === 'south' ? room.width : room.depth;
        const wallDoors = (room.openings?.doors ?? []).filter((d) => d.wall === wall);
        const segments = getWallSegments(span, wallDoors);

        return (
          <group key={`interior-trims-${wall}`}>
            {/* Crown Moldings (unsegmented above doors/windows) */}
            {(() => {
              let pos = [0, room.height - moldingHeight / 2, 0];
              let size = [0, 0, 0];

              if (wall === 'south') {
                pos = [room.x + room.width / 2, room.height - moldingHeight / 2, room.z + WALL_THICKNESS / 2 + moldingThickness / 2];
                size = [room.width - WALL_THICKNESS, moldingHeight, moldingThickness];
              } else if (wall === 'north') {
                pos = [room.x + room.width / 2, room.height - moldingHeight / 2, room.z + room.depth - WALL_THICKNESS / 2 - moldingThickness / 2];
                size = [room.width - WALL_THICKNESS, moldingHeight, moldingThickness];
              } else if (wall === 'west') {
                pos = [room.x + WALL_THICKNESS / 2 + moldingThickness / 2, room.height - moldingHeight / 2, room.z + room.depth / 2];
                size = [moldingThickness, moldingHeight, room.depth - WALL_THICKNESS];
              } else if (wall === 'east') {
                pos = [room.x + room.width - WALL_THICKNESS / 2 - moldingThickness / 2, room.height - moldingHeight / 2, room.z + room.depth / 2];
                size = [moldingThickness, moldingHeight, room.depth - WALL_THICKNESS];
              }

              return (
                <mesh position={pos} castShadow receiveShadow>
                  <boxGeometry args={size} />
                  {moldingMaterial}
                </mesh>
              );
            })()}

            {/* Baseboard Segments (beautifully segmented around door openings) */}
            {segments.map(([u1, u2], idx) => {
              const len = u2 - u1;
              const center = (u1 + u2) / 2;
              let pos = [0, baseboardHeight / 2, 0];
              let size = [0, 0, 0];

              if (wall === 'south') {
                pos = [room.x + center, baseboardHeight / 2, room.z + WALL_THICKNESS / 2 + baseboardThickness / 2];
                size = [len, baseboardHeight, baseboardThickness];
              } else if (wall === 'north') {
                pos = [room.x + center, baseboardHeight / 2, room.z + room.depth - WALL_THICKNESS / 2 - baseboardThickness / 2];
                size = [len, baseboardHeight, baseboardThickness];
              } else if (wall === 'west') {
                pos = [room.x + WALL_THICKNESS / 2 + baseboardThickness / 2, baseboardHeight / 2, room.z + center];
                size = [baseboardThickness, baseboardHeight, len];
              } else if (wall === 'east') {
                pos = [room.x + room.width - WALL_THICKNESS / 2 - baseboardThickness / 2, baseboardHeight / 2, room.z + center];
                size = [baseboardThickness, baseboardHeight, len];
              }

              return (
                <mesh key={idx} position={pos} castShadow receiveShadow>
                  <boxGeometry args={size} />
                  {baseboardMaterial}
                </mesh>
              );
            })}
          </group>
        );
      })}

      <Html position={[room.x + room.width / 2, room.height + 0.7, room.z + room.depth / 2]} center>
        <div className={`room-badge ${room.id === activeRoomId ? 'active' : ''}`}>
          <strong>{getRussianRoomLabel(room)}</strong>
          <small>{formatArea(room.width * room.depth)} m²</small>
        </div>
      </Html>

      {room.items.map((item) => (
        <ItemMesh
          key={item.id}
          item={item}
          room={room}
          palette={palette}
          selected={selection?.kind === 'item' && selection.itemId === item.id}
          dragging={draggingItemId === item.id}
          onSelectItem={onSelectItem}
          onStartDrag={onStartDrag}
          textures={textures}
        />
      ))}
    </group>
  );
}

const PlannerScene = forwardRef(function PlannerScene(
  { floor, selection, palette, lighting, mode, onSelectRoom, onSelectItem, onSelectWall, onMoveItem, onClearSelection, onOpenWallExpand, activeRoomId, readOnly = false },
  ref
) {
  const canvasRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const focus = useMemo(() => {
    const rooms = floor.rooms;
    const maxX = Math.max(...rooms.map((room) => room.x + room.width));
    const maxZ = Math.max(...rooms.map((room) => room.z + room.depth));
    return [maxX / 2, 1, maxZ / 2];
  }, [floor.rooms]);
  const planeSize = useMemo(() => [focus[0] * 2 + 12, focus[2] * 2 + 12], [focus]);

  useImperativeHandle(ref, () => ({
    exportPng() {
      const canvas = canvasRef.current?.querySelector('canvas');
      return canvas ? canvas.toDataURL('image/png') : null;
    },
  }));

  const controlsEnabled = !dragState;

  // Initialize PBR textures once based on palette
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const wood = generateHerringboneWood(palette.floor || '#d8b589');
    const plaster = generatePlasterBump();
    const fabric = generateFabricBump();
    const marble = generateMarble();
    return {
      floorMap: wood.map,
      floorRoughness: wood.roughnessMap,
      plasterBump: plaster,
      fabricBump: fabric,
      marbleMap: marble,
    };
  }, [palette.floor]);

  const handleStartDrag = (event, room, item, footprint) => {
    if (readOnly || item.locked || !onMoveItem) {
      return;
    }

    const itemWorldX = room.x + item.x;
    const itemWorldZ = room.z + item.z;
    setDragState({
      roomId: room.id,
      itemId: item.id,
      offsetX: event.point.x - itemWorldX,
      offsetZ: event.point.z - itemWorldZ,
      footprint,
    });
  };

  const handleDragMove = (event) => {
    if (!dragState || !onMoveItem) {
      return;
    }

    event.stopPropagation();
    const room = floor.rooms.find((entry) => entry.id === dragState.roomId);
    if (!room) {
      return;
    }

    const nextX = event.point.x - room.x - dragState.offsetX;
    const nextZ = event.point.z - room.z - dragState.offsetZ;
    onMoveItem(room.id, dragState.itemId, nextX, nextZ);
  };

  const stopDragging = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  const handleClear = () => {
    stopDragging();
    onClearSelection?.();
  };

  return (
    <div ref={canvasRef} className="planner-scene" data-testid="planner-isometric-canvas">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onPointerMissed={handleClear}
      >
        <color attach="background" args={[palette.background]} />
        <fog attach="fog" args={[palette.background, 10, 48]} />
        <SceneCamera mode={mode} focus={focus} controlsEnabled={controlsEnabled} />
        
        {/* Lights with cinematic setup */}
        <ambientLight intensity={lighting.ambient} color={lighting.tint} />
        <directionalLight
          castShadow
          intensity={lighting.sun}
          color={lighting.tint}
          position={[focus[0] + 10, 14, focus[2] + 9]}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
        <pointLight intensity={lighting.accent} color={palette.highlight} position={[focus[0], 5, focus[2]]} />

        {/* Floor Platform */}
        <mesh receiveShadow position={[focus[0], -0.18, focus[2]]}>
          <boxGeometry args={[focus[0] * 2 + 8, 0.2, focus[2] * 2 + 8]} />
          <meshStandardMaterial color={palette.platform} roughness={0.95} />
        </mesh>

        <gridHelper args={[Math.max(planeSize[0], planeSize[1]), Math.max(12, Math.round(Math.max(planeSize[0], planeSize[1]))), palette.grid, palette.grid]} position={[focus[0], 0.02, focus[2]]} />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[focus[0], 0.01, focus[2]]}
          onPointerMove={handleDragMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
          onClick={(event) => {
            event.stopPropagation();
            handleClear();
          }}
        >
          <planeGeometry args={planeSize} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>

        {floor.rooms.map((room) => (
          <RoomMesh
            key={room.id}
            room={room}
            palette={palette}
            selection={selection}
            onSelectRoom={readOnly ? undefined : onSelectRoom}
            onSelectItem={readOnly ? undefined : onSelectItem}
            onSelectWall={readOnly ? undefined : onSelectWall}
            onStartDrag={handleStartDrag}
            onOpenWallExpand={readOnly ? undefined : onOpenWallExpand}
            activeRoomId={activeRoomId}
            draggingItemId={dragState?.itemId ?? null}
            mode={mode}
            textures={textures}
          />
        ))}

        <ContactShadows position={[focus[0], -0.12, focus[2]]} opacity={0.45} scale={40} blur={2.2} far={12} color={palette.shadow} />
      </Canvas>
    </div>
  );
});

export default PlannerScene;
