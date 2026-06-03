import {
  CATALOG_BY_ID,
  COLOR_SWATCHES,
  VARIANT_TIERS,
  createProjectFromTemplate,
  getCatalogFamilies,
  getLightingScenario,
  getRoomArea,
  getStylePreset,
} from '../data/plannerData';
import { getRussianFloorLabel, getRussianItemLabel, getRussianRoomLabel } from './russian';

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getVariant(project, variantId) {
  return project.variants.find((variant) => variant.id === variantId) ?? project.variants[0];
}

export function getFloor(variant, floorId) {
  return variant.floors.find((floor) => floor.id === floorId) ?? variant.floors[0];
}

export function getAllRooms(variant) {
  return variant.floors.flatMap((floor) => floor.rooms);
}

export function getRoom(variant, roomId) {
  return getAllRooms(variant).find((room) => room.id === roomId) ?? getAllRooms(variant)[0];
}

export function getItem(room, itemId) {
  return room?.items.find((item) => item.id === itemId) ?? null;
}

export function getItemVariant(item) {
  const catalogItem = CATALOG_BY_ID[item.catalogId];
  return catalogItem?.variants.find((variant) => variant.id === item.variantId) ?? catalogItem?.variants[0] ?? null;
}

export function getCatalogVariant(catalogId, tier = 'Standard') {
  const catalogItem = CATALOG_BY_ID[catalogId];
  return catalogItem?.variants.find((variant) => variant.tier === tier) ?? catalogItem?.variants[1] ?? catalogItem?.variants[0] ?? null;
}

export function getItemFootprint(item) {
  const variant = getItemVariant(item);
  if (!variant) {
    return { width: 1, depth: 1, height: 1 };
  }

  const width = Math.abs(Math.cos(item.rotation)) > Math.abs(Math.sin(item.rotation)) ? variant.size[0] : variant.size[2];
  const depth = Math.abs(Math.cos(item.rotation)) > Math.abs(Math.sin(item.rotation)) ? variant.size[2] : variant.size[0];
  return { width, depth, height: variant.size[1] };
}

export function getCatalogItemFootprint(catalogId, tier = 'Standard') {
  const variant = getCatalogVariant(catalogId, tier);
  if (!variant) {
    return { width: 1, depth: 1, height: 1 };
  }

  return {
    width: variant.size[0],
    depth: variant.size[2],
    height: variant.size[1],
  };
}

export function getSceneConfig(variant, themeMode = 'light') {
  const style = getStylePreset(variant.stylePresetId, themeMode);
  const lighting = getLightingScenario(variant.lightingScenarioId);
  return { style, lighting };
}

export function getSelectionStats(variant, selection) {
  const items = getAllRooms(variant).flatMap((room) => room.items);
  const byCatalogId = items.reduce((accumulator, item) => {
    accumulator[item.catalogId] = (accumulator[item.catalogId] ?? 0) + 1;
    return accumulator;
  }, {});
  const byCategory = items.reduce((accumulator, item) => {
    const categoryId = CATALOG_BY_ID[item.catalogId]?.categoryId ?? 'misc';
    accumulator[categoryId] = (accumulator[categoryId] ?? 0) + 1;
    return accumulator;
  }, {});

  if (!selection || selection.kind !== 'item') {
    return { totalItems: items.length, byCatalogId, byCategory, selectedCount: 0 };
  }

  const room = getRoom(variant, selection.roomId);
  const item = getItem(room, selection.itemId);
  return {
    totalItems: items.length,
    byCatalogId,
    byCategory,
    selectedCount: item ? byCatalogId[item.catalogId] ?? 0 : 0,
  };
}

