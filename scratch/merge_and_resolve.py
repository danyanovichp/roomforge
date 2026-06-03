import os

# Define paths
main_dir = "/Users/danyanovich/code projects/RoomForge"
untitled_dir = "/Users/danyanovich/code projects/RoomForge/Untitled/roomforge"
bf_dir = "/Users/danyanovich/code projects/BusinessForge"

# Define target files to copy/modify
app_jsx_path = os.path.join(main_dir, "src/App.jsx")
planner_scene_path = os.path.join(main_dir, "src/components/PlannerScene.jsx")
planner_data_path = os.path.join(main_dir, "src/data/plannerData.js")
planner_js_path = os.path.join(main_dir, "src/lib/planner.js")
russian_js_path = os.path.join(main_dir, "src/lib/russian.js")
index_css_path = os.path.join(main_dir, "src/index.css")
planner_library_path = os.path.join(main_dir, "src/components/PlannerLibrary.jsx")
ai_planner_path = os.path.join(main_dir, "src/lib/aiPlanner.js")

# 1. Restore/copy files from Untitled/roomforge
print("Copying planner.js and aiPlanner.js...")
with open(os.path.join(untitled_dir, "src/lib/planner.js"), "r", encoding="utf-8") as f:
    planner_js_content = f.read()
with open(planner_js_path, "w", encoding="utf-8") as f:
    f.write(planner_js_content)

with open(os.path.join(untitled_dir, "src/lib/aiPlanner.js"), "r", encoding="utf-8") as f:
    ai_planner_content = f.read()
with open(ai_planner_path, "w", encoding="utf-8") as f:
    f.write(ai_planner_content)

# 2. Resolve App.jsx conflicts
print("Resolving App.jsx...")
with open(os.path.join(untitled_dir, "src/App.jsx"), "r", encoding="utf-8") as f:
    app_jsx = f.read()

# Define the three conflict resolutions
conflict_1_target = """<<<<<<< Updated upstream
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
>>>>>>> Stashed changes"""

conflict_1_resolution = """  const [wallComposer, setWallComposer] = useState(null);
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
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem('roomforge.lang') ?? 'en';
  });
  const [commercialArea, setCommercialArea] = useState(48);"""

conflict_2_target = """<<<<<<< Updated upstream
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
>>>>>>> Stashed changes"""

conflict_2_resolution = """          <div className="theme-toggle-row">
            <button type="button" className={`filter-chip ${planningMode === 'room' ? 'active' : ''}`} onClick={() => setPlanningMode('room')}>
              Для жилья
            </button>
            <button
              type="button"
              className={`filter-chip ${planningMode === 'business' ? 'active' : ''}`}
              onClick={() => setPlanningMode('business')}
            >
              Для бизнеса
            </button>"""

# Modify property type selection to use segment group when room mode, else dropdown
# We can find where type selector is:
type_selector_target = """            {planningMode === 'business' ? (
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
            )}"""

type_selector_resolution = """            {planningMode === 'business' ? (
              <SelectField
                label="Формат бизнеса"
                testId="workspace-business-profile-select"
                value={businessProfile.id}
                onChange={handleBusinessProfileChange}
                options={BUSINESS_PROFILES.map((profile) => ({ value: profile.id, label: profile.label }))}
              />
            ) : (
              <div className="control-stack">
                <label className="select-field">
                  <span>Тип объекта</span>
                  <div className="segment-group">
                    {PROPERTY_TYPES.map((type) => (
                      <SegmentButton
                        key={type.id}
                        active={state.project.propertyType === type.id}
                        onClick={() => {
                          handlePropertyTypeChange(type.id);
                        }}
                      >
                        {getRussianPropertyTypeLabel(type)}
                      </SegmentButton>
                    ))}
                  </div>
                </label>
              </div>
            )}"""

conflict_3_target = """<<<<<<< Updated upstream
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
>>>>>>> Stashed changes"""

