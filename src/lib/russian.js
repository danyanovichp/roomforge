const CATEGORY_LABELS = {
  'living-room': 'Гостиная',
  bedroom: 'Спальня',
  kitchen: 'Кухня',
  dining: 'Столовая',
  bathroom: 'Ванная',
  entryway: 'Прихожая',
  office: 'Офис',
  'food-service': 'Фуд-сервис',
  balcony: 'Балкон',
  lighting: 'Свет',
  decor: 'Декор',
  textiles: 'Текстиль',
  storage: 'Хранение',
  'climate-engineering': 'Климат и инженерия',
  'architectural-elements': 'Архитектурные элементы',
  fitness: 'Фитнес',
  hobbies: 'Хобби',
  unique: 'Уникальные элементы',
  kids: 'Детская',
};

const ITEM_LABELS = {
  sofa: 'Диван',
  armchair: 'Кресло',
  'coffee-table': 'Журнальный столик',
  'tv-stand': 'ТВ-тумба',
  television: 'Телевизор',
  bookcase: 'Книжный шкаф',
  'console-table': 'Консольный стол',
  pouf: 'Пуф',
  bench: 'Скамья',
  'decorative-fireplace': 'Декоративный камин',
  bed: 'Кровать',
  mattress: 'Матрас',
  nightstand: 'Тумба',
  dresser: 'Комод',
  wardrobe: 'Шкаф',
  'vanity-table': 'Туалетный столик',
  blanket: 'Плед',
  pillow: 'Подушка',
  'floor-mirror': 'Напольное зеркало',
  desk: 'Стол',
  'office-chair': 'Офисное кресло',
  monitor: 'Монитор',
  computer: 'Компьютер',
  keyboard: 'Клавиатура',
  mouse: 'Мышь',
  'notice-board': 'Доска заметок',
  bookshelf: 'Стеллаж',
  cabinet: 'Шкафчик',
  'ceiling-light': 'Потолочный светильник',
  chandelier: 'Люстра',
  'wall-lamp': 'Настенный светильник',
  'desk-lamp': 'Настольная лампа',
  'bar-counter': 'Барная стойка',
  'kitchen-island': 'Кухонный остров',
  refrigerator: 'Холодильник',
  cooktop: 'Варочная поверхность',
  microwave: 'Микроволновка',
  dishwasher: 'Посудомоечная машина',
  'range-hood': 'Кухонная вытяжка',
  'dining-table': 'Обеденный стол',
  'dining-chair': 'Обеденный стул',
  sideboard: 'Буфет',
  buffet: 'Сервант',
  'table-runner': 'Дорожка на стол',
  'decorative-plates': 'Декоративные тарелки',
  'bar-stool': 'Барный стул',
  'kitchen-sink': 'Кухонная мойка',
  bathtub: 'Ванна',
  'shower-cabin': 'Душевая кабина',
  toilet: 'Унитаз',
  'bathroom-sink': 'Раковина',
  'heated-towel-rail': 'Полотенцесушитель',
  'backlit-mirror': 'Зеркало с подсветкой',
  'bathroom-shelf': 'Полка для ванной',
  'shower-curtain': 'Штора для душа',
  'coat-rack': 'Вешалка',
  'shoe-rack': 'Обувница',
  'entry-bench': 'Банкетка',
  'umbrella-stand': 'Подставка для зонтов',
  'key-holder': 'Ключница',
  'door-mat': 'Коврик у двери',
  'hallway-console': 'Консоль в прихожую',
  'display-cabinet': 'Витрина',
  'shelving-unit': 'Система хранения',
  chest: 'Сундук',
  basket: 'Корзина',
  'storage-box': 'Контейнер',
  organizer: 'Органайзер',
  'side-cabinet': 'Тумба',
  'floor-lamp': 'Торшер',
  mirror: 'Зеркало',
  painting: 'Картина',
  poster: 'Постер',
  'photo-frame': 'Фоторамка',
  'panel-art': 'Настенное панно',
  tapestry: 'Гобелен',
  vase: 'Ваза',
  figurine: 'Фигурка',
  candle: 'Свеча',
  clock: 'Часы',
  rug: 'Ковер',
  runner: 'Дорожка',
  'decorative-cushion': 'Декоративная подушка',
  curtains: 'Шторы',
  blinds: 'Жалюзи',
  'roman-shade': 'Римская штора',
  'plaid-throw': 'Плед',
  tablecloth: 'Скатерть',
  'air-conditioner': 'Кондиционер',
  heater: 'Обогреватель',
  fan: 'Вентилятор',
  humidifier: 'Увлажнитель',
  radiator: 'Радиатор',
  'ventilation-grille': 'Вентиляционная решетка',
  'water-purifier': 'Фильтр для воды',
  door: 'Дверь',
  window: 'Окно',
  stair: 'Лестница',
  molding: 'Молдинг',
  baseboard: 'Плинтус',
  cornice: 'Карниз',
  'decorative-brick-panel': 'Панель под кирпич',
  'switch-panel': 'Блок выключателей',
  treadmill: 'Беговая дорожка',
  'exercise-bike': 'Велотренажер',
  dumbbells: 'Гантели',
  'yoga-mat': 'Коврик для йоги',
  'weight-bench': 'Силовая скамья',
  'pull-up-bar': 'Турник',
  'resistance-bands': 'Эспандеры',
  'fitness-ball': 'Фитбол',
  aquarium: 'Аквариум',
  fireplace: 'Камин',
  fountain: 'Фонтан',
  'round-bed': 'Круглая кровать',
  hammock: 'Гамак',
  'swing-chair': 'Подвесное кресло',
  'bonsai-tree': 'Бонсай',
  terrarium: 'Террариум',
  'shawarma-grill': 'Аппарат для шаурмы',
  'grill-station': 'Гриль-станция',
  'vertical-spit': 'Вертел',
  'prep-counter': 'Стол подготовки',
  'refrigerated-counter': 'Холодильный стол',
  'undercounter-fridge': 'Подстольный холодильник',
  'exhaust-hood': 'Вытяжной зонт',
  'cash-desk': 'Кассовая стойка',
  'contactless-terminal': 'Терминал оплаты',
  'handwash-sink': 'Раковина для рук',
  'sauce-station': 'Соусная станция',
  'packing-shelf': 'Полка выдачи',
};