export function createInitialState() {
  const project = createProjectFromTemplate('one-bedroom', 'apartment');
  return {
    project,
    activeVariantId: 'A',
    activeViewMode: '2d',
    selection: { kind: 'room', roomId: project.variants[0].floors[0].rooms[0].id },
    catalogCategoryId: 'living-room',
    cameraStateByMode: {
      '2d': null,
      isometric: null,
    },
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function snapMetric(value) {
  return Math.round(value * 100) / 100;
}

function snapToGrid(value) {
  return Math.round(value);
}

function createRuntimeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getWallSpan(room, wall) {
  return wall === 'north' || wall === 'south' ? room.width : room.depth;
}

function clampOpeningWidth(room, wall, width, type = 'door') {
  const span = getWallSpan(room, wall);
  const minWidth = type === 'window' ? 0.6 : 0.8;
  const maxWidth = Math.max(minWidth, span - 0.4);
  return snapMetric(clamp(width, minWidth, maxWidth));
}

function clampOpeningOffset(room, wall, offset, width) {
  const span = getWallSpan(room, wall);
  return snapMetric(clamp(offset, width / 2, span - width / 2));
}

function normalizeOpenings(room) {
  const normalizeOpening = (opening, type) => {
    const width = clampOpeningWidth(room, opening.wall, opening.width ?? (type === 'window' ? 1.8 : 1), type);
    return {
      ...opening,
      width,
      offset: clampOpeningOffset(room, opening.wall, opening.offset ?? getWallSpan(room, opening.wall) / 2, width),
    };
  };

  return {
    doors: (room.openings?.doors ?? []).map((door) => normalizeOpening(door, 'door')),
    windows: (room.openings?.windows ?? []).map((window) => normalizeOpening(window, 'window')),
  };
}

function buildRoom({ id, label, roomType, x, z, width, depth, height = 3, floorId, items = [], doors = [], windows = [] }) {
  return {
    id,
    label,
    roomType,
    floorId,
    x,
    z,
    width,
    depth,
    height,
    wallSegments: {
      north: [{ id: `${id}-north-0`, start: 0, length: width, solid: true }],
      east: [{ id: `${id}-east-0`, start: 0, length: depth, solid: true }],
      south: [{ id: `${id}-south-0`, start: 0, length: width, solid: true }],
      west: [{ id: `${id}-west-0`, start: 0, length: depth, solid: true }],
    },
    openings: { doors, windows },
    items,
  };
}

function getOppositeWall(wall) {
  if (wall === 'north') {
    return 'south';
  }
  if (wall === 'south') {
    return 'north';
  }
  if (wall === 'east') {
    return 'west';
  }
  return 'east';
}

function nextRoomLabel(variant) {
  const maxIndex = getAllRooms(variant).reduce((highest, room) => {
    const match = /^(Room|Комната) (\d+)$/i.exec(room.label);
    return match ? Math.max(highest, Number(match[2])) : highest;
  }, 0);
  return `Комната ${maxIndex + 1}`;
}

function applyToVariant(project, variantId, updater) {
  return {
    ...project,
    variants: project.variants.map((variant) => (variant.id === variantId ? updater(variant) : variant)),
  };
}

function ensureItemInRoom(room, item) {
  const footprint = getItemFootprint(item);
  return {
    ...item,
    x: snapToGrid(clamp(item.x, footprint.width / 2, room.width - footprint.width / 2)),
    z: snapToGrid(clamp(item.z, footprint.depth / 2, room.depth - footprint.depth / 2)),
  };
}

function normalizeRoom(room) {
  return {
    ...room,
    openings: normalizeOpenings(room),
    items: room.items.map((item) => ensureItemInRoom(room, item)),
  };
}

function getDoorZones(room) {
  const doors =
    room.openings?.doors?.length
      ? room.openings.doors
      : [{ wall: 'south', offset: Math.min(room.width - 0.8, 1), width: 1 }];

  return doors.map((door) => ({
    wall: door.wall,
    offset: door.offset,
    width: door.width,
  }));
}

function placementBlocksDoor(room, x, z, footprint) {
  const left = x - footprint.width / 2;
  const right = x + footprint.width / 2;
  const top = z - footprint.depth / 2;
  const bottom = z + footprint.depth / 2;

  return getDoorZones(room).some((door) => {
    if (door.wall === 'south') {
      return right > door.offset - door.width / 2 && left < door.offset + door.width / 2 && bottom > room.depth - 1.1;
    }
    if (door.wall === 'north') {
      return right > door.offset - door.width / 2 && left < door.offset + door.width / 2 && top < 1.1;
    }
    if (door.wall === 'east') {
      return bottom > door.offset - door.width / 2 && top < door.offset + door.width / 2 && right > room.width - 1.1;
    }
    return bottom > door.offset - door.width / 2 && top < door.offset + door.width / 2 && left < 1.1;
  });
}

function placementsOverlap(candidate, item) {
  const footprint = getItemFootprint(item);
  return (
    Math.abs(candidate.x - item.x) < (candidate.width + footprint.width) / 2 &&
    Math.abs(candidate.z - item.z) < (candidate.depth + footprint.depth) / 2
  );
}

export function findSuggestedPlacement(room, catalogId, tier = 'Standard') {
  const footprint = getCatalogItemFootprint(catalogId, tier);
  const minX = Math.ceil(footprint.width / 2);
  const maxX = Math.floor(room.width - footprint.width / 2);
  const minZ = Math.ceil(footprint.depth / 2);
  const maxZ = Math.floor(room.depth - footprint.depth / 2);

  if (minX > maxX || minZ > maxZ) {
    return {
      x: snapToGrid(clamp(room.width / 2, footprint.width / 2, room.width - footprint.width / 2)),
      z: snapToGrid(clamp(room.depth / 2, footprint.depth / 2, room.depth - footprint.depth / 2)),
    };
  }

  const centerX = room.width / 2;
  const centerZ = room.depth / 2;
  const candidates = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let z = minZ; z <= maxZ; z += 1) {
      candidates.push({ x, z, width: footprint.width, depth: footprint.depth });
    }
  }

  candidates.sort((left, right) => {
    const leftDistance = Math.hypot(left.x - centerX, left.z - centerZ);
    const rightDistance = Math.hypot(right.x - centerX, right.z - centerZ);
    return leftDistance - rightDistance;
  });

  const clearCandidate = candidates.find((candidate) => {
    if (placementBlocksDoor(room, candidate.x, candidate.z, footprint)) {
      return false;
    }
    return room.items.every((item) => !placementsOverlap(candidate, item));
  });

  if (clearCandidate) {
    return { x: clearCandidate.x, z: clearCandidate.z };
  }

  return {
    x: snapToGrid(clamp(room.width / 2, footprint.width / 2, room.width - footprint.width / 2)),
    z: snapToGrid(clamp(room.depth / 2, footprint.depth / 2, room.depth - footprint.depth / 2)),
  };
}