conflict_3_resolution = """        {planningMode === 'room' && (
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
            <span>Режим просмотра</span>
          </div>
          <div className="segment-group">
            {['2d', 'isometric'].map((mode) => (
              <SegmentButton key={mode} active={state.activeViewMode === mode} onClick={() => setState((current) => ({ ...current, activeViewMode: mode }))}>
                {mode === '2d' ? '2D' : 'Изометрия'}
              </SegmentButton>
            ))}
          </div>
        </div>"""

# Perform replacements in App.jsx
if conflict_1_target in app_jsx:
    app_jsx = app_jsx.replace(conflict_1_target, conflict_1_resolution)
else:
    print("WARNING: Conflict 1 target not found in App.jsx!")

if conflict_2_target in app_jsx:
    app_jsx = app_jsx.replace(conflict_2_target, conflict_2_resolution)
else:
    print("WARNING: Conflict 2 target not found in App.jsx!")

if type_selector_target in app_jsx:
    app_jsx = app_jsx.replace(type_selector_target, type_selector_resolution)
else:
    print("WARNING: Type selector target not found in App.jsx!")

if conflict_3_target in app_jsx:
    app_jsx = app_jsx.replace(conflict_3_target, conflict_3_resolution)
else:
    print("WARNING: Conflict 3 target not found in App.jsx!")

with open(app_jsx_path, "w", encoding="utf-8") as f:
    f.write(app_jsx)


# 3. Resolve PlannerScene.jsx conflicts
print("Resolving PlannerScene.jsx...")
with open(os.path.join(untitled_dir, "src/components/PlannerScene.jsx"), "r", encoding="utf-8") as f:
    scene_jsx = f.read()

conflict_scene_target = """<<<<<<< Updated upstream
        <gridHelper args={[Math.max(planeSize[0], planeSize[1]), Math.max(12, Math.round(Math.max(planeSize[0], planeSize[1]))), palette.grid, palette.grid]} position={[focus[0], 0.02, focus[2]]} />
=======
        <gridHelper args={[60, 60, palette.line, palette.grid]} position={[focus[0], -0.07, focus[2]]} />
>>>>>>> Stashed changes"""

conflict_scene_resolution = """        <gridHelper args={[Math.max(planeSize[0], planeSize[1]), Math.max(12, Math.round(Math.max(planeSize[0], planeSize[1]))), palette.grid, palette.grid]} position={[focus[0], 0.02, focus[2]]} />"""

if conflict_scene_target in scene_jsx:
    scene_jsx = scene_jsx.replace(conflict_scene_target, conflict_scene_resolution)
else:
    print("WARNING: Scene conflict target not found!")

with open(planner_scene_path, "w", encoding="utf-8") as f:
    f.write(scene_jsx)


# 4. Update plannerData.js with commercial templates from BusinessForge
print("Updating plannerData.js...")
with open(os.path.join(untitled_dir, "src/data/plannerData.js"), "r", encoding="utf-8") as f:
    pdata = f.read()

# PROPERTY_TYPES updates are already in untitled/src/data/plannerData.js (which we read)
# We need to insert the 4 business templates from BusinessForge right before vegetable-shop template.
# Let's read BusinessForge templates.
with open(os.path.join(bf_dir, "src/data/plannerData.js"), "r", encoding="utf-8") as f:
    bf_pdata = f.read()

