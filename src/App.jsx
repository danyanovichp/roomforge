import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Planner2D from './components/Planner2D';
import PlannerLibrary from './components/PlannerLibrary';
import PlannerScene from './components/PlannerScene';
import {
  BUSINESS_PROFILES,
  BUSINESS_ROOM_USE_OPTIONS,
  CATALOG_BY_ID,
  CATALOG_CATEGORIES,
  CATALOG_ITEMS,
  COLOR_SWATCHES,
  LIGHTING_SCENARIOS,
  PROPERTY_TYPES,
  STYLE_PRESETS,
  TEMPLATES,
  formatArea,
  getRoomArea,
} from './data/plannerData';
import {
  addItemToRoom,
  addOpeningToWall,
  addRoomFromWall,
  clearSelection,
  createInitialState,
  deleteSelectedItem,
  duplicateSelectedItem,
  getCatalogItemFootprint,
  getFloor,
  getAllRooms,
  getItem,
  getItemFootprint,
  getProjectSummary,
  getRoom,
  getSceneConfig,
  getSelectionStats,
  getVariant,
  moveItem,
  recolorSelectedItem,
  replaceSelectedItem,
  resizeRoom,
  rotateSelectedItem,
  runLayoutValidation,
  setActiveFloor,
  setProjectType,
  setTemplate,
  setVariantLighting,
  setVariantStyle,
  toggleLockSelectedItem,
} from './lib/planner';
import { createStateFromAiLayout, DEFAULT_AI_MODEL, requestAiLayout } from './lib/aiPlanner';
import {
  getRussianCategoryLabel,
  getRussianFloorLabel,
  getRussianItemDescription,
  getRussianItemLabel,
  getRussianLightingLabel,
  getRussianPropertyTypeLabel,
  getRussianRoomLabel,
  getRussianStyleLabel,
  getRussianTemplateLabel,
} from './lib/russian';

const THEME_STORAGE_KEY = 'roomforge.theme';
const AI_API_KEY_STORAGE_KEY = 'roomforge.ai.apiKey';
const AI_REMEMBER_KEY_STORAGE_KEY = 'roomforge.ai.rememberKey';
const AI_MODEL_STORAGE_KEY = 'roomforge.ai.model';
const AI_TEMPLATE_OPTION = { value: 'ai-generated', label: 'AI планировка' };
const DEFAULT_PLANNING_MODE = 'room';

const UI_THEME_TOKENS = {
  light: {
    bodyBackground: '#f5f1ea',
    text: '#1f1b18',
    muted: 'rgba(31, 27, 24, 0.72)',
    subtle: 'rgba(31, 27, 24, 0.52)',
    panelBorder: 'rgba(53, 45, 39, 0.12)',
    panelOverlay: 'linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(248, 242, 235, 0.96))',
    panelShadow: 'rgba(43, 35, 30, 0.08)',
    frameBackground: '#fbf8f3',
    controlBackground: '#f6efe5',
    controlHover: '#f1e8dc',
    controlActive: '#ece1d3',
    controlActiveBorder: 'rgba(53, 45, 39, 0.14)',
    cardBackground: '#fcf8f2',
    insetBackground: '#f7f1e8',
    successBackground: 'rgba(176, 212, 184, 0.42)',
    dangerBackground: 'rgba(168, 98, 85, 0.14)',
    dangerText: '#8c4338',
    swatchRing: 'rgba(53, 45, 39, 0.16)',
    sceneOverlayBg: 'rgba(255, 252, 247, 0.94)',
    sceneOverlayBgActive: 'rgba(250, 240, 225, 0.98)',
    sceneOverlayBorder: 'rgba(53, 45, 39, 0.12)',
    sceneOverlayText: '#1f1b18',
    sceneOverlayMuted: 'rgba(31, 27, 24, 0.62)',
  },
  dark: {
    bodyBackground: '#181614',
    text: '#f3ede6',
    muted: 'rgba(243, 237, 230, 0.76)',
    subtle: 'rgba(243, 237, 230, 0.54)',
    panelBorder: 'rgba(255, 255, 255, 0.1)',
    panelOverlay: 'linear-gradient(180deg, rgba(31, 28, 27, 0.96), rgba(24, 22, 21, 0.96))',
    panelShadow: 'rgba(0, 0, 0, 0.24)',
    frameBackground: '#201d1a',
    controlBackground: '#26221f',
    controlHover: '#2d2825',
    controlActive: '#342d29',
    controlActiveBorder: 'rgba(255, 255, 255, 0.14)',
    cardBackground: '#23201d',
    insetBackground: '#211d1a',
    successBackground: 'rgba(98, 132, 104, 0.32)',
    dangerBackground: 'rgba(170, 92, 80, 0.18)',
    dangerText: '#ffb6aa',
    swatchRing: 'rgba(255, 255, 255, 0.18)',
    sceneOverlayBg: 'rgba(31, 28, 27, 0.96)',
    sceneOverlayBgActive: 'rgba(58, 47, 37, 0.98)',
    sceneOverlayBorder: 'rgba(255, 255, 255, 0.12)',
    sceneOverlayText: '#f3ede6',
    sceneOverlayMuted: 'rgba(243, 237, 230, 0.64)',
  },
};

const MODE_HINTS = {
  '2d': ['Нажмите один раз, чтобы выбрать комнату или предмет.', 'Повторным действием можно перетаскивать предметы и менять размеры комнаты.', 'Через выбранную стену добавляйте соседнюю комнату, дверь или окно.'],
  isometric: ['Поворачивайте сцену, чтобы оценить пропорции и проходы.', 'Перетаскивайте выбранные предметы прямо по полу.', 'Карточки проверок помогут быстро перейти к проблемной зоне.'],
};

const BUSINESS_MODE_HINTS = {
  '2d': ['Размечайте помещение по зонам: горячая линия, сборка, клиенты, хранение.', 'Доля полезной площади и плотность оборудования покажут, насколько помещение работает на бизнес.', 'Добавляйте комплект запуска прямо в активную комнату.'],
  isometric: ['Проверьте, хватает ли места для сотрудников, оборудования и потока клиентов.', 'Цикл обслуживания и скорость помогут оценить пропускную способность.', 'Справа видны задачи запуска, покрытие оборудования и рекомендации по улучшению.'],
};

const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'Запланировано' },
  { value: 'doing', label: 'В работе' },
  { value: 'done', label: 'Готово' },
];

const ROOM_USE_AREA_FACTORS = {
  work: 4.5,
  client: 3.2,
  prep: 3.8,
  storage: 6,
  support: 5.2,
};

function getBusinessUseLabel(useId) {
  return BUSINESS_ROOM_USE_OPTIONS.find((option) => option.id === useId)?.label ?? useId;
}

function createBusinessTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cloneBusinessTasks(profileId) {
  const profile = BUSINESS_PROFILES.find((entry) => entry.id === profileId) ?? BUSINESS_PROFILES[0];
  return profile.defaultTasks.map((task) => ({
    id: createBusinessTaskId(),
    title: task.title,
    hours: task.hours,
    owner: task.owner,
    notes: task.notes,
    status: 'todo',
  }));
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
}

function formatHours(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0 ч';
  }
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} ч`;
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)}%`;
}

function getDefaultBusinessRoomPlan(room) {
  const baseArea = getRoomArea(room);
  const inferredZone =
    room.roomType === 'office'
      ? 'work'
      : room.roomType === 'kitchen'
        ? 'prep'
        : room.roomType === 'bathroom'
          ? 'support'
          : room.roomType === 'entryway'
            ? 'client'
            : room.roomType === 'bedroom'
              ? 'storage'
              : 'work';
  const defaultStations =
    inferredZone === 'storage'
      ? 1
      : Math.max(1, Math.floor(baseArea / (ROOM_USE_AREA_FACTORS[inferredZone] ?? 4.5)));

  return {
    use: inferredZone,
    workAreaShare: inferredZone === 'storage' ? 35 : inferredZone === 'support' ? 45 : 70,
    stations: defaultStations,
    cycleMinutes: inferredZone === 'client' ? 20 : inferredZone === 'prep' ? 30 : 45,
    speedPercent: 100,
    notes: '',
  };
}

function getBusinessRoomPlan(room, plansByRoomId) {
  return {
    ...getDefaultBusinessRoomPlan(room),
    ...(plansByRoomId[room.id] ?? {}),
  };
}