export function setProjectType(state, propertyType, fallbackTemplateId) {
  const templateId = fallbackTemplateId ?? (propertyType === 'house' ? 'house-80' : 'one-bedroom');
  return {
    ...createInitialState(),
    project: createProjectFromTemplate(templateId, propertyType),
    selection: null,
  };
}

export function setTemplate(state, templateId, propertyType, options = {}) {
  const project = createProjectFromTemplate(templateId, propertyType, options);
  return {
    ...state,
    project,
    activeVariantId: 'A',
    selection: { kind: 'room', roomId: project.variants[0].floors[0].rooms[0].id },
  };
}

export function updateVariant(state, updater) {
  return {
    ...state,
    project: applyToVariant(state.project, state.activeVariantId, updater),
  };
}

export function setVariantStyle(state, stylePresetId) {
  return updateVariant(state, (variant) => ({ ...variant, stylePresetId }));
}

export function setVariantLighting(state, lightingScenarioId) {
  return updateVariant(state, (variant) => ({ ...variant, lightingScenarioId }));
}

export function setActiveFloor(state, floorId) {
  return updateVariant(state, (variant) => ({ ...variant, activeFloorId: floorId }));
}

export function clearSelection(state) {
  return {
    ...state,
    selection: null,
  };
}

export function resizeRoom(state, roomId, nextRect) {
  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }
        return normalizeRoom({
          ...room,
          x: snapMetric(Math.max(0, nextRect.x)),
          z: snapMetric(Math.max(0, nextRect.z)),
          width: snapMetric(Math.max(2, nextRect.width)),
          depth: snapMetric(Math.max(2, nextRect.depth)),
        });
      }),
    })),
  }));
}

