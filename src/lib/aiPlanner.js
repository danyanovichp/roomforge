import {
  CATALOG_ITEMS,
  CATALOG_BY_ID,
  LIGHTING_SCENARIOS,
  STYLE_PRESETS,
  COLOR_SWATCHES,
} from '../data/plannerData';

const ROOM_TYPES = [
  'studio',
  'living-room',
  'bedroom',
  'kitchen',
  'kitchen-living-room',
  'dining',
  'bathroom',
  'entryway',
  'office',
  'balcony',
];

const VARIANT_TIERS = ['Compact', 'Standard', 'Premium', 'Minimal', 'Statement'];

export const DEFAULT_AI_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You generate apartment layouts for the RoomForge planner.
Return only the requested JSON schema.
Rules:
- Create a practical single-floor apartment layout.
- Use meters for every coordinate and size.
- Keep rooms axis-aligned rectangles.
- Room coordinates x and z describe the top-left corner of the room on the shared floor grid.
- Items use local room coordinates where x and z describe the item center point inside the room.
- Only use roomType values and catalogId values from the provided allowed lists.
- Prefer realistic placement with clear circulation and avoid putting furniture through walls.
- Use rotation only in quarter turns: 0, 1.5708, 3.1416, or 4.7124.
- Keep item counts modest and useful.
- If the user asks in Russian, interpret it correctly but still output JSON only.`;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function snapMetric(value) {
  return Math.round(Number(value) * 100) / 100;
}

function createWallSegments(id, width, depth) {
  return {
    north: [{ id: `${id}-north-0`, start: 0, length: width, solid: true }],
    east: [{ id: `${id}-east-0`, start: 0, length: depth, solid: true }],
    south: [{ id: `${id}-south-0`, start: 0, length: width, solid: true }],
    west: [{ id: `${id}-west-0`, start: 0, length: depth, solid: true }],
  };
}

function createRuntimeId(prefix, index) {
  return `${prefix}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRotation(rotation) {
  const quarterTurn = Math.PI / 2;
  const normalizedQuarter = Math.round(Number(rotation ?? 0) / quarterTurn);
  return snapMetric(normalizedQuarter * quarterTurn);
}

function getVariantForTier(catalogId, tier = 'Standard') {
  const item = CATALOG_BY_ID[catalogId];
  return item?.variants.find((variant) => variant.tier === tier) ?? item?.variants[1] ?? item?.variants[0] ?? null;
}

function getFootprint(catalogId, tier, rotation = 0) {
  const variant = getVariantForTier(catalogId, tier);
  if (!variant) {
    return { width: 1, depth: 1 };
  }

  const normalizedRotation = normalizeRotation(rotation);
  const isTurned = Math.abs(Math.cos(normalizedRotation)) <= Math.abs(Math.sin(normalizedRotation));

  return {
    width: isTurned ? variant.size[2] : variant.size[0],
    depth: isTurned ? variant.size[0] : variant.size[2],
  };
}

function normalizeOpening(room, opening, index, type) {
  const wall = ['north', 'east', 'south', 'west'].includes(opening?.wall) ? opening.wall : 'south';
  const span = wall === 'north' || wall === 'south' ? room.width : room.depth;
  const minWidth = type === 'window' ? 0.6 : 0.8;
  const width = snapMetric(clamp(Number(opening?.width ?? (type === 'window' ? 1.8 : 1)), minWidth, Math.max(minWidth, span - 0.4)));
  const offset = snapMetric(clamp(Number(opening?.offset ?? span / 2), width / 2, span - width / 2));

  return {
    id: opening?.id ?? `${room.id}-${wall}-${type}-${index + 1}`,
    wall,
    width,
    offset,
  };
}