function getBusinessRoomMetrics(room, plan, businessProfile) {
  const roomArea = getRoomArea(room);
  const workingArea = roomArea * (clampNumber(plan.workAreaShare, 0, 100) / 100);
  const stations = Math.max(0, clampNumber(plan.stations, 0, 999));
  const cycleMinutes = Math.max(5, clampNumber(plan.cycleMinutes, 5, 480));
  const speedMultiplier = clampNumber(plan.speedPercent, 25, 250) / 100;
  const hourlyCapacity = plan.use === 'storage' ? 0 : stations * (60 / cycleMinutes) * speedMultiplier;
  const equipmentArea = room.items.reduce((sum, item) => {
    const footprint = getItemFootprint(item);
    return sum + footprint.width * footprint.depth;
  }, 0);
  const equipmentDensity = roomArea ? (equipmentArea / roomArea) * 100 : 0;
  const freeArea = Math.max(roomArea - equipmentArea, 0);
  const areaPerStation = stations ? workingArea / stations : 0;
  const zoneRatio = roomArea ? (workingArea / roomArea) * 100 : 0;
  const recommendations = [];
  let utilizationScore = 100;

  if ((plan.use === 'work' || plan.use === 'prep') && zoneRatio < 52) {
    utilizationScore -= 18;
    recommendations.push('Увеличьте долю рабочей площади или сократите пассивные зоны внутри комнаты.');
  }

  if (equipmentDensity > businessProfile.targetEquipmentDensity + 12) {
    utilizationScore -= 20;
    recommendations.push('Оборудование стоит слишком плотно: разгрузите зону или перенесите часть функций в соседнюю комнату.');
  } else if ((plan.use === 'work' || plan.use === 'prep') && equipmentDensity < businessProfile.targetEquipmentDensity - 16) {
    utilizationScore -= 10;
    recommendations.push('Комната недогружена: здесь можно разместить дополнительную станцию, хранение или сервисный стол.');
  }

  if (stations > 0 && areaPerStation < 2.1) {
    utilizationScore -= 16;
    recommendations.push('На одно рабочее место приходится мало площади: снизьте плотность или расширьте рабочий контур.');
  }

  if (freeArea < 1.6 && plan.use !== 'storage') {
    utilizationScore -= 12;
    recommendations.push('Оставьте больше свободного прохода для сотрудников и клиентов.');
  }

  const clampedScore = Math.max(18, Math.min(100, Math.round(utilizationScore)));
  const status = clampedScore >= 78 ? 'success' : clampedScore >= 55 ? 'warning' : 'danger';

  return {
    roomArea,
    workingArea,
    stations,
    cycleMinutes,
    hourlyCapacity,
    dailyCapacity: hourlyCapacity * businessProfile.operatingHours,
    equipmentArea,
    equipmentDensity,
    freeArea,
    areaPerStation,
    zoneRatio,
    utilizationScore: clampedScore,
    status,
    recommendations,
  };
}

function getInitialThemeMode() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function SelectField({ label, value, onChange, options, testId }) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AiPlannerPanel({
  apiKey,
  onApiKeyChange,
  rememberKey,
  onRememberKeyChange,
  model,
  onModelChange,
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  error,
}) {
  return (
    <div className="panel compact-panel">
      <div className="panel-header">
        <span>AI-планировка</span>
        <small>Ключ и текстовое описание</small>
      </div>
      <p className="muted-copy">
        Сгенерируйте новый вариант жилой планировки по текстовому описанию. Запрос отправляется напрямую из браузера в OpenAI.
      </p>
      <div className="control-stack ai-planner-controls">
        <label className="select-field">
          <span>OpenAI API key</span>
          <input
            data-testid="ai-layout-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="sk-..."
            autoComplete="off"
          />
        </label>

        <label className="remember-key-toggle">
          <input
            data-testid="ai-layout-remember-key"
            type="checkbox"
            checked={rememberKey}
            onChange={(event) => onRememberKeyChange(event.target.checked)}
          />
          <span>Запомнить ключ на этом устройстве</span>
        </label>

        <label className="select-field">
          <span>Модель</span>
          <input
            data-testid="ai-layout-model"
            type="text"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            placeholder={DEFAULT_AI_MODEL}
            autoComplete="off"
          />
        </label>

        <label className="select-field">
          <span>Промпт</span>
          <textarea
            data-testid="ai-layout-prompt"
            rows={6}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Например: сделай 2-комнатную квартиру 58 м² с кухней-гостиной, спальней, небольшим кабинетом, светлым стилем и базовой меблировкой."
          />
        </label>

        {error ? <div className="inline-error">{error}</div> : null}

        <button
          type="button"
          className="primary-button"
          data-testid="ai-layout-generate"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Генерация…' : 'Сгенерировать планировку'}
        </button>
      </div>
    </div>
  );
}

function getFloorIdForRoom(variant, roomId) {
  return variant.floors.find((floor) => floor.rooms.some((room) => room.id === roomId))?.id ?? variant.activeFloorId;
}

function getSelectionTitle(selection, activeRoom, activeItem, activeCatalogItem) {
  if (activeItem) {
    return getRussianItemLabel(activeCatalogItem ?? activeItem.catalogId);
  }
  if (selection?.kind === 'wall') {
    return `Стена: ${getRussianRoomLabel(activeRoom) || 'комната'}`;
  }
  if (activeRoom) {
    return getRussianRoomLabel(activeRoom);
  }
  return 'Ничего не выбрано';
}

function getSelectionDescription(selection, activeRoom, activeItem, activeCatalogItem, activeRoomIssues) {
  if (activeItem && activeCatalogItem) {
    const footprint = getCatalogItemFootprint(activeItem.catalogId, activeItem.variantTier);
    return `${getRussianItemDescription(activeCatalogItem)} Габариты ${footprint.width.toFixed(1)} × ${footprint.depth.toFixed(1)} м. ${activeItem.locked ? 'Перемещение заблокировано.' : 'Можно перемещать, перекрашивать и менять вариант.'}`;
  }
  if (selection?.kind === 'wall') {
    return 'От этой стены можно достроить соседнюю комнату. RoomForge автоматически добавит связанный дверной проем.';
  }
  if (activeRoom) {
    return `${activeRoom.width} × ${activeRoom.depth} м, предметов: ${activeRoom.items.length}, проверок для комнаты: ${activeRoomIssues.length}.`;
  }
  return 'Выберите комнату, стену или предмет, чтобы увидеть параметры и рекомендации.';
}

function ScenePane({
  mode,
  floor,
  activeRoom,
  issueCount,
  sceneConfig,
  selection,
  onSelectRoom,
  onSelectItem,
  onSelectWall,
  onMoveItem,
  onResizeRoom,
  onAddItem,
  onNudgeItem,
  onClearSelection,
  onOpenWallExpand,
  activeRoomId,
  eyebrow,
  title,
  hints,
}) {
  return (
    <section className="scene-pane">
      <div className="scene-pane-header compact-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="scene-meta">
          <span className="pill">{getRussianFloorLabel(floor)}</span>
          <span className="pill">{activeRoom ? getRussianRoomLabel(activeRoom) : 'Комната не выбрана'}</span>
          <span className={`pill ${issueCount ? 'warning' : 'success'}`}>{issueCount ? `Проверок: ${issueCount}` : 'Проверки пройдены'}</span>
        </div>
      </div>

      <div className="scene-hint-bar">
        {hints[mode].map((hint) => (
          <span key={hint}>{hint}</span>
        ))}
      </div>

      <div className="scene-frame" data-testid="planner-scene-frame">
        {mode === '2d' ? (
          <Planner2D
            floor={floor}
            palette={sceneConfig.style.palette}
            selection={selection}
            onSelectRoom={onSelectRoom}
            onSelectItem={onSelectItem}
            onSelectWall={onSelectWall}
            onMoveItem={onMoveItem}
            onResizeRoom={onResizeRoom}
            onAddItem={onAddItem}
            onNudgeItem={onNudgeItem}
            onClearSelection={onClearSelection}
            onOpenWallExpand={onOpenWallExpand}
            activeRoomId={activeRoomId}
            readOnly={false}
          />
        ) : (
          <PlannerScene
            floor={floor}
            selection={selection}
            palette={sceneConfig.style.palette}
            lighting={sceneConfig.lighting}
            mode={mode}
            onSelectRoom={onSelectRoom}
            onSelectItem={onSelectItem}
            onSelectWall={onSelectWall}
            onMoveItem={onMoveItem}
            onClearSelection={onClearSelection}
            onOpenWallExpand={onOpenWallExpand}
            activeRoomId={activeRoomId}
            readOnly={false}
          />
        )}
      </div>
    </section>
  );
}

function WallComposerModal({ draft, sourceRoom, onChange, onClose, onSubmit }) {
  if (!draft) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <span>Добавить комнату от стены</span>
          <small>{sourceRoom ? `${getRussianRoomLabel(sourceRoom)} • ${draft.wall}` : draft.wall}</small>
        </div>
        <p className="muted-copy">Укажите размеры новой комнаты в метрах. RoomForge пристроит ее вплотную к выбранной стене и соединит центральной дверью.</p>
        <div className="modal-grid">
          <label className="select-field">
            <span>Ширина (м)</span>
            <input
              data-testid="wall-composer-width"
              type="number"
              min="2"
              step="0.1"
              value={draft.width}
              onChange={(event) => onChange('width', event.target.value)}
            />
          </label>
          <label className="select-field">
            <span>Глубина (м)</span>
            <input
              data-testid="wall-composer-depth"
              type="number"
              min="2"
              step="0.1"
              value={draft.depth}
              onChange={(event) => onChange('depth', event.target.value)}
            />
          </label>
        </div>
        <div className="button-row modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="primary-button" data-testid="wall-composer-submit" onClick={onSubmit}>
            Добавить комнату
          </button>
        </div>
      </div>
    </div>
  );
}