export function moveItem(state, roomId, itemId, x, z) {
  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }
        return normalizeRoom({
          ...room,
          items: room.items.map((item) =>
            item.id === itemId && !item.locked
              ? {
                  ...item,
                  x: snapToGrid(x),
                  z: snapToGrid(z),
                }
              : item
          ),
        });
      }),
    })),
  }));
}

export function addItemToRoom(state, roomId, catalogId, tier = 'Standard', x = 1.5, z = 1.5) {
  const catalogItem = CATALOG_BY_ID[catalogId];
  if (!catalogItem) {
    return state;
  }

  let createdItemId = null;
  const explicitPosition = Number.isFinite(x) && Number.isFinite(z);

  const nextState = updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }

        const suggestedPlacement = explicitPosition ? { x, z } : findSuggestedPlacement(room, catalogId, tier);
        createdItemId = createRuntimeId(catalogId);

        const item = {
          id: createdItemId,
          catalogId,
          variantId: getCatalogVariant(catalogId, tier)?.id ?? catalogItem.variants[1].id,
          variantTier: tier,
          family: catalogItem.family,
          label: `${tier} ${catalogItem.label}`,
          material: getCatalogVariant(catalogId, tier)?.material ?? 'oak',
          color: catalogItem.defaultColor,
          x: snapToGrid(suggestedPlacement.x),
          z: snapToGrid(suggestedPlacement.z),
          rotation: 0,
          locked: false,
          animation: { kind: 'drop', startedAt: Date.now() },
        };

        return normalizeRoom({
          ...room,
          items: [...room.items, item],
        });
      }),
    })),
  }));

  if (!createdItemId) {
    return nextState;
  }

  return {
    ...nextState,
    selection: { kind: 'item', roomId, itemId: createdItemId },
  };
}

export function replaceSelectedItem(state, selection, nextCatalogId, nextTier) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }
  const catalogItem = CATALOG_BY_ID[nextCatalogId];
  if (!catalogItem) {
    return state;
  }

  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        items: room.items.map((item) =>
          item.id === selection.itemId
            ? {
                ...item,
                catalogId: nextCatalogId,
                variantId: catalogItem.variants.find((variantEntry) => variantEntry.tier === nextTier)?.id ?? catalogItem.variants[1].id,
                variantTier: nextTier,
                family: catalogItem.family,
                label: `${nextTier} ${catalogItem.label}`,
                material: catalogItem.variants.find((variantEntry) => variantEntry.tier === nextTier)?.material ?? item.material,
                color: item.color,
                animation: { kind: 'drop', startedAt: Date.now() },
              }
            : item
        ),
      })),
    })),
  }));
}

export function recolorSelectedItem(state, selection, color) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }
  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        items: room.items.map((item) => (item.id === selection.itemId ? { ...item, color } : item)),
      })),
    })),
  }));
}

export function rotateSelectedItem(state, selection) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }
  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        items: room.items.map((item) =>
          item.id === selection.itemId
            ? {
                ...item,
                rotation: snapMetric(item.rotation + Math.PI / 2),
              }
            : item
        ),
      })),
    })),
  }));
}

export function toggleLockSelectedItem(state, selection) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }
  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        items: room.items.map((item) => (item.id === selection.itemId ? { ...item, locked: !item.locked } : item)),
      })),
    })),
  }));
}