const ITEM_DESCRIPTIONS = {
  sofa: 'Основной мягкий акцент для зоны отдыха.',
  armchair: 'Дополнительное кресло для ожидания или отдыха.',
  'coffee-table': 'Невысокий столик для lounge-зоны.',
  television: 'Экран для проверки дистанции просмотра и планировки.',
  bed: 'Основной элемент спальной зоны.',
  nightstand: 'Компактная прикроватная тумба.',
  wardrobe: 'Шкаф с запасом на открывание и подход.',
  desk: 'Рабочая поверхность для офиса или дома.',
  'office-chair': 'Мобильное рабочее кресло.',
  monitor: 'Монитор для рабочего места.',
  bookshelf: 'Вертикальное хранение для документов и декора.',
  cabinet: 'Закрытое хранение для вещей и расходников.',
  'ceiling-light': 'Основной верхний свет.',
  'bar-counter': 'Стойка сервиса или посадки.',
  'kitchen-island': 'Отдельный рабочий блок кухни.',
  refrigerator: 'Высокое холодильное хранение.',
  'dining-table': 'Стол для посадки и приема гостей.',
  'bar-stool': 'Высокое место посадки у стойки.',
  'kitchen-sink': 'Мойка для кухонной зоны.',
  'display-cabinet': 'Витрина для выкладки товара.',
  'shelving-unit': 'Открытая система хранения.',
  'side-cabinet': 'Низкая сервисная тумба.',
  'floor-lamp': 'Напольный акцентный свет.',
  mirror: 'Зеркало для визуального расширения пространства.',
  rug: 'Ковер для выделения зоны.',
  stair: 'Вертикальная связь между уровнями.',
  'shawarma-grill': 'Вертикальный аппарат для жарки мяса и основной горячей линии.',
  'grill-station': 'Горячая гриль-станция для быстрого финиша и подогрева.',
  'vertical-spit': 'Дополнительный вертел или запасной модуль горячей линии.',
  'prep-counter': 'Основной стол сборки и упаковки заказов.',
  'refrigerated-counter': 'Холодильный стол для ингредиентов и mise en place.',
  'undercounter-fridge': 'Холодильник под рабочей поверхностью рядом со сборкой.',
  'exhaust-hood': 'Вытяжной зонт над горячим оборудованием.',
  'cash-desk': 'Компактная кассовая стойка для расчета и выдачи.',
  'contactless-terminal': 'Терминал бесконтактной оплаты.',
  'handwash-sink': 'Отдельная мойка для санитарного контура.',
  'sauce-station': 'Станция для соусов и доп-комплектации.',
  'packing-shelf': 'Полка для упаковки, пакетов и готовых заказов.',
};