function OpeningComposerModal({ draft, sourceRoom, onChange, onClose, onSubmit }) {
  if (!draft || !sourceRoom) {
    return null;
  }

  const isWindow = draft.type === 'window';

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <span>{isWindow ? 'Добавить окно' : 'Добавить дверь'}</span>
          <small>
            {getRussianRoomLabel(sourceRoom)} • {draft.wall}
          </small>
        </div>
        <p className="muted-copy">
          {isWindow
            ? 'Разместите окно вдоль выбранной стены. Ширина и смещение измеряются в метрах по длине стены.'
            : 'Добавьте явный дверной проем на выбранной стене. Ширина и смещение измеряются в метрах по длине стены.'}
        </p>
        <div className="modal-grid">
          <label className="select-field">
            <span>Ширина (м)</span>
            <input
              data-testid="opening-composer-width"
              type="number"
              min={isWindow ? '0.6' : '0.8'}
              step="0.1"
              value={draft.width}
              onChange={(event) => onChange('width', event.target.value)}
            />
          </label>
          <label className="select-field">
            <span>Смещение центра (м)</span>
            <input
              data-testid="opening-composer-offset"
              type="number"
              min="0"
              step="0.1"
              value={draft.offset}
              onChange={(event) => onChange('offset', event.target.value)}
            />
          </label>
        </div>
        <div className="button-row modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="primary-button" data-testid="opening-composer-submit" onClick={onSubmit}>
            {isWindow ? 'Добавить окно' : 'Добавить дверь'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(() => createInitialState());
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [hasExplicitTheme, setHasExplicitTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark';
  });
<<<<<<< Updated upstream
  const [wallComposer, setWallComposer] = useState(null);
  const [openingComposer, setOpeningComposer] = useState(null);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryCategoryId, setLibraryCategoryId] = useState('recommended');
  const [libraryTier, setLibraryTier] = useState('Standard');
  const [recommendedOnly, setRecommendedOnly] = useState(true);
  const [planningMode, setPlanningMode] = useState(DEFAULT_PLANNING_MODE);
  const [businessProfileId, setBusinessProfileId] = useState(BUSINESS_PROFILES[0].id);
  const [businessRoomPlans, setBusinessRoomPlans] = useState({});
  const [businessTasks, setBusinessTasks] = useState(() => cloneBusinessTasks(BUSINESS_PROFILES[0].id));
  const [aiApiKey, setAiApiKey] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem(AI_API_KEY_STORAGE_KEY) ?? '';
  });
  const [rememberAiKey, setRememberAiKey] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(AI_REMEMBER_KEY_STORAGE_KEY) === 'true';
  });
  const [aiModel, setAiModel] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_AI_MODEL;
    }
    return window.localStorage.getItem(AI_MODEL_STORAGE_KEY) ?? DEFAULT_AI_MODEL;
  });
  const [aiPrompt, setAiPrompt] = useState(
    'Сделай удобную квартиру для жизни пары: кухня-гостиная, спальня, рабочее место, входная зона и базовая меблировка.'
  );
  const [aiError, setAiError] = useState('');
  const [isGeneratingAiLayout, setIsGeneratingAiLayout] = useState(false);
=======
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem('roomforge.lang');
  });
  const [commercialArea, setCommercialArea] = useState(48);