export function deleteSelectedItem(state, selection) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }
  return {
    ...updateVariant(state, (variant) => ({
      ...variant,
      floors: variant.floors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) => ({
          ...room,
          items: room.items.filter((item) => item.id !== selection.itemId),
        })),
      })),
    })),
    selection: { kind: 'room', roomId: selection.roomId },
  };
}

export function duplicateSelectedItem(state, selection) {
  if (!selection || selection.kind !== 'item') {
    return state;
  }

  return updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== selection.roomId) {
          return room;
        }
        const source = room.items.find((item) => item.id === selection.itemId);
        if (!source) {
          return room;
        }
        return normalizeRoom({
          ...room,
          items: [
            ...room.items,
            {
              ...deepClone(source),
              id: createRuntimeId(source.catalogId),
              x: source.x + 1,
              z: source.z + 1,
              animation: { kind: 'drop', startedAt: Date.now() },
            },
          ],
        });
      }),
    })),
  }));
}

export function cloneVariant(state, sourceVariantId, targetVariantId) {
  const source = getVariant(state.project, sourceVariantId);
  return {
    ...state,
    project: {
      ...state.project,
      variants: state.project.variants.map((variant) =>
        variant.id === targetVariantId ? deepClone({ ...source, id: targetVariantId, label: variant.label }) : variant
      ),
    },
  };
}

export function addRoomFromWall(state, roomId, wall, width, depth) {
  const nextWidth = Math.max(2, snapMetric(width));
  const nextDepth = Math.max(2, snapMetric(depth));
  const createdRoomId = createRuntimeId('room');

  return {
    ...updateVariant(state, (variant) => ({
      ...variant,
      floors: variant.floors.map((floor) => {
        const sourceRoom = floor.rooms.find((room) => room.id === roomId);
        if (!sourceRoom) {
          return floor;
        }

        const roomLabel = nextRoomLabel(variant);
        const sharedDoorWidth = Math.max(0.9, Math.min(1.2, wall === 'north' || wall === 'south' ? Math.min(sourceRoom.width, nextWidth) - 0.4 : Math.min(sourceRoom.depth, nextDepth) - 0.4));
        const doorOffset =
          wall === 'north' || wall === 'south'
            ? snapMetric(sourceRoom.width / 2)
            : snapMetric(sourceRoom.depth / 2);

        let newRoomX = sourceRoom.x;
        let newRoomZ = sourceRoom.z;
        if (wall === 'north') {
          newRoomX = Math.max(0, snapMetric(sourceRoom.x + sourceRoom.width / 2 - nextWidth / 2));
          newRoomZ = snapMetric(sourceRoom.z + sourceRoom.depth);
        } else if (wall === 'south') {
          newRoomX = Math.max(0, snapMetric(sourceRoom.x + sourceRoom.width / 2 - nextWidth / 2));
          newRoomZ = Math.max(0, snapMetric(sourceRoom.z - nextDepth));
        } else if (wall === 'east') {
          newRoomX = snapMetric(sourceRoom.x + sourceRoom.width);
          newRoomZ = Math.max(0, snapMetric(sourceRoom.z + sourceRoom.depth / 2 - nextDepth / 2));
        } else {
          newRoomX = Math.max(0, snapMetric(sourceRoom.x - nextWidth));
          newRoomZ = Math.max(0, snapMetric(sourceRoom.z + sourceRoom.depth / 2 - nextDepth / 2));
        }

        const newRoom = buildRoom({
          id: createdRoomId,
          label: roomLabel,
          roomType: 'bedroom',
          floorId: floor.id,
          x: newRoomX,
          z: newRoomZ,
          width: nextWidth,
          depth: nextDepth,
          doors: [
            {
              id: `${createdRoomId}-${getOppositeWall(wall)}-door`,
              wall: getOppositeWall(wall),
              offset: wall === 'north' || wall === 'south' ? snapMetric(nextWidth / 2) : snapMetric(nextDepth / 2),
              width: sharedDoorWidth,
            },
          ],
        });

        return {
          ...floor,
          rooms: [
            ...floor.rooms.map((room) => {
              if (room.id !== sourceRoom.id) {
                return room;
              }

              return {
                ...room,
                openings: {
                  ...room.openings,
                  doors: [
                    ...(room.openings?.doors ?? []),
                    {
                      id: `${room.id}-${wall}-door-${createdRoomId}`,
                      wall,
                      offset: doorOffset,
                      width: sharedDoorWidth,
                    },
                  ],
                },
              };
            }),
            newRoom,
          ],
        };
      }),
    })),
    selection: { kind: 'room', roomId: createdRoomId },
  };
}