const STYLE_LABELS = {
  minimal: 'Минимализм',
  scandinavian: 'Сканди',
  japandi: 'Джапанди',
  loft: 'Лофт',
  'warm-neutral': 'Теплый нейтральный',
  'modern-classic': 'Современная классика',
};

const LIGHTING_LABELS = {
  day: 'День',
  evening: 'Вечер',
  'warm-light': 'Теплый свет',
  'cool-light': 'Холодный свет',
  night: 'Ночь',
};

const TEMPLATE_LABELS = {
  studio: 'Студия',
  'one-bedroom': '1-комнатная квартира',
  'two-bedroom': '2-комнатная квартира',
  'house-80': 'Дом 80 м²',
  'house-120': 'Дом 120 м²',
  'office-template': 'Офис',
  'bedroom-template': 'Спальня',
  'kitchen-living-room': 'Кухня-гостиная',
};

const ROOM_LABELS = {
  'Living Room': 'Гостиная',
  Bedroom: 'Спальня',
  'Bedroom A': 'Спальня A',
  'Bedroom B': 'Спальня B',
  Kitchen: 'Кухня',
  'Kitchen Dining': 'Кухня-столовая',
  Lounge: 'Лаунж',
  Hall: 'Холл',
  Office: 'Офис',
  'Master Bedroom': 'Мастер-спальня',
  'Kitchen-Living Room': 'Кухня-гостиная',
};

const FLOOR_LABELS = {
  'Floor 1': 'Этаж 1',
  'Ground Floor': '1 этаж',
  'Upper Floor': '2 этаж',
};

const PROPERTY_TYPE_LABELS = {
  apartment: 'Квартира',
  house: 'Дом',
};

export function getRussianCategoryLabel(category) {
  return CATEGORY_LABELS[category?.id] ?? category?.label ?? '';
}

export function getRussianItemLabel(catalogItemOrId) {
  const id = typeof catalogItemOrId === 'string' ? catalogItemOrId : catalogItemOrId?.id;
  const fallback = typeof catalogItemOrId === 'string' ? catalogItemOrId : catalogItemOrId?.label;
  return ITEM_LABELS[id] ?? fallback ?? '';
}

export function getRussianItemDescription(catalogItem) {
  return ITEM_DESCRIPTIONS[catalogItem?.id] ?? 'Предмет для текущего сценария планировки и расстановки.';
}

export function getRussianStyleLabel(stylePreset) {
  const id = typeof stylePreset === 'string' ? stylePreset : stylePreset?.id;
  const fallback = typeof stylePreset === 'string' ? stylePreset : stylePreset?.label;
  return STYLE_LABELS[id] ?? fallback ?? '';
}

export function getRussianLightingLabel(lighting) {
  const id = typeof lighting === 'string' ? lighting : lighting?.id;
  const fallback = typeof lighting === 'string' ? lighting : lighting?.label;
  return LIGHTING_LABELS[id] ?? fallback ?? '';
}

export function getRussianTemplateLabel(template) {
  return TEMPLATE_LABELS[template?.id] ?? template?.label ?? '';
}

export function getRussianRoomLabel(room) {
  return ROOM_LABELS[room?.label] ?? room?.label ?? '';
}

export function getRussianFloorLabel(floor) {
  return FLOOR_LABELS[floor?.label] ?? floor?.label ?? '';
}

export function getRussianPropertyTypeLabel(propertyType) {
  const id = typeof propertyType === 'string' ? propertyType : propertyType?.id;
  const fallback = typeof propertyType === 'string' ? propertyType : propertyType?.label;
  return PROPERTY_TYPE_LABELS[id] ?? fallback ?? '';
}