# We can search for the 4 templates in BusinessForge
showroom_template_code = """  {
    id: 'showroom-boutique',
    label: 'Fashion Showroom',
    propertyType: 'retail',
    floors: [
      createFloor('floor-1', 'Floor 1', 0, [
        createRoom({
          id: 'showroom-main',
          floorId: 'floor-1',
          label: 'Retail Hall',
          roomType: 'showroom',
          x: 0,
          z: 0,
          width: 8,
          depth: 6,
          items: [
            createPlacedItem({ id: 'show-shelving-1', catalogId: 'shelving-unit', x: 1.5, z: 1.5 }),
            createPlacedItem({ id: 'show-shelving-2', catalogId: 'shelving-unit', x: 6.5, z: 1.5 }),
            createPlacedItem({ id: 'show-cabinet', catalogId: 'display-cabinet', x: 4, z: 1.8 }),
            createPlacedItem({ id: 'show-console', catalogId: 'console-table', x: 4, z: 4.5 }),
            createPlacedItem({ id: 'show-mirror', catalogId: 'mirror', x: 1.2, z: 4 }),
          ],
        }),
      ]),
    ],
  },
  {
    id: 'market-store',
    label: 'Mini Market',
    propertyType: 'retail',
    floors: [
      createFloor('floor-1', 'Floor 1', 0, [
        createRoom({
          id: 'market-main',
          floorId: 'floor-1',
          label: 'Retail Hall',
          roomType: 'showroom',
          x: 0,
          z: 0,
          width: 8,
          depth: 6,
          items: [
            createPlacedItem({ id: 'market-fridge', catalogId: 'refrigerator', x: 1.5, z: 1.5 }),
            createPlacedItem({ id: 'market-shelf-1', catalogId: 'shelving-unit', x: 4, z: 1.5 }),
            createPlacedItem({ id: 'market-shelf-2', catalogId: 'shelving-unit', x: 6.5, z: 1.5 }),
            createPlacedItem({ id: 'market-cashier', catalogId: 'cash-desk', x: 4, z: 4.5 }),
            createPlacedItem({ id: 'market-terminal', catalogId: 'contactless-terminal', x: 4, z: 3.8 }),
          ],
        }),
      ]),
    ],
  },
  {
    id: 'shawarma-express',
    label: 'Shawarma Express',
    propertyType: 'food-service',
    floors: [
      createFloor('floor-1', 'Floor 1', 0, [
        createRoom({
          id: 'shawarma-main-room',
          floorId: 'floor-1',
          label: 'Service Area',
          roomType: 'kitchen',
          x: 0,
          z: 0,
          width: 6,
          depth: 5,
          items: [
            createPlacedItem({ id: 'sh-grill', catalogId: 'shawarma-grill', x: 1.5, z: 1.5 }),
            createPlacedItem({ id: 'sh-station', catalogId: 'grill-station', x: 3, z: 1.5 }),
            createPlacedItem({ id: 'sh-prep', catalogId: 'prep-counter', x: 4.5, z: 1.5 }),
            createPlacedItem({ id: 'sh-cold', catalogId: 'refrigerated-counter', x: 2, z: 3.5 }),
            createPlacedItem({ id: 'sh-cash', catalogId: 'cash-desk', x: 4.5, z: 3.8 }),
            createPlacedItem({ id: 'sh-terminal', catalogId: 'contactless-terminal', x: 4.5, z: 3.1 }),
          ],
        }),
      ]),
    ],
  },
  {
    id: 'cafe-pizzeria',
    label: 'Cozy Cafe',
    propertyType: 'food-service',
    floors: [
      createFloor('floor-1', 'Floor 1', 0, [
        createRoom({
          id: 'cafe-kitchen',
          floorId: 'floor-1',
          label: 'Kitchen & Prep',
          roomType: 'kitchen',
          x: 0,
          z: 0,
          width: 4,
          depth: 5,
          items: [
            createPlacedItem({ id: 'cf-fridge', catalogId: 'refrigerator', x: 1.5, z: 1.5 }),
            createPlacedItem({ id: 'cf-sink', catalogId: 'kitchen-sink', x: 3, z: 1.5 }),
            createPlacedItem({ id: 'cf-island', catalogId: 'kitchen-island', x: 2.5, z: 3.5 }),
          ],
        }),
        createRoom({
          id: 'cafe-hall',
          floorId: 'floor-1',
          label: 'Service Area',
          roomType: 'dining',
          x: 4.5,
          z: 0,
          width: 6,
          depth: 5,
          items: [
            createPlacedItem({ id: 'cf-bar', catalogId: 'bar-counter', x: 1.5, z: 2.5 }),
            createPlacedItem({ id: 'cf-stool-1', catalogId: 'bar-stool', x: 0.7, z: 2.5 }),
            createPlacedItem({ id: 'cf-stool-2', catalogId: 'bar-stool', x: 0.7, z: 3.5 }),
            createPlacedItem({ id: 'cf-table-1', catalogId: 'dining-table', x: 4.5, z: 1.5 }),
            createPlacedItem({ id: 'cf-chair-1', catalogId: 'dining-chair', x: 4.5, z: 0.7 }),
            createPlacedItem({ id: 'cf-chair-2', catalogId: 'dining-chair', x: 4.5, z: 2.3 }),
          ],
        }),
      ]),
    ],
  },"""