export function addOpeningToWall(state, roomId, wall, openingType, width, offset) {
  if (!['door', 'window'].includes(openingType)) {
    return state;
  }

  let createdOpeningId = null;

  const nextState = updateVariant(state, (variant) => ({
    ...variant,
    floors: variant.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }

        const clampedWidth = clampOpeningWidth(room, wall, width, openingType);
        const clampedOffset = clampOpeningOffset(room, wall, offset, clampedWidth);
        createdOpeningId = createRuntimeId(openingType);
        const key = openingType === 'door' ? 'doors' : 'windows';

        return normalizeRoom({
          ...room,
          openings: {
            ...room.openings,
            [key]: [
              ...(room.openings?.[key] ?? []),
              {
                id: createdOpeningId,
                wall,
                width: clampedWidth,
                offset: clampedOffset,
              },
            ],
          },
        });
      }),
    })),
  }));

  if (!createdOpeningId) {
    return nextState;
  }

  return {
    ...nextState,
    selection: { kind: 'wall', roomId, wall },
  };
}

function doorBlocked(room, item) {
  const footprint = getItemFootprint(item);
  return placementBlocksDoor(room, item.x, item.z, footprint);
}

function chairHitsWall(room, item) {
  if (item.family !== 'chair') {
    return false;
  }
  const footprint = getItemFootprint(item);
  return (
    item.x - footprint.width / 2 < 0.3 ||
    item.x + footprint.width / 2 > room.width - 0.3 ||
    item.z - footprint.depth / 2 < 0.3 ||
    item.z + footprint.depth / 2 > room.depth - 0.3
  );
}

function wardrobeBlocked(room, item) {
  if (!['wardrobe', 'cabinet'].includes(item.family)) {
    return false;
  }
  const footprint = getItemFootprint(item);
  const frontClearance = room.depth - (item.z + footprint.depth / 2);
  return frontClearance < 0.6;
}

function narrowPassage(room) {
  const usableWidth = room.width - room.items.reduce((max, item) => Math.max(max, getItemFootprint(item).width), 0);
  const usableDepth = room.depth - room.items.reduce((max, item) => Math.max(max, getItemFootprint(item).depth), 0);
  return usableWidth < 0.8 || usableDepth < 0.8;
}

function sofaTvTooClose(room) {
  const sofas = room.items.filter((item) => item.family === 'sofa');
  const tvs = room.items.filter((item) => item.family === 'tv');
  for (const sofa of sofas) {
    for (const tv of tvs) {
      const distance = Math.hypot(sofa.x - tv.x, sofa.z - tv.z);
      if (distance < 1.8) {
        return true;
      }
    }
  }
  return false;
}

function roomsOverlap(left, right) {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.z < right.z + right.depth && left.z + left.depth > right.z;
}