>>>>>>> Stashed changes

  const deferredLibraryQuery = useDeferredValue(libraryQuery.trim().toLowerCase());
  const activeVariant = useMemo(() => getVariant(state.project, state.activeVariantId), [state.project, state.activeVariantId]);
  const allRooms = useMemo(() => getAllRooms(activeVariant), [activeVariant]);
  const activeFloor = useMemo(() => getFloor(activeVariant, activeVariant.activeFloorId), [activeVariant]);
  const activeRoom = useMemo(() => {
    if (state.selection?.roomId) {
      return getRoom(activeVariant, state.selection.roomId);
    }
    return activeFloor.rooms[0] ?? null;
  }, [activeFloor, activeVariant, state.selection]);
  const activeItem = useMemo(() => (state.selection?.kind === 'item' ? getItem(activeRoom, state.selection.itemId) : null), [activeRoom, state.selection]);
  const activeCatalogItem = activeItem ? CATALOG_BY_ID[activeItem.catalogId] : null;
  const issues = useMemo(() => runLayoutValidation(activeVariant), [activeVariant]);
  const sceneConfig = useMemo(() => getSceneConfig(activeVariant, themeMode), [activeVariant, themeMode]);
  const projectSummary = useMemo(() => getProjectSummary(state.project, state.activeVariantId), [state.activeVariantId, state.project]);
  const selectionStats = useMemo(() => getSelectionStats(activeVariant, state.selection), [activeVariant, state.selection]);
  const uiTheme = UI_THEME_TOKENS[themeMode];
  const housingTemplates = useMemo(
    () => TEMPLATES.filter((template) => template.propertyType === state.project.propertyType),
    [state.project.propertyType]
  );
  const businessProfile = useMemo(
    () => BUSINESS_PROFILES.find((entry) => entry.id === businessProfileId) ?? BUSINESS_PROFILES[0],
    [businessProfileId]
  );
  const sourceRoomForComposer = useMemo(
    () => (wallComposer ? getRoom(activeVariant, wallComposer.roomId) : null),
    [activeVariant, wallComposer]
  );
  const sourceRoomForOpeningComposer = useMemo(
    () => (openingComposer ? getRoom(activeVariant, openingComposer.roomId) : null),
    [activeVariant, openingComposer]
  );

  const roomRecommendations = useMemo(() => {
    if (!activeRoom) {
      return [];
    }
    return CATALOG_CATEGORIES.filter((category) => category.roomTypes.includes(activeRoom.roomType));
  }, [activeRoom]);
  const activeBusinessRoomPlan = useMemo(
    () => (activeRoom ? getBusinessRoomPlan(activeRoom, businessRoomPlans) : null),
    [activeRoom, businessRoomPlans]
  );
  const activeBusinessRoomMetrics = useMemo(
    () => (activeRoom && activeBusinessRoomPlan ? getBusinessRoomMetrics(activeRoom, activeBusinessRoomPlan, businessProfile) : null),
    [activeBusinessRoomPlan, activeRoom, businessProfile]
  );

  const activeRoomIssues = useMemo(() => {
    if (!activeRoom) {
      return [];
    }
    return issues.filter((issue) => issue.roomId === activeRoom.id || issue.relatedRoomId === activeRoom.id);
  }, [activeRoom, issues]);
  const selectedWallOpenings = useMemo(() => {
    if (state.selection?.kind !== 'wall' || !activeRoom) {
      return { doors: 0, windows: 0 };
    }
    return {
      doors: (activeRoom.openings?.doors ?? []).filter((door) => door.wall === state.selection.wall).length,
      windows: (activeRoom.openings?.windows ?? []).filter((window) => window.wall === state.selection.wall).length,
    };
  }, [activeRoom, state.selection]);

  const floorIssues = useMemo(() => {
    const floorRoomIds = new Set(activeFloor.rooms.map((room) => room.id));
    return issues.filter((issue) => floorRoomIds.has(issue.roomId) || floorRoomIds.has(issue.relatedRoomId));
  }, [activeFloor.rooms, issues]);

  const validationSummary = useMemo(
    () =>
      issues.reduce(
        (summary, issue) => {
          summary[issue.level] = (summary[issue.level] ?? 0) + 1;
          return summary;
        },
        { error: 0, warning: 0 }
      ),
    [issues]
  );

  const libraryItems = useMemo(() => {
    const businessStarterSet = new Set(businessProfile.starterCatalogIds);
    const matchesRecommended = (item) =>
      planningMode === 'business'
        ? businessStarterSet.has(item.id) || (activeRoom ? item.roomTypes.includes(activeRoom.roomType) : true)
        : activeRoom
          ? item.roomTypes.includes(activeRoom.roomType)
          : true;
    const matchesCategory = (item) => {
      if (libraryCategoryId === 'recommended') {
        return matchesRecommended(item);
      }
      return item.categoryId === libraryCategoryId;
    };

    return CATALOG_ITEMS.filter((item) => {
      const text = `${item.label} ${item.description} ${item.family} ${item.categoryLabel}`.toLowerCase();
      if (recommendedOnly && !matchesRecommended(item)) {
        return false;
      }
      if (!matchesCategory(item)) {
        return false;
      }
      if (deferredLibraryQuery && !text.includes(deferredLibraryQuery)) {
        return false;
      }
      return true;
    })
      .sort((left, right) => {
        const recommendationDelta = Number(matchesRecommended(right)) - Number(matchesRecommended(left));
        if (recommendationDelta !== 0) {
          return recommendationDelta;
        }
        if (planningMode === 'business') {
          const businessDelta = Number(businessStarterSet.has(right.id)) - Number(businessStarterSet.has(left.id));
          if (businessDelta !== 0) {
            return businessDelta;
          }
        }
        return left.label.localeCompare(right.label);
      })
      .slice(0, 18);
  }, [activeRoom, businessProfile.starterCatalogIds, deferredLibraryQuery, libraryCategoryId, planningMode, recommendedOnly]);

  const businessMetrics = useMemo(() => {
    const items = allRooms.flatMap((room) => room.items);
    const placedCatalogIds = new Set(items.map((item) => item.catalogId));
    const roomMetrics = allRooms.map((room) => {
      const plan = getBusinessRoomPlan(room, businessRoomPlans);
      return { room, plan, metrics: getBusinessRoomMetrics(room, plan, businessProfile) };
    });
    const totalArea = roomMetrics.reduce((sum, entry) => sum + entry.metrics.roomArea, 0);
    const workingArea = roomMetrics.reduce((sum, entry) => sum + entry.metrics.workingArea, 0);
    const totalStations = roomMetrics.reduce((sum, entry) => sum + entry.metrics.stations, 0);
    const hourlyCapacity = roomMetrics.reduce((sum, entry) => sum + entry.metrics.hourlyCapacity, 0);
    const dailyCapacity = roomMetrics.reduce((sum, entry) => sum + entry.metrics.dailyCapacity, 0);
    const averageEquipmentDensity = roomMetrics.length
      ? roomMetrics.reduce((sum, entry) => sum + entry.metrics.equipmentDensity, 0) / roomMetrics.length
      : 0;
    const completedHours = businessTasks
      .filter((task) => task.status === 'done')
      .reduce((sum, task) => sum + clampNumber(task.hours, 0, 1000), 0);
    const remainingHours = businessTasks
      .filter((task) => task.status !== 'done')
      .reduce((sum, task) => sum + clampNumber(task.hours, 0, 1000), 0);
    const starterCoverageCount = businessProfile.starterCatalogIds.filter((catalogId) => placedCatalogIds.has(catalogId)).length;
    const starterCoverageRatio = businessProfile.starterCatalogIds.length
      ? starterCoverageCount / businessProfile.starterCatalogIds.length
      : 1;
    const missingStarterItems = businessProfile.starterCatalogIds
      .filter((catalogId) => !placedCatalogIds.has(catalogId))
      .map((catalogId) => CATALOG_BY_ID[catalogId])
      .filter(Boolean);
    const workRatio = totalArea ? (workingArea / totalArea) * 100 : 0;
    const requiredZonesMissing = (businessProfile.requiredZones ?? []).filter(
      (zoneId) => !roomMetrics.some((entry) => entry.plan.use === zoneId)
    );
    const overloadedRooms = roomMetrics.filter((entry) => entry.metrics.status === 'danger');
    const underusedRooms = roomMetrics.filter(
      (entry) =>
        entry.metrics.status !== 'danger' &&
        (entry.metrics.equipmentDensity < businessProfile.targetEquipmentDensity - 16 || entry.metrics.zoneRatio < 40) &&
        (entry.plan.use === 'work' || entry.plan.use === 'prep')
    );
    const alerts = [];
    const recommendations = [];

    if (workRatio < businessProfile.targetWorkRatio) {
      alerts.push({
        id: 'work-ratio',
        level: 'warning',
        title: 'Полезная площадь ниже целевой',
        detail: `Сейчас под активную работу выделено ${workRatio.toFixed(0)}%, а для профиля «${businessProfile.label}» желательно около ${businessProfile.targetWorkRatio}%.`,
      });
      recommendations.push('Перенесите больше площади в рабочие или prep-зоны, чтобы помещение сильнее работало на выручку.');
    }
    if (starterCoverageRatio < 0.65) {
      alerts.push({
        id: 'starter-kit',
        level: 'warning',
        title: 'Стартовый комплект еще не собран',
        detail: `Размещено ${starterCoverageCount} из ${businessProfile.starterCatalogIds.length} рекомендованных позиций.`,
      });
      recommendations.push(`Добавьте недостающее оборудование: ${missingStarterItems
        .slice(0, 4)
        .map((item) => getRussianItemLabel(item))
        .join(', ')}.`);
    }
    if (!roomMetrics.some((entry) => entry.plan.use === 'work' || entry.plan.use === 'prep')) {
      alerts.push({
        id: 'zones',
        level: 'warning',
        title: 'Не задана производственная зона',
        detail: 'Отметьте хотя бы одну комнату как рабочую или prep-зону, чтобы метрики пропускной способности были полезны.',
      });
      recommendations.push('Отведите минимум одну комнату под горячую линию или основную сборку заказов.');
    }
    if (requiredZonesMissing.length) {
      recommendations.push(`Добавьте недостающие типы зон: ${requiredZonesMissing.map((zoneId) => getBusinessUseLabel(zoneId)).join(', ')}.`);
    }
    if (overloadedRooms.length) {
      recommendations.push(
        `Разгрузите перегруженные комнаты: ${overloadedRooms
          .slice(0, 3)
          .map((entry) => getRussianRoomLabel(entry.room))
          .join(', ')}.`
      );
    }
    if (underusedRooms.length) {
      recommendations.push(
        `Есть недоиспользованные рабочие зоны: ${underusedRooms
          .slice(0, 3)
          .map((entry) => getRussianRoomLabel(entry.room))
          .join(', ')}. Здесь можно добавить функции или сократить пассивную площадь.`
      );
    }

    const spaceScore = Math.max(
      18,
      Math.min(
        100,
        Math.round(
          starterCoverageRatio * 35 +
            Math.max(0, 34 - Math.abs(workRatio - businessProfile.targetWorkRatio) * 1.4) +
            Math.max(0, 18 - overloadedRooms.length * 6) +
            Math.max(0, 13 - requiredZonesMissing.length * 4)
        )
      )
    );

    return {
      workingArea,
      totalStations,
      hourlyCapacity,
      dailyCapacity,
      averageEquipmentDensity,
      completedHours,
      remainingHours,
      readinessDays: remainingHours / Math.max(1, businessProfile.setupHoursPerDay),
      starterCoverageCount,
      starterCoverageRatio,
      missingStarterItems,
      requiredZonesMissing,
      workRatio,
      spaceScore,
      roomMetrics,
      overloadedRooms,
      underusedRooms,
      recommendations,
      alerts,
    };
  }, [allRooms, businessProfile, businessRoomPlans, businessTasks]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (hasExplicitTheme) {
      return undefined;
    }

    const applySystemTheme = (event) => setThemeMode(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', applySystemTheme);
    return () => mediaQuery.removeEventListener('change', applySystemTheme);
  }, [hasExplicitTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    document.body.style.background = uiTheme.bodyBackground;
    document.body.style.color = uiTheme.text;
  }, [themeMode, uiTheme]);

  useEffect(() => {
    window.localStorage.setItem(AI_REMEMBER_KEY_STORAGE_KEY, String(rememberAiKey));
    if (rememberAiKey) {
      window.localStorage.setItem(AI_API_KEY_STORAGE_KEY, aiApiKey);
      return;
    }
    window.localStorage.removeItem(AI_API_KEY_STORAGE_KEY);
  }, [aiApiKey, rememberAiKey]);

  useEffect(() => {
    window.localStorage.setItem(AI_MODEL_STORAGE_KEY, aiModel || DEFAULT_AI_MODEL);
  }, [aiModel]);

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        propertyType: state.project.propertyType,
        templateId: state.project.templateId,
        activeVariantId: state.activeVariantId,
        activeViewMode: state.activeViewMode,
        activeFloorId: activeVariant.activeFloorId,
        selection: state.selection ?? null,
        counts: {
          floors: activeVariant.floors.length,
          rooms: activeVariant.floors.reduce((sum, floor) => sum + floor.rooms.length, 0),
          items: activeVariant.floors.reduce((sum, floor) => sum + floor.rooms.reduce((roomSum, room) => roomSum + room.items.length, 0), 0),
          issues: issues.length,
        },
      });
    window.advanceTime = (ms = 16) => new Promise((resolve) => window.setTimeout(resolve, ms));
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [activeVariant, issues.length, state]);

  const setTemplateId = (templateId) => {
    if (templateId === 'ai-generated') {
      return;
    }
    setState((current) => setTemplate(current, templateId, state.project.propertyType));
    setWallComposer(null);
    setOpeningComposer(null);
    setAiError('');
  };

  const handlePropertyTypeChange = (propertyType) => {
    const fallbackTemplateId = propertyType === 'house' ? 'house-80' : 'one-bedroom';
    setState((current) => setProjectType(current, propertyType, fallbackTemplateId));
    setWallComposer(null);
    setOpeningComposer(null);
    setAiError('');
    setLibraryCategoryId('recommended');
    setRecommendedOnly(true);
  };

  const handleBusinessProfileChange = (profileId) => {
    setBusinessProfileId(profileId);
    setBusinessRoomPlans({});
    setBusinessTasks(cloneBusinessTasks(profileId));
  };

  const setTheme = (nextThemeMode) => {
    setThemeMode(nextThemeMode);
    setHasExplicitTheme(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
  };

  const focusSelection = (roomId, itemId = null) => {
    setState((current) => {
      const variant = getVariant(current.project, current.activeVariantId);
      const floorId = getFloorIdForRoom(variant, roomId);
      const withFloor = setActiveFloor(current, floorId);
      return {
        ...withFloor,
        selection: itemId ? { kind: 'item', roomId, itemId } : { kind: 'room', roomId },
      };
    });
  };

  const handleSelectRoom = (roomId) => focusSelection(roomId);

  const handleSelectItem = (roomId, itemId) => {
    setState((current) => {
      const isAlreadySelected =
        current.selection?.kind === 'item' && current.selection?.itemId === itemId && current.selection?.roomId === roomId;

      if (isAlreadySelected) {
        const variant = getVariant(current.project, current.activeVariantId);
        const room = getRoom(variant, roomId);
        if (!room) {
          return current;
        }

        const item = room.items.find((entry) => entry.id === itemId);
        if (!item) {
          return current;
        }

        const catalogItem = CATALOG_BY_ID[item.catalogId];
        if (!catalogItem?.variants?.length) {
          return current;
        }

        const currentVariantIndex = catalogItem.variants.findIndex((variantEntry) => variantEntry.id === item.variantId);
        const nextVariant = catalogItem.variants[(currentVariantIndex + 1) % catalogItem.variants.length];
        return replaceSelectedItem(current, { kind: 'item', roomId, itemId }, catalogItem.id, nextVariant.tier);
      }

      const variant = getVariant(current.project, current.activeVariantId);
      const floorId = getFloorIdForRoom(variant, roomId);
      return {
        ...setActiveFloor(current, floorId),
        selection: { kind: 'item', roomId, itemId },
      };
    });
  };

  const handleSelectWall = (roomId, wall) => {
    setState((current) => {
      const variant = getVariant(current.project, current.activeVariantId);
      const floorId = getFloorIdForRoom(variant, roomId);
      return {
        ...setActiveFloor(current, floorId),
        selection: { kind: 'wall', roomId, wall },
      };
    });
  };

  const handleClearSelection = () => {
    setState((current) => clearSelection(current));
    setWallComposer(null);
    setOpeningComposer(null);
  };

  const openWallComposer = (roomId, wall) => {
    handleSelectWall(roomId, wall);
    setOpeningComposer(null);
    setWallComposer({ roomId, wall, width: '4', depth: '4' });
  };

  const openOpeningComposer = (roomId, wall, type) => {
    handleSelectWall(roomId, wall);
    setWallComposer(null);
    const room = getRoom(activeVariant, roomId);
    const span = wall === 'north' || wall === 'south' ? room?.width ?? 4 : room?.depth ?? 4;
    setOpeningComposer({
      roomId,
      wall,
      type,
      width: type === 'window' ? '1.8' : '1',
      offset: (span / 2).toFixed(1),
    });
  };

  const submitWallComposer = () => {
    const width = Number(wallComposer?.width);
    const depth = Number(wallComposer?.depth);
    if (!wallComposer || !Number.isFinite(width) || !Number.isFinite(depth) || width < 2 || depth < 2) {
      return;
    }

    setState((current) => addRoomFromWall(current, wallComposer.roomId, wallComposer.wall, width, depth));
    setWallComposer(null);
  };

  const submitOpeningComposer = () => {
    const width = Number(openingComposer?.width);
    const offset = Number(openingComposer?.offset);
    if (!openingComposer || !Number.isFinite(width) || !Number.isFinite(offset) || width <= 0) {
      return;
    }

    setState((current) =>
      addOpeningToWall(current, openingComposer.roomId, openingComposer.wall, openingComposer.type, width, offset)
    );
    setOpeningComposer(null);
  };

  const addLibraryItem = (catalogId) => {
    if (!activeRoom) {
      return;
    }
    setState((current) => addItemToRoom(current, activeRoom.id, catalogId, libraryTier, undefined, undefined));
  };

  const nudgeItem = (roomId, itemId, deltaX, deltaZ) => {
    setState((current) => {
      const variant = getVariant(current.project, current.activeVariantId);
      const room = getRoom(variant, roomId);
      const item = getItem(room, itemId);
      if (!room || !item) {
        return current;
      }
      return moveItem(current, roomId, itemId, item.x + deltaX, item.z + deltaZ);
    });
  };

  const nudgeSelectedItem = (deltaX, deltaZ) => {
    if (!activeRoom || !activeItem) {
      return;
    }
    nudgeItem(activeRoom.id, activeItem.id, deltaX, deltaZ);
  };

  const updateBusinessRoomPlan = (roomId, patch) => {
    setBusinessRoomPlans((current) => ({
      ...current,
      [roomId]: {
        ...(current[roomId] ?? {}),
        ...patch,
      },
    }));
  };

  const updateBusinessTask = (taskId, patch) => {
    setBusinessTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  };

  const addBusinessTask = () => {
    setBusinessTasks((current) => [
      ...current,
      {
        id: createBusinessTaskId(),
        title: 'Новая задача запуска',
        hours: 2,
        owner: 'Операционный менеджер',
        notes: '',
        status: 'todo',
      },
    ]);
  };

  const removeBusinessTask = (taskId) => {
    setBusinessTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const handleGenerateAiLayout = async () => {
    setAiError('');
    setIsGeneratingAiLayout(true);

    try {
      const layout = await requestAiLayout({
        apiKey: aiApiKey,
        prompt: aiPrompt,
        model: aiModel || DEFAULT_AI_MODEL,
      });

      setState((current) => createStateFromAiLayout(current, layout));
      setWallComposer(null);
      setOpeningComposer(null);
      setLibraryCategoryId('recommended');
      setRecommendedOnly(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось сгенерировать AI-планировку.');
    } finally {
      setIsGeneratingAiLayout(false);
    }
  };

  const workspaceTemplateOptions =
    state.project.templateId === AI_TEMPLATE_OPTION.value
      ? [AI_TEMPLATE_OPTION, ...housingTemplates.map((template) => ({ value: template.id, label: getRussianTemplateLabel(template) }))]
      : housingTemplates.map((template) => ({ value: template.id, label: getRussianTemplateLabel(template) }));

  if (!lang) {
    return (
      <div className="app-shell theme-shell" data-theme={themeMode}>
        <div style={{ position: 'fixed', inset: 0, background: uiTheme.panelOverlay, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '400px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Choose Language</h1>
            <h1 style={{ marginBottom: '2rem', color: uiTheme.subtle }}>Выберите язык</h1>
            <div className="button-row" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button className="pill active" onClick={() => { setLang('en'); window.localStorage.setItem('roomforge.lang', 'en'); }}>English</button>
              <button className="pill active" onClick={() => { setLang('ru'); window.localStorage.setItem('roomforge.lang', 'ru'); }}>Русский</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell theme-shell"
      data-theme={themeMode}
      style={{
        '--panel': sceneConfig.style.palette.panel,
        '--panel-soft': sceneConfig.style.palette.panelSoft,
        '--accent': sceneConfig.style.palette.accent,
        '--line': sceneConfig.style.palette.line,
        '--background': sceneConfig.style.palette.background,
        '--body-background': uiTheme.bodyBackground,
        '--text-primary': uiTheme.text,
        '--text-muted': uiTheme.muted,
        '--text-subtle': uiTheme.subtle,
        '--panel-border': uiTheme.panelBorder,
        '--panel-overlay': uiTheme.panelOverlay,
        '--shadow': uiTheme.panelShadow,
        '--frame-background': uiTheme.frameBackground,
        '--control-background': uiTheme.controlBackground,
        '--control-hover': uiTheme.controlHover,
        '--control-active': uiTheme.controlActive,
        '--control-active-border': uiTheme.controlActiveBorder,
        '--card-background': uiTheme.cardBackground,
        '--inset-background': uiTheme.insetBackground,
        '--success-background': uiTheme.successBackground,
        '--danger-background': uiTheme.dangerBackground,
        '--danger-text': uiTheme.dangerText,
        '--swatch-ring': uiTheme.swatchRing,
        '--scene-overlay-bg': uiTheme.sceneOverlayBg,
        '--scene-overlay-bg-active': uiTheme.sceneOverlayBgActive,
        '--scene-overlay-border': uiTheme.sceneOverlayBorder,
        '--scene-overlay-text': uiTheme.sceneOverlayText,
        '--scene-overlay-muted': uiTheme.sceneOverlayMuted,
        '--scene-grid': sceneConfig.style.palette.grid,
        '--scene-room-fill': sceneConfig.style.palette.roomFill,
        '--scene-room-stroke': sceneConfig.style.palette.roomStroke,
        '--scene-highlight': sceneConfig.style.palette.highlight,
      }}
    >
      <aside className="left-rail">
        <div className="panel hero-panel compact-panel">
          <p className="eyebrow">RoomForge</p>
          <h1>{planningMode === 'business' ? 'Планировщик бизнеса' : 'Планировщик жилья'}</h1>
          <p className="lede">
            {planningMode === 'business'
              ? 'Соберите помещение под запуск: разметьте зоны, поставьте оборудование, оцените полезную площадь, плотность и скорость обслуживания.'
              : 'Проектируйте жилье на сетке, проверяйте его в изометрии и наращивайте планировку комната за комнатой в одном состоянии проекта.'}
          </p>
        </div>

        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Сценарий проекта</span>
            <small>{projectSummary.floors} этаж(а)</small>
          </div>
<<<<<<< Updated upstream
          <div className="theme-toggle-row">
            <button type="button" className={`filter-chip ${planningMode === 'room' ? 'active' : ''}`} onClick={() => setPlanningMode('room')}>
              Для жилья
            </button>
            <button
              type="button"
              className={`filter-chip ${planningMode === 'business' ? 'active' : ''}`}
              onClick={() => setPlanningMode('business')}
            >
              Для бизнеса
            </button>
=======
          <div className="segment-group">
            {PROPERTY_TYPES.map((type) => (
              <SegmentButton
                key={type.id}
                active={state.project.propertyType === type.id}
                onClick={() =>
                  setState((current) =>
                    setTemplate(current, type.id === 'house' ? 'house-80' : type.id === 'commercial' ? 'vegetable-shop' : 'one-bedroom', type.id)
                  )
                }
              >
                {type.label}
              </SegmentButton>
            ))}
>>>>>>> Stashed changes
          </div>
          <div className="control-stack">
            {planningMode === 'business' ? (
              <SelectField
                label="Формат бизнеса"
                testId="workspace-business-profile-select"
                value={businessProfile.id}
                onChange={handleBusinessProfileChange}
                options={BUSINESS_PROFILES.map((profile) => ({ value: profile.id, label: profile.label }))}
              />
            ) : (
              <SelectField
                label="Тип объекта"
                testId="workspace-property-type-select"
                value={state.project.propertyType}
                onChange={handlePropertyTypeChange}
                options={PROPERTY_TYPES.map((type) => ({ value: type.id, label: getRussianPropertyTypeLabel(type) }))}
              />
            )}
            <SelectField
              label="Шаблон"
              testId="workspace-template-select"
              value={state.project.templateId}
              onChange={setTemplateId}
              options={workspaceTemplateOptions}
            />
            <SelectField
              label="Этаж"
              testId="workspace-floor-select"
              value={activeFloor.id}
              onChange={(value) => setState((current) => setActiveFloor(current, value))}
              options={activeVariant.floors.map((floor) => ({ value: floor.id, label: getRussianFloorLabel(floor) }))}
            />
            <SelectField
              label="Вид"
              testId="workspace-view-select"
              value={state.activeViewMode}
              onChange={(value) => setState((current) => ({ ...current, activeViewMode: value }))}
              options={[
                { value: '2d', label: '2D' },
                { value: 'isometric', label: 'Изометрия' },
              ]}
            />
          </div>
        </div>

<<<<<<< Updated upstream
        {planningMode === 'room' && (
          <AiPlannerPanel
            apiKey={aiApiKey}
            onApiKeyChange={setAiApiKey}
            rememberKey={rememberAiKey}
            onRememberKeyChange={setRememberAiKey}
            model={aiModel}
            onModelChange={setAiModel}
            prompt={aiPrompt}
            onPromptChange={setAiPrompt}
            onGenerate={handleGenerateAiLayout}
            isGenerating={isGeneratingAiLayout}
            error={aiError}
          />
        )}
=======
        {state.project.templateId === 'vegetable-shop' && (
          <div className={`panel ${isMobileLayout && mobileTab === 'library' ? 'mobile-hidden' : ''}`}>
            <div className="panel-header compact">
              <span>Shop Area ({commercialArea} m²)</span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="2"
              value={commercialArea}
              onChange={(e) => {
                const newArea = parseInt(e.target.value, 10);
                setCommercialArea(newArea);
                setState((current) => setTemplate(current, 'vegetable-shop', 'commercial', { area: newArea }));
              }}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <p className="muted-copy" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              Adjusting area will procedurally regenerate the shop layout.
            </p>
          </div>
        )}

        <div className={`panel ${isMobileLayout && mobileTab === 'library' ? 'mobile-hidden' : ''}`}>
          <div className="panel-header">
            <span>View Mode</span>
          </div>
          <div className="segment-group">
            {['2d', 'isometric'].map((mode) => (
              <SegmentButton key={mode} active={state.activeViewMode === mode} onClick={() => setState((current) => ({ ...current, activeViewMode: mode }))}>
                {mode === '2d' ? '2D' : 'Isometric'}
              </SegmentButton>
            ))}
          </div>
        </div>
>>>>>>> Stashed changes

        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Навигатор плана</span>
            <small>{activeFloor.rooms.length} комнат(ы) на этаже</small>
          </div>
          <div className="floor-chip-row">
            {activeVariant.floors.map((floor) => (
              <button
                key={floor.id}
                type="button"
                className={`filter-chip ${floor.id === activeFloor.id ? 'active' : ''}`}
                data-testid={`floor-chip-${floor.id}`}
                onClick={() => setState((current) => setActiveFloor(current, floor.id))}
              >
                {getRussianFloorLabel(floor)}
              </button>
            ))}
          </div>
          <div className="room-nav-grid">
            {activeFloor.rooms.map((room) => {
              const roomIssueCount = issues.filter((issue) => issue.roomId === room.id || issue.relatedRoomId === room.id).length;
              const isActive = state.selection?.roomId === room.id || activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`room-nav-card ${isActive ? 'active' : ''}`}
                  data-testid={`room-nav-${room.id}`}
                  onClick={() => handleSelectRoom(room.id)}
                >
                  <strong>{getRussianRoomLabel(room)}</strong>
                  <small>
                    {formatArea(getRoomArea(room))} м² • {room.items.length} предметов
                  </small>
                  <span className={`room-nav-status ${roomIssueCount ? 'warning' : 'success'}`}>{roomIssueCount ? `${roomIssueCount} проверок` : 'OK'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Визуальный режим</span>
            <small>Тема, стиль, свет</small>
          </div>
          <div className="theme-toggle-row">
            {['light', 'dark'].map((option) => (
              <button
                key={option}
                type="button"
                className={`filter-chip ${themeMode === option ? 'active' : ''}`}
                data-testid={`theme-toggle-${option}`}
                onClick={() => setTheme(option)}
              >
                {option === 'light' ? 'Светлая тема' : 'Темная тема'}
              </button>
            ))}
          </div>
          <div className="control-stack">
            <SelectField
              label="Стиль"
              testId="workspace-style-select"
              value={activeVariant.stylePresetId}
              onChange={(value) => setState((current) => setVariantStyle(current, value))}
              options={STYLE_PRESETS.map((preset) => ({ value: preset.id, label: getRussianStyleLabel(preset) }))}
            />
            <SelectField
              label="Освещение"
              testId="workspace-lighting-select"
              value={activeVariant.lightingScenarioId}
              onChange={(value) => setState((current) => setVariantLighting(current, value))}
              options={LIGHTING_SCENARIOS.map((scenario) => ({ value: scenario.id, label: getRussianLightingLabel(scenario) }))}
            />
          </div>
        </div>

        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Сводка проекта</span>
          </div>
          <div className="stats-grid">
            <div>
              <strong>{formatArea(planningMode === 'business' ? businessMetrics.workingArea : projectSummary.totalArea)} м²</strong>
              <small>{planningMode === 'business' ? 'Полезная площадь' : 'Общая площадь'}</small>
            </div>
            <div>
              <strong>{planningMode === 'business' ? businessMetrics.totalStations : projectSummary.rooms}</strong>
              <small>{planningMode === 'business' ? 'Рабочие позиции' : 'Комнаты'}</small>
            </div>
            <div>
              <strong>{planningMode === 'business' ? businessMetrics.hourlyCapacity.toFixed(1) : projectSummary.items}</strong>
              <small>{planningMode === 'business' ? 'Пропускная способность / час' : 'Предметы'}</small>
            </div>
            <div>
              <strong>{planningMode === 'business' ? formatHours(businessMetrics.remainingHours) : issues.length}</strong>
              <small>{planningMode === 'business' ? 'До запуска осталось' : 'Замечания по планировке'}</small>
            </div>
          </div>
          <div className="summary-caption">
            {planningMode === 'business'
              ? `Для формата «${businessProfile.label}» активная бизнес-площадь составляет ${businessMetrics.workRatio.toFixed(0)}%, а комплект запуска закрыт на ${Math.round(
                  businessMetrics.starterCoverageRatio * 100
                )}%.`
              : `${getRussianTemplateLabel(TEMPLATES.find((template) => template.id === state.project.templateId) ?? { label: projectSummary.variant })}: в проекте ${projectSummary.rooms} комнат и ${projectSummary.items} расставленных предметов.`}
          </div>
        </div>

        <PlannerLibrary
          activeRoom={activeRoom}
          catalogCategories={planningMode === 'business' ? CATALOG_CATEGORIES : roomRecommendations.length ? roomRecommendations : CATALOG_CATEGORIES}
          filteredItems={libraryItems}
          categoryId={libraryCategoryId}
          onCategoryChange={setLibraryCategoryId}
          query={libraryQuery}
          onQueryChange={setLibraryQuery}
          tier={libraryTier}
          onTierChange={setLibraryTier}
          recommendedOnly={recommendedOnly}
          onRecommendedOnlyChange={setRecommendedOnly}
          onAddItem={addLibraryItem}
          title={planningMode === 'business' ? 'Библиотека запуска' : 'Библиотека мебели'}
          subtitle={
            planningMode === 'business'
              ? activeRoom
                ? `${businessProfile.label}: рекомендации для комнаты «${getRussianRoomLabel(activeRoom)}»`
                : 'Выберите комнату, чтобы начать зонирование бизнеса'
              : undefined
          }
          searchPlaceholder={
            planningMode === 'business'
              ? 'Поиск оборудования, хранения, выдачи или сервисных узлов'
              : 'Поиск мебели, декора и инженерии'
          }
          addButtonLabel={planningMode === 'business' && activeRoom ? `Поставить в «${getRussianRoomLabel(activeRoom)}»` : undefined}
        />
      </aside>

      <main className="main-stage">
        <ScenePane
          mode={state.activeViewMode}
          floor={activeFloor}
          activeRoom={activeRoom}
          issueCount={floorIssues.length}
          sceneConfig={sceneConfig}
          selection={state.selection}
          onSelectRoom={handleSelectRoom}
          onSelectItem={handleSelectItem}
          onSelectWall={handleSelectWall}
          onMoveItem={(roomId, itemId, x, z) => setState((current) => moveItem(current, roomId, itemId, x, z))}
          onResizeRoom={(roomId, nextRect) => setState((current) => resizeRoom(current, roomId, nextRect))}
          onAddItem={(roomId, catalogId, tier, x, z) => setState((current) => addItemToRoom(current, roomId, catalogId, tier, x, z))}
          onNudgeItem={nudgeItem}
          onClearSelection={handleClearSelection}
          onOpenWallExpand={openWallComposer}
          activeRoomId={state.selection?.roomId ?? activeFloor.rooms[0]?.id}
          eyebrow={planningMode === 'business' ? `${businessProfile.label} · рабочий сценарий` : 'Планировщик жилья'}
          title={planningMode === 'business' ? 'Планировка под запуск' : 'Текущая планировка'}
          hints={planningMode === 'business' ? BUSINESS_MODE_HINTS : MODE_HINTS}
        />
      </main>

      <aside className="right-rail">
        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Выделение</span>
            <small>{state.selection?.kind ?? 'ничего'}</small>
          </div>
          <h3>{getSelectionTitle(state.selection, activeRoom, activeItem, activeCatalogItem)}</h3>
          <p className="muted-copy">{getSelectionDescription(state.selection, activeRoom, activeItem, activeCatalogItem, activeRoomIssues)}</p>

          {activeRoom ? (
            <div className="detail-grid">
              <div>
                <strong>{formatArea(getRoomArea(activeRoom))} м²</strong>
                <small>Площадь комнаты</small>
              </div>
              <div>
                <strong>{activeRoom.items.length}</strong>
                <small>Расставлено предметов</small>
              </div>
              <div>
                <strong>{(activeRoom.openings?.doors ?? []).length}</strong>
                <small>Двери</small>
              </div>
              <div>
                <strong>{(activeRoom.openings?.windows ?? []).length}</strong>
                <small>Окна</small>
              </div>
              <div>
                <strong>{activeRoomIssues.length}</strong>
                <small>Проверки по комнате</small>
              </div>
            </div>
          ) : (
            <div className="empty-panel">
              <strong>Начните с комнаты</strong>
              <p>Выберите помещение в навигаторе, затем добавляйте предметы из библиотеки или расширяйте планировку через стены.</p>
            </div>
          )}
        </div>

        {planningMode === 'business' && (
          <>
            <div className="panel compact-panel">
              <div className="panel-header">
                <span>Готовность бизнеса</span>
                <small>{businessProfile.label}</small>
              </div>
              <div className="detail-grid compact">
                <div>
                  <strong>{formatArea(businessMetrics.workingArea)} м²</strong>
                  <small>Полезная площадь</small>
                </div>
                <div>
                  <strong>{businessMetrics.hourlyCapacity.toFixed(1)}</strong>
                  <small>Пропускная способность / час</small>
                </div>
                <div>
                  <strong>{businessMetrics.dailyCapacity.toFixed(0)}</strong>
                  <small>Пропускная способность / день</small>
                </div>
                <div>
                  <strong>{businessMetrics.readinessDays.toFixed(1)} д</strong>
                  <small>Оценка времени до запуска</small>
                </div>
              </div>
              <p className="muted-copy">
                {businessProfile.description} Сейчас размещено {businessMetrics.starterCoverageCount} из {businessProfile.starterCatalogIds.length} рекомендованных элементов запуска.
              </p>
              {businessMetrics.missingStarterItems.length ? (
                <div className="helper-list">
                  <strong>Еще стоит добавить</strong>
                  <span>{businessMetrics.missingStarterItems.slice(0, 6).map((item) => getRussianItemLabel(item)).join(', ')}</span>
                </div>
              ) : (
                <div className="issue-card success">
                  <strong>Комплект запуска собран</strong>
                  <small>Текущая расстановка уже закрывает базовые стартовые потребности этого формата бизнеса.</small>
                </div>
              )}
              {businessMetrics.alerts.length ? (
                <div className="issue-list">
                  {businessMetrics.alerts.map((alert) => (
                    <div key={alert.id} className={`issue-card ${alert.level}`}>
                      <strong>{alert.title}</strong>
                      <small>{alert.detail}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="panel compact-panel">
              <div className="panel-header">
                <span>Эффективность пространства</span>
                <small>{businessMetrics.spaceScore}/100</small>
              </div>
              <div className="detail-grid compact">
                <div>
                  <strong>{businessMetrics.spaceScore}/100</strong>
                  <small>Общая оценка использования</small>
                </div>
                <div>
                  <strong>{formatPercent(businessMetrics.averageEquipmentDensity)}</strong>
                  <small>Средняя плотность оборудования</small>
                </div>
                <div>
                  <strong>{businessMetrics.overloadedRooms.length}</strong>
                  <small>Перегруженные комнаты</small>
                </div>
                <div>
                  <strong>{businessMetrics.underusedRooms.length}</strong>
                  <small>Недоиспользованные зоны</small>
                </div>
              </div>
              {businessMetrics.recommendations.length ? (
                <div className="issue-list">
                  {businessMetrics.recommendations.slice(0, 5).map((recommendation) => (
                    <div key={recommendation} className="issue-card">
                      <strong>Рекомендация</strong>
                      <small>{recommendation}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="issue-card success">
                  <strong>Пространство используется хорошо</strong>
                  <small>Баланс зон, плотность оборудования и комплект запуска сейчас выглядят устойчиво.</small>
                </div>
              )}
            </div>

            {activeRoom && activeBusinessRoomPlan && activeBusinessRoomMetrics && (
              <div className="panel compact-panel">
                <div className="panel-header">
                  <span>Операции по комнате</span>
                  <small>{getRussianRoomLabel(activeRoom)}</small>
                </div>
                <div className="control-stack">
                  <SelectField
                    label="Тип зоны"
                    testId="business-room-use-select"
                    value={activeBusinessRoomPlan.use}
                    onChange={(value) => updateBusinessRoomPlan(activeRoom.id, { use: value })}
                    options={BUSINESS_ROOM_USE_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                  />
                  <label className="select-field">
                    <span>Доля рабочей площади (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={activeBusinessRoomPlan.workAreaShare}
                      onChange={(event) => updateBusinessRoomPlan(activeRoom.id, { workAreaShare: clampNumber(event.target.value, 0, 100) })}
                    />
                  </label>
                  <label className="select-field">
                    <span>Рабочие позиции</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={activeBusinessRoomPlan.stations}
                      onChange={(event) => updateBusinessRoomPlan(activeRoom.id, { stations: clampNumber(event.target.value, 0, 999) })}
                    />
                  </label>
                  <label className="select-field">
                    <span>Цикл на одну позицию (мин)</span>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={activeBusinessRoomPlan.cycleMinutes}
                      onChange={(event) => updateBusinessRoomPlan(activeRoom.id, { cycleMinutes: clampNumber(event.target.value, 5, 480) })}
                    />
                  </label>
                  <label className="select-field">
                    <span>Коэффициент скорости (%)</span>
                    <input
                      type="number"
                      min="25"
                      max="250"
                      step="5"
                      value={activeBusinessRoomPlan.speedPercent}
                      onChange={(event) => updateBusinessRoomPlan(activeRoom.id, { speedPercent: clampNumber(event.target.value, 25, 250) })}
                    />
                  </label>
                  <label className="select-field">
                    <span>Как работает эта комната</span>
                    <textarea
                      rows={3}
                      value={activeBusinessRoomPlan.notes}
                      onChange={(event) => updateBusinessRoomPlan(activeRoom.id, { notes: event.target.value })}
                      placeholder="Опишите правило: кто здесь работает, что хранится и как движутся сотрудники или клиенты."
                    />
                  </label>
                </div>
                <div className="detail-grid compact">
                  <div>
                    <strong>{formatArea(activeBusinessRoomMetrics.workingArea)} м²</strong>
                    <small>Полезная рабочая площадь</small>
                  </div>
                  <div>
                    <strong>{activeBusinessRoomMetrics.stations}</strong>
                    <small>Позиции</small>
                  </div>
                  <div>
                    <strong>{activeBusinessRoomMetrics.hourlyCapacity.toFixed(1)}</strong>
                    <small>Пропускная способность / час</small>
                  </div>
                  <div>
                    <strong>{activeBusinessRoomMetrics.dailyCapacity.toFixed(0)}</strong>
                    <small>Пропускная способность / день</small>
                  </div>
                  <div>
                    <strong>{formatPercent(activeBusinessRoomMetrics.equipmentDensity)}</strong>
                    <small>Плотность оборудования</small>
                  </div>
                  <div>
                    <strong>{formatArea(activeBusinessRoomMetrics.freeArea)} м²</strong>
                    <small>Свободная площадь</small>
                  </div>
                  <div>
                    <strong>{activeBusinessRoomMetrics.areaPerStation ? formatArea(activeBusinessRoomMetrics.areaPerStation) : '0.00'} м²</strong>
                    <small>Площадь на одну позицию</small>
                  </div>
                  <div>
                    <strong>{activeBusinessRoomMetrics.utilizationScore}/100</strong>
                    <small>Оценка этой комнаты</small>
                  </div>
                </div>
                {activeBusinessRoomMetrics.recommendations.length ? (
                  <div className="issue-list">
                    {activeBusinessRoomMetrics.recommendations.map((recommendation) => (
                      <div key={recommendation} className={`issue-card ${activeBusinessRoomMetrics.status === 'danger' ? 'error' : 'warning'}`}>
                        <strong>Как улучшить</strong>
                        <small>{recommendation}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="issue-card success">
                    <strong>Комната использована рационально</strong>
                    <small>По плотности оборудования и рабочей доле эта зона выглядит сбалансированной.</small>
                  </div>
                )}
              </div>
            )}

            <div className="panel compact-panel">
              <div className="panel-header">
                <span>План запуска</span>
                <small>Осталось: {formatHours(businessMetrics.remainingHours)}</small>
              </div>
              <div className="inline-summary">
                <span>Сделано: {formatHours(businessMetrics.completedHours)}</span>
                <span>План: {businessProfile.setupHoursPerDay} ч подготовки в день</span>
              </div>
              <div className="business-task-list">
                {businessTasks.map((task) => (
                  <article key={task.id} className="business-task-card">
                    <div className="task-row">
                      <label className="select-field task-field grow">
                        <span>Задача</span>
                        <input value={task.title} onChange={(event) => updateBusinessTask(task.id, { title: event.target.value })} />
                      </label>
                      <label className="select-field task-field short">
                        <span>Часы</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={task.hours}
                          onChange={(event) => updateBusinessTask(task.id, { hours: clampNumber(event.target.value, 0, 1000) })}
                        />
                      </label>
                    </div>
                    <div className="task-row">
                      <label className="select-field task-field grow">
                        <span>Ответственный</span>
                        <input value={task.owner} onChange={(event) => updateBusinessTask(task.id, { owner: event.target.value })} />
                      </label>
                      <SelectField
                        label="Статус"
                        value={task.status}
                        onChange={(value) => updateBusinessTask(task.id, { status: value })}
                        options={TASK_STATUS_OPTIONS}
                      />
                    </div>
                    <label className="select-field">
                      <span>Комментарий по задаче</span>
                      <textarea
                        rows={2}
                        value={task.notes}
                        onChange={(event) => updateBusinessTask(task.id, { notes: event.target.value })}
                        placeholder="Уточните зависимость, критерий готовности или операционную пометку."
                      />
                    </label>
                    <div className="button-row">
                      <button type="button" className="ghost-button danger" onClick={() => removeBusinessTask(task.id)}>
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="button-row">
                <button type="button" className="primary-button" onClick={addBusinessTask}>
                  Добавить задачу
                </button>
              </div>
            </div>
          </>
        )}

        {activeItem && activeCatalogItem && (
          <>
            <div className="panel compact-panel">
              <div className="panel-header">
                <span>Управление предметом</span>
                <small>{activeItem.variantTier}</small>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  data-testid="selection-rotate"
                  onClick={() => setState((current) => rotateSelectedItem(current, current.selection))}
                >
                  Повернуть
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  data-testid="selection-duplicate"
                  onClick={() => setState((current) => duplicateSelectedItem(current, current.selection))}
                >
                  Дублировать
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  data-testid="selection-lock"
                  onClick={() => setState((current) => toggleLockSelectedItem(current, current.selection))}
                >
                  {activeItem.locked ? 'Разблокировать' : 'Заблокировать'}
                </button>
                <button
                  type="button"
                  className="ghost-button danger"
                  data-testid="selection-delete"
                  onClick={() => setState((current) => deleteSelectedItem(current, current.selection))}
                >
                  Удалить
                </button>
              </div>

              <div className="inline-summary">
                <span>Совпадающих предметов в проекте: {selectionStats.selectedCount}</span>
                <span>Всего размещено: {selectionStats.totalItems}</span>
              </div>

              <div className="panel-header compact">
                <span>Пошаговое перемещение</span>
                <small>Удобно для телефона и точной подстройки</small>
              </div>
              <div className="nudge-pad" data-testid="selection-nudge-pad">
                <div />
                <button type="button" className="ghost-button nudge-button" onClick={() => nudgeSelectedItem(0, -1)}>
                  ↑
                </button>
                <div />
                <button type="button" className="ghost-button nudge-button" onClick={() => nudgeSelectedItem(-1, 0)}>
                  ←
                </button>
                <div className="nudge-center">1 клетка</div>
                <button type="button" className="ghost-button nudge-button" onClick={() => nudgeSelectedItem(1, 0)}>
                  →
                </button>
                <div />
                <button type="button" className="ghost-button nudge-button" onClick={() => nudgeSelectedItem(0, 1)}>
                  ↓
                </button>
                <div />
              </div>

              <div className="panel-header compact">
                <span>Цвет</span>
              </div>
              <div className="swatch-grid">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch ${activeItem.color === color ? 'active' : ''}`}
                    style={{ background: color }}
                    data-testid={`swatch-${color.replace('#', '')}`}
                    onClick={() => setState((current) => recolorSelectedItem(current, current.selection, color))}
                  />
                ))}
              </div>
            </div>

            <div className="panel compact-panel">
              <div className="panel-header">
                <span>Варианты</span>
                <small>Нажмите на тот же предмет в сцене, чтобы переключать версии</small>
              </div>
              <div className="replacement-grid">
                {activeCatalogItem.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`replacement-card ${variant.id === activeItem.variantId ? 'active' : ''}`}
                    onClick={() => setState((current) => replaceSelectedItem(current, current.selection, activeCatalogItem.id, variant.tier))}
                  >
                    <strong>{variant.label}</strong>
                    <small>{variant.tier}</small>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {state.selection?.kind === 'wall' && activeRoom && (
          <div className="panel compact-panel">
            <div className="panel-header">
              <span>Действия со стеной</span>
              <small>{state.selection.wall}</small>
            </div>
            <p className="muted-copy">Эту стену можно использовать для расширения плана или добавления проемов. Новые двери и окна автоматически останутся в пределах длины стены.</p>
            <div className="detail-grid compact">
              <div>
                <strong>{selectedWallOpenings.doors}</strong>
                <small>Двери на стене</small>
              </div>
              <div>
                <strong>{selectedWallOpenings.windows}</strong>
                <small>Окна на стене</small>
              </div>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                data-testid="wall-action-expand"
                onClick={() => openWallComposer(activeRoom.id, state.selection.wall)}
              >
                Добавить соседнюю комнату
              </button>
              <button
                type="button"
                className="ghost-button"
                data-testid="wall-action-door"
                onClick={() => openOpeningComposer(activeRoom.id, state.selection.wall, 'door')}
              >
                Добавить дверь
              </button>
              <button
                type="button"
                className="ghost-button"
                data-testid="wall-action-window"
                onClick={() => openOpeningComposer(activeRoom.id, state.selection.wall, 'window')}
              >
                Добавить окно
              </button>
            </div>
          </div>
        )}

        <div className="panel compact-panel">
          <div className="panel-header">
            <span>Проверка планировки</span>
            <small>
              {validationSummary.error} ошибок • {validationSummary.warning} предупреждений
            </small>
          </div>

          {issues.length ? (
            <>
              <div className="detail-grid compact">
                <div>
                  <strong>{validationSummary.error}</strong>
                  <small>Ошибки</small>
                </div>
                <div>
                  <strong>{validationSummary.warning}</strong>
                  <small>Предупреждения</small>
                </div>
                <div>
                  <strong>{activeRoomIssues.length}</strong>
                  <small>В текущей комнате</small>
                </div>
                <div>
                  <strong>{floorIssues.length}</strong>
                  <small>На текущем этаже</small>
                </div>
              </div>
              <div className="issue-list">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className={`issue-card issue-card-button ${issue.level}`}
                    data-testid={`issue-card-${issue.id}`}
                    onClick={() => focusSelection(issue.roomId, issue.itemId ?? null)}
                  >
                    <strong>{issue.label}</strong>
                    <small>{issue.detail ?? issue.roomId}</small>
                    <span>{issue.suggestion ?? 'Проверьте это условие прямо в планировщике.'}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="issue-card success">
              <strong>Блокирующих проблем не найдено</strong>
              <small>Текущая планировка проходит встроенные проверки по проходам, дверным зонам, дистанции просмотра и пересечениям комнат.</small>
            </div>
          )}
        </div>
      </aside>

      <WallComposerModal
        draft={wallComposer}
        sourceRoom={sourceRoomForComposer}
        onChange={(field, value) => setWallComposer((current) => (current ? { ...current, [field]: value } : current))}
        onClose={() => setWallComposer(null)}
        onSubmit={submitWallComposer}
      />
      <OpeningComposerModal
        draft={openingComposer}
        sourceRoom={sourceRoomForOpeningComposer}
        onChange={(field, value) => setOpeningComposer((current) => (current ? { ...current, [field]: value } : current))}
        onClose={() => setOpeningComposer(null)}
        onSubmit={submitOpeningComposer}
      />
    </div>
  );
}