# Change propertyType from 'retail' / 'food-service' to 'commercial' to make them align with the 'Commercial' property type tab.
showroom_template_code_commercial = showroom_template_code.replace("propertyType: 'retail'", "propertyType: 'commercial'").replace("propertyType: 'food-service'", "propertyType: 'commercial'")

# Insert before vegetable-shop template
vegetable_shop_anchor = "  {\n    id: 'vegetable-shop',"

if vegetable_shop_anchor in pdata:
    pdata = pdata.replace(vegetable_shop_anchor, showroom_template_code_commercial + "\n" + vegetable_shop_anchor)
else:
    print("WARNING: vegetable-shop template not found in plannerData.js!")

with open(planner_data_path, "w", encoding="utf-8") as f:
    f.write(pdata)


# 5. Copy PlannerLibrary.jsx from BusinessForge
print("Copying PlannerLibrary.jsx...")
with open(os.path.join(bf_dir, "src/components/PlannerLibrary.jsx"), "r", encoding="utf-8") as f:
    lib_jsx = f.read()
with open(planner_library_path, "w", encoding="utf-8") as f:
    f.write(lib_jsx)


# 6. Append CSS styles to index.css
print("Appending index.css styles...")
with open(index_css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

# We extract from line 1286 to end of BusinessForge/src/index.css
with open(os.path.join(bf_dir, "src/index.css"), "r", encoding="utf-8") as f:
    bf_css = f.readlines()

new_styles = "".join(bf_css[1286:])

with open(index_css_path, "w", encoding="utf-8") as f:
    f.write(css_content + "\n\n/* Merged Business/Commercial styles */\n" + new_styles)


# 7. Update russian.js
print("Updating russian.js...")
with open(os.path.join(untitled_dir, "src/lib/russian.js"), "r", encoding="utf-8") as f:
    russian_content = f.read()

# We need to insert:
# - 'showroom-boutique': 'Модный шоурум',
# - 'market-store': 'Мини-маркет',
# - 'shawarma-express': 'Шаурма Экспресс',
# - 'cafe-pizzeria': 'Уютное кафе',
# into TEMPLATE_LABELS
template_labels_anchor = "const TEMPLATE_LABELS = {"
template_labels_additions = """const TEMPLATE_LABELS = {
  'showroom-boutique': 'Модный шоурум',
  'market-store': 'Мини-маркет',
  'shawarma-express': 'Шаурма Экспресс',
  'cafe-pizzeria': 'Уютное кафе',
  'vegetable-shop': 'Овощная лавка',"""

if template_labels_anchor in russian_content:
    russian_content = russian_content.replace(template_labels_anchor, template_labels_additions)
else:
    print("WARNING: TEMPLATE_LABELS anchor not found in russian.js!")

# - 'commercial': 'Коммерция',
# into PROPERTY_TYPE_LABELS
property_type_anchor = "const PROPERTY_TYPE_LABELS = {"
property_type_additions = """const PROPERTY_TYPE_LABELS = {
  commercial: 'Коммерция',"""

if property_type_anchor in russian_content:
    russian_content = russian_content.replace(property_type_anchor, property_type_additions)
else:
    print("WARNING: PROPERTY_TYPE_LABELS anchor not found in russian.js!")

with open(russian_js_path, "w", encoding="utf-8") as f:
    f.write(russian_content)

print("Merge and conflict resolution script completed successfully!")