export function runLayoutValidation(variant) {
  const issues = [];

  for (const floor of variant.floors) {
    for (let index = 0; index < floor.rooms.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < floor.rooms.length; compareIndex += 1) {
        const left = floor.rooms[index];
        const right = floor.rooms[compareIndex];
        if (!roomsOverlap(left, right)) {
          continue;
        }
        issues.push({
          id: `${floor.id}-${left.id}-${right.id}-overlap`,
          roomId: left.id,
          relatedRoomId: right.id,
          floorId: floor.id,
          level: 'error',
          label: 'Комнаты пересекаются',
          detail: `Комнаты «${getRussianRoomLabel(left)}» и «${getRussianRoomLabel(right)}» пересекаются на ${getRussianFloorLabel(floor)}.`,
          suggestion: 'Измените размер или положение одной из комнат, чтобы план разделялся чисто.',
        });
      }
    }
  }

  for (const room of getAllRooms(variant)) {
    if (narrowPassage(room)) {
      issues.push({
        id: `${room.id}-narrow`,
        roomId: room.id,
        level: 'warning',
        label: 'Слишком узкий проход',
        detail: `В комнате «${getRussianRoomLabel(room)}» не сохраняется проход шириной 0.8 м.`,
        suggestion: 'Сместите крупные предметы от центра или увеличьте размеры комнаты.',
      });
    }

    if (sofaTvTooClose(room)) {
      issues.push({
        id: `${room.id}-tv`,
        roomId: room.id,
        level: 'warning',
        label: 'Диван слишком близко к телевизору',
        detail: `В комнате «${getRussianRoomLabel(room)}» диван стоит ближе 1.8 м к телевизору.`,
        suggestion: 'Увеличьте дистанцию просмотра или уменьшите размер экрана.',
      });
    }

    for (const item of room.items) {
      if (doorBlocked(room, item)) {
        issues.push({
          id: `${item.id}-door`,
          roomId: room.id,
          itemId: item.id,
          level: 'warning',
          label: 'Открывание двери заблокировано',
          detail: `Предмет «${getRussianItemLabel(item.catalogId)}» стоит в зоне открывания двери в комнате «${getRussianRoomLabel(room)}».`,
          suggestion: 'Сместите предмет от дверного проема или перенесите его к другой стене.',
        });
      }
      if (chairHitsWall(room, item)) {
        issues.push({
          id: `${item.id}-chair`,
          roomId: room.id,
          itemId: item.id,
          level: 'warning',
          label: 'Стул упирается в стену',
          detail: `У предмета «${getRussianItemLabel(item.catalogId)}» недостаточный отступ от стены в комнате «${getRussianRoomLabel(room)}».`,
          suggestion: 'Сместите стул внутрь комнаты или поверните его, чтобы вернуть запас места.',
        });
      }
      if (wardrobeBlocked(room, item)) {
        issues.push({
          id: `${item.id}-wardrobe`,
          roomId: room.id,
          itemId: item.id,
          level: 'warning',
          label: 'Шкаф не открывается полностью',
          detail: `У предмета «${getRussianItemLabel(item.catalogId)}» не хватает рекомендуемого переднего зазора 0.6 м.`,
          suggestion: 'Перенесите шкаф к более длинной стене или освободите больше пространства перед ним.',
        });
      }
    }
  }

  return issues;
}

export function getProjectSummary(project, variantId) {
  const variant = getVariant(project, variantId);
  const rooms = getAllRooms(variant);
  const items = rooms.flatMap((room) => room.items);
  return {
    variant: variant.label,
    rooms: rooms.length,
    floors: variant.floors.length,
    totalArea: rooms.reduce((sum, room) => sum + getRoomArea(room), 0),
    items: items.length,
    families: getCatalogFamilies().reduce((accumulator, family) => {
      accumulator[family] = items.filter((item) => item.family === family).length;
      return accumulator;
    }, {}),
  };
}

export function createJsonExport(state) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      project: state.project,
      activeVariantId: state.activeVariantId,
      activeViewMode: state.activeViewMode,
      selection: state.selection,
      availableColors: COLOR_SWATCHES,
      availableVariantTiers: VARIANT_TIERS,
    },
    null,
    2
  );
}