function createRoomFromAi(roomInput, floorId, roomIndex) {
  const id = roomInput?.id ?? createRuntimeId('ai-room', roomIndex);
  const width = snapMetric(Math.max(2, Number(roomInput?.width ?? 4)));
  const depth = snapMetric(Math.max(2, Number(roomInput?.depth ?? 4)));
  const room = {
    id,
    label: String(roomInput?.label ?? `Room ${roomIndex + 1}`).slice(0, 60),
    roomType: ROOM_TYPES.includes(roomInput?.roomType) ? roomInput.roomType : 'bedroom',
    floorId,
    x: snapMetric(Math.max(0, Number(roomInput?.x ?? 0))),
    z: snapMetric(Math.max(0, Number(roomInput?.z ?? 0))),
    width,
    depth,
    height: snapMetric(Math.max(2.4, Number(roomInput?.height ?? 3))),
    wallSegments: createWallSegments(id, width, depth),
    openings: { doors: [], windows: [] },
    items: [],
  };

  room.openings = {
    doors: Array.isArray(roomInput?.doors) ? roomInput.doors.map((door, index) => normalizeOpening(room, door, index, 'door')) : [],
    windows: Array.isArray(roomInput?.windows)
      ? roomInput.windows.map((windowOpening, index) => normalizeOpening(room, windowOpening, index, 'window'))
      : [],
  };

  room.items = Array.isArray(roomInput?.items)
    ? roomInput.items
        .map((item, index) => {
          const catalogId = item?.catalogId;
          if (!CATALOG_BY_ID[catalogId]) {
            return null;
          }

          const tier = VARIANT_TIERS.includes(item?.tier) ? item.tier : 'Standard';
          const rotation = normalizeRotation(item?.rotation ?? 0);
          const footprint = getFootprint(catalogId, tier, rotation);
          const variant = getVariantForTier(catalogId, tier);

          return {
            id: item?.id ?? createRuntimeId(catalogId, index),
            catalogId,
            variantId: variant?.id ?? `${catalogId}-standard`,
            variantTier: tier,
            family: CATALOG_BY_ID[catalogId].family,
            label: variant?.label ?? CATALOG_BY_ID[catalogId].label,
            material: variant?.material ?? 'oak',
            color: COLOR_SWATCHES.includes(item?.color) ? item.color : CATALOG_BY_ID[catalogId].defaultColor,
            x: snapMetric(clamp(Number(item?.x ?? room.width / 2), footprint.width / 2, room.width - footprint.width / 2)),
            z: snapMetric(clamp(Number(item?.z ?? room.depth / 2), footprint.depth / 2, room.depth - footprint.depth / 2)),
            rotation,
            locked: false,
            animation: null,
          };
        })
        .filter(Boolean)
    : [];

  return room;
}

function createFallbackRoom(floorId) {
  return createRoomFromAi(
    {
      label: 'AI Living',
      roomType: 'living-room',
      x: 0,
      z: 0,
      width: 6,
      depth: 5,
      items: [
        { catalogId: 'sofa', tier: 'Standard', x: 2.2, z: 2.4, rotation: 0 },
        { catalogId: 'coffee-table', tier: 'Standard', x: 3.7, z: 2.4, rotation: 0 },
        { catalogId: 'tv', tier: 'Standard', x: 5.1, z: 2.4, rotation: Math.PI / 2 },
      ],
    },
    floorId,
    0
  );
}

function buildCatalogGuide() {
  return CATALOG_ITEMS.map((item) => `${item.id}: ${item.label} [${item.roomTypes.join(', ')}]`).join('\n');
}

function buildPrompt(userPrompt) {
  return [
    'User request:',
    userPrompt.trim(),
    '',
    `Allowed room types: ${ROOM_TYPES.join(', ')}`,
    `Allowed style preset ids: ${STYLE_PRESETS.map((preset) => preset.id).join(', ')}`,
    `Allowed lighting ids: ${LIGHTING_SCENARIOS.map((scenario) => scenario.id).join(', ')}`,
    `Allowed item tiers: ${VARIANT_TIERS.join(', ')}`,
    'Allowed furniture catalog IDs:',
    buildCatalogGuide(),
  ].join('\n');
}

function buildSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      projectLabel: { type: 'string' },
      stylePresetId: { type: 'string', enum: STYLE_PRESETS.map((preset) => preset.id) },
      lightingScenarioId: { type: 'string', enum: LIGHTING_SCENARIOS.map((scenario) => scenario.id) },
      rooms: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string' },
            roomType: { type: 'string', enum: ROOM_TYPES },
            x: { type: 'number' },
            z: { type: 'number' },
            width: { type: 'number' },
            depth: { type: 'number' },
            height: { type: 'number' },
            doors: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  wall: { type: 'string', enum: ['north', 'east', 'south', 'west'] },
                  width: { type: 'number' },
                  offset: { type: 'number' },
                },
                required: ['wall', 'width', 'offset'],
              },
            },
            windows: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  wall: { type: 'string', enum: ['north', 'east', 'south', 'west'] },
                  width: { type: 'number' },
                  offset: { type: 'number' },
                },
                required: ['wall', 'width', 'offset'],
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  catalogId: { type: 'string', enum: CATALOG_ITEMS.map((item) => item.id) },
                  tier: { type: 'string', enum: VARIANT_TIERS },
                  x: { type: 'number' },
                  z: { type: 'number' },
                  rotation: { type: 'number' },
                  color: { type: 'string' },
                },
                required: ['catalogId', 'tier', 'x', 'z', 'rotation'],
              },
            },
          },
          required: ['label', 'roomType', 'x', 'z', 'width', 'depth', 'items'],
        },
      },
    },
    required: ['projectLabel', 'stylePresetId', 'lightingScenarioId', 'rooms'],
  };
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload?.output ?? []) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        return content.text;
      }
    }
  }

  throw new Error('OpenAI did not return any text output.');
}

export async function requestAiLayout({ apiKey, prompt, model = DEFAULT_AI_MODEL }) {
  const trimmedKey = apiKey.trim();
  const trimmedPrompt = prompt.trim();

  if (!trimmedKey) {
    throw new Error('Enter an OpenAI API key.');
  }
  if (!trimmedPrompt) {
    throw new Error('Describe the apartment you want to generate.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${trimmedKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_PROMPT,
      input: buildPrompt(trimmedPrompt),
      text: {
        format: {
          type: 'json_schema',
          name: 'roomforge_layout',
          strict: true,
          schema: buildSchema(),
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const outputText = extractOutputText(payload);

  try {
    return JSON.parse(outputText);
  } catch (error) {
    throw new Error('The AI response could not be parsed as layout JSON.');
  }
}

export function createStateFromAiLayout(previousState, layout) {
  const floorId = 'ai-floor-1';
  const rooms = Array.isArray(layout?.rooms) && layout.rooms.length
    ? layout.rooms.map((room, index) => createRoomFromAi(room, floorId, index))
    : [createFallbackRoom(floorId)];

  const project = {
    id: `project-ai-${Date.now()}`,
    label: String(layout?.projectLabel ?? 'AI Layout').slice(0, 80),
    propertyType: 'apartment',
    templateId: 'ai-generated',
    variants: [
      {
        id: 'A',
        label: 'Option A',
        stylePresetId: STYLE_PRESETS.some((preset) => preset.id === layout?.stylePresetId) ? layout.stylePresetId : 'minimal',
        lightingScenarioId: LIGHTING_SCENARIOS.some((scenario) => scenario.id === layout?.lightingScenarioId)
          ? layout.lightingScenarioId
          : 'day',
        activeFloorId: floorId,
        floors: [{ id: floorId, label: 'AI Floor', elevation: 0, rooms }],
      },
      {
        id: 'B',
        label: 'Option B',
        stylePresetId: STYLE_PRESETS.some((preset) => preset.id === layout?.stylePresetId) ? layout.stylePresetId : 'minimal',
        lightingScenarioId: LIGHTING_SCENARIOS.some((scenario) => scenario.id === layout?.lightingScenarioId)
          ? layout.lightingScenarioId
          : 'day',
        activeFloorId: floorId,
        floors: deepClone([{ id: floorId, label: 'AI Floor', elevation: 0, rooms }]),
      },
    ],
  };

  return {
    ...previousState,
    project,
    activeVariantId: 'A',
    activeViewMode: '2d',
    selection: rooms[0] ? { kind: 'room', roomId: rooms[0].id } : null,
  };
}
